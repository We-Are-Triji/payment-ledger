-- ============================================================
-- Migration 019: Generalize "student" → "contributor"
-- Terminology + scope generalization only. No balance math,
-- schedule logic, or RLS/auth model changes.
--
-- Changes:
--   * students table            → contributors
--   * payments.student_id       → payments.contributor_id
--   * indexes / constraints / policies renamed accordingly
--   * drop students.sex column (scope decision #1)
--   * calendar_overrides.status "no_class" → "skip_day"
--   * restore_backup + get_public_balance_view RPCs updated
--
-- NOTE: The "ledger_members" concept (owner/admin roles) is a
-- DISTINCT concept and is intentionally left untouched.
-- NOTE: The storage bucket "student-avatars" is intentionally
-- NOT renamed here to avoid orphaning already-uploaded files.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Rename tables / columns
--    Guarded so this migration is idempotent and safe to re-run
--    even after a partial apply.
-- ----------------------------------------------------------------

DO $mig$
BEGIN
  -- students → contributors
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'students'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contributors'
  ) THEN
    ALTER TABLE public.students RENAME TO contributors;
  END IF;

  -- payments.student_id → payments.contributor_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE public.payments RENAME COLUMN student_id TO contributor_id;
  END IF;

  -- Drop the sex column (scope decision #1)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contributors' AND column_name = 'sex'
  ) THEN
    ALTER TABLE public.contributors DROP COLUMN sex;
  END IF;
END
$mig$;

-- ----------------------------------------------------------------
-- 2. Rename indexes (guarded)
-- ----------------------------------------------------------------

ALTER INDEX IF EXISTS public.idx_students_ledger RENAME TO idx_contributors_ledger;
ALTER INDEX IF EXISTS public.idx_payments_student RENAME TO idx_payments_contributor;
ALTER INDEX IF EXISTS public.idx_payments_student_date RENAME TO idx_payments_contributor_date;

-- ----------------------------------------------------------------
-- 3. Rename the updated_at trigger for consistency
-- ----------------------------------------------------------------

DROP TRIGGER IF EXISTS update_students_updated_at ON public.contributors;
DROP TRIGGER IF EXISTS update_contributors_updated_at ON public.contributors;
CREATE TRIGGER update_contributors_updated_at BEFORE UPDATE ON public.contributors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ----------------------------------------------------------------
-- 4. Recreate RLS policies with contributor naming
--    (policies follow the renamed table but keep the same rules)
-- ----------------------------------------------------------------

DROP POLICY IF EXISTS "Members can manage students" ON public.contributors;
DROP POLICY IF EXISTS "Members can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Members can manage contributors" ON public.contributors;

CREATE POLICY "Members can manage contributors"
  ON public.contributors FOR ALL
  USING (public.user_has_ledger_access(ledger_id));

CREATE POLICY "Members can manage payments"
  ON public.payments FOR ALL
  USING (
    contributor_id IN (
      SELECT c.id FROM public.contributors c
      WHERE public.user_has_ledger_access(c.ledger_id)
    )
  );

-- ----------------------------------------------------------------
-- 5. calendar_overrides status: "no_class" → "skip_day"
-- ----------------------------------------------------------------

-- Drop the old constraint first so the data update is not rejected by the
-- still-active check (which only permits 'holiday'/'no_class'). Guarded and
-- idempotent so a re-run after a partial apply succeeds.
ALTER TABLE public.calendar_overrides DROP CONSTRAINT IF EXISTS calendar_overrides_status_check;

UPDATE public.calendar_overrides SET status = 'skip_day' WHERE status = 'no_class';

ALTER TABLE public.calendar_overrides
  ADD CONSTRAINT calendar_overrides_status_check
  CHECK (status IN ('holiday', 'skip_day'));

-- ----------------------------------------------------------------
-- 6. Audit event types: student.* → contributor.*
--    (event_type is a free-text column; update existing rows.
--     member.* events are admin actions and stay untouched.)
-- ----------------------------------------------------------------

UPDATE public.audit_log SET event_type = 'contributor.create' WHERE event_type = 'student.create';
UPDATE public.audit_log SET event_type = 'contributor.update' WHERE event_type = 'student.update';
UPDATE public.audit_log SET event_type = 'contributor.delete' WHERE event_type = 'student.delete';

-- ----------------------------------------------------------------
-- 7. Rewrite restore_backup RPC to use contributor naming
--    Backup payloads still use the "students"/"student_id" keys
--    for backwards compatibility with existing backup files, but
--    write into the renamed table/column.
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.restore_backup(
  p_ledger_id   uuid,
  p_config      jsonb,
  p_students    jsonb,
  p_payments    jsonb,
  p_overrides   jsonb,
  p_audit_logs  jsonb DEFAULT '[]'::jsonb
) RETURNS void AS $$
DECLARE
  v_contributor    jsonb;
  v_payment        jsonb;
  v_override       jsonb;
  v_audit          jsonb;
  v_old_id         text;
  v_new_id         uuid;
  v_contributor_id uuid;
  v_status         text;
BEGIN
  -- Verify caller is the OWNER of this ledger (preserves migration 016 rule:
  -- restoring a backup is destructive, owner-only).
  IF NOT EXISTS (
    SELECT 1 FROM public.ledger_members
    WHERE ledger_id = p_ledger_id AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: only the ledger owner can restore backups';
  END IF;

  -- Acquire advisory lock on the ledger to prevent concurrent operations
  PERFORM pg_advisory_xact_lock(hashtext(p_ledger_id::text));

  -- 1. Delete existing data (contributors cascade-deletes payments)
  DELETE FROM public.calendar_overrides WHERE ledger_id = p_ledger_id;
  DELETE FROM public.contributors WHERE ledger_id = p_ledger_id;

  -- 2. Update config (preserve id, admin_id, created_at)
  UPDATE public.ledger_config SET
    name           = p_config->>'name',
    deposit_amount = (p_config->>'deposit_amount')::numeric,
    week_filter    = p_config->'week_filter',
    payment_goal   = (p_config->>'payment_goal')::numeric,
    start_date     = (p_config->>'start_date')::date
  WHERE id = p_ledger_id;

  -- 3. Create temp table for contributor ID mapping
  CREATE TEMP TABLE _contributor_id_map (
    old_id text PRIMARY KEY,
    new_id uuid NOT NULL
  ) ON COMMIT DROP;

  -- 4. Insert contributors and build mapping (sex is dropped)
  FOR v_contributor IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    v_new_id := gen_random_uuid();
    v_old_id := v_contributor->>'id';

    INSERT INTO public.contributors (id, ledger_id, name, avatar_url)
    VALUES (v_new_id, p_ledger_id, v_contributor->>'name', v_contributor->>'avatar_url');

    INSERT INTO _contributor_id_map (old_id, new_id) VALUES (v_old_id, v_new_id);
  END LOOP;

  -- 5. Insert payments with mapped contributor IDs
  --    (accepts both new "contributor_id" and legacy "student_id" keys)
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    SELECT new_id INTO v_contributor_id
    FROM _contributor_id_map
    WHERE old_id = COALESCE(v_payment->>'contributor_id', v_payment->>'student_id');

    IF v_contributor_id IS NOT NULL THEN
      INSERT INTO public.payments (contributor_id, amount, payment_date, recorded_by, method, voided_at)
      VALUES (
        v_contributor_id,
        (v_payment->>'amount')::numeric,
        (v_payment->>'payment_date')::date,
        (v_payment->>'recorded_by')::uuid,
        COALESCE(v_payment->>'method', 'manual'),
        (v_payment->>'voided_at')::timestamptz
      );
    END IF;
  END LOOP;

  -- 6. Insert calendar overrides (map legacy "no_class" → "skip_day")
  FOR v_override IN SELECT * FROM jsonb_array_elements(p_overrides)
  LOOP
    v_status := v_override->>'status';
    IF v_status = 'no_class' THEN
      v_status := 'skip_day';
    END IF;
    INSERT INTO public.calendar_overrides (ledger_id, override_date, status, label)
    VALUES (
      p_ledger_id,
      (v_override->>'override_date')::date,
      v_status,
      v_override->>'label'
    );
  END LOOP;

  -- 7. Restore audit logs (anchor to backup state)
  DELETE FROM public.audit_log WHERE ledger_id = p_ledger_id;

  FOR v_audit IN SELECT * FROM jsonb_array_elements(p_audit_logs)
  LOOP
    INSERT INTO public.audit_log (
      ledger_id, event_type, description, metadata, created_at, actor_id, actor_email
    ) VALUES (
      p_ledger_id,
      v_audit->>'event_type',
      v_audit->>'description',
      COALESCE(v_audit->'metadata', '{}'::jsonb),
      (v_audit->>'created_at')::timestamptz,
      (v_audit->>'actor_id')::uuid,
      v_audit->>'actor_email'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------
-- 8. Rewrite get_public_balance_view to use contributor naming.
--    The returned "students"/"payment_totals" JSON keys are kept
--    stable for the client, but the JSON objects no longer include
--    the dropped "sex" field.
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_public_balance_view(p_token uuid)
RETURNS TABLE (
  ledger_id uuid,
  ledger_name text,
  deposit_amount numeric,
  payment_goal numeric,
  start_date date,
  week_filter jsonb,
  students jsonb,
  payment_totals jsonb,
  overrides jsonb,
  access_mode text
) AS $$
DECLARE
  v_share RECORD;
  v_email text;
BEGIN
  SELECT
    s.ledger_id,
    s.access_mode,
    s.allowed_emails,
    lc.name AS ledger_name,
    lc.deposit_amount,
    lc.payment_goal,
    lc.start_date,
    lc.week_filter
  INTO v_share
  FROM public.ledger_public_shares s
  JOIN public.ledger_config lc ON lc.id = s.ledger_id
  WHERE s.token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Public balance link not found';
  END IF;

  IF v_share.access_mode = 'private' THEN
    RAISE EXCEPTION 'You are not permitted to view this balance link';
  END IF;

  IF v_share.access_mode = 'restricted' THEN
    v_email := lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
    IF v_email = '' OR NOT (v_email = ANY(v_share.allowed_emails)) THEN
      RAISE EXCEPTION 'You are not permitted to view this balance link';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    v_share.ledger_id,
    v_share.ledger_name,
    v_share.deposit_amount,
    v_share.payment_goal,
    v_share.start_date,
    v_share.week_filter,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ct.id,
            'ledger_id', ct.ledger_id,
            'name', ct.name,
            'avatar_url', ct.avatar_url,
            'created_at', ct.created_at,
            'updated_at', ct.updated_at
          )
          ORDER BY ct.name
        )
        FROM public.contributors ct
        WHERE ct.ledger_id = v_share.ledger_id
      ),
      '[]'::jsonb
    ),
    COALESCE(
      (
        SELECT jsonb_object_agg(t.contributor_id::text, t.total_paid)
        FROM (
          SELECT p.contributor_id, SUM(p.amount) AS total_paid
          FROM public.payments p
          JOIN public.contributors ct ON ct.id = p.contributor_id
          WHERE ct.ledger_id = v_share.ledger_id
            AND p.voided_at IS NULL
          GROUP BY p.contributor_id
        ) t
      ),
      '{}'::jsonb
    ),
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', co.id,
            'override_date', co.override_date,
            'status', co.status,
            'label', co.label,
            'ledger_id', co.ledger_id,
            'created_at', co.created_at
          )
          ORDER BY co.override_date
        )
        FROM public.calendar_overrides co
        WHERE co.ledger_id = v_share.ledger_id
      ),
      '[]'::jsonb
    ),
    v_share.access_mode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

REVOKE ALL ON FUNCTION public.get_public_balance_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_balance_view(uuid) TO anon, authenticated, service_role;
