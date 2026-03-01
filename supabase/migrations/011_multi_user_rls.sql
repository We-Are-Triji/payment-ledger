-- ============================================================
-- Migration 011: Rewrite RLS policies for multi-user access
-- Replaces admin_id = auth.uid() checks with ledger_members-based access.
-- ============================================================

-- 1. Drop old policies -------------------------------------------

DROP POLICY IF EXISTS "Admin can manage own ledger config"          ON public.ledger_config;
DROP POLICY IF EXISTS "Admin can manage students in own ledger"     ON public.students;
DROP POLICY IF EXISTS "Admin can manage payments in own ledger"     ON public.payments;
DROP POLICY IF EXISTS "Admin can manage calendar overrides in own ledger" ON public.calendar_overrides;
DROP POLICY IF EXISTS "Users can manage backups for own ledgers"    ON public.backups;
DROP POLICY IF EXISTS "insert_own_ledger"                          ON public.audit_log;
DROP POLICY IF EXISTS "select_own_ledger"                          ON public.audit_log;

-- 2. Helper function ---------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_ledger_access(p_ledger_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ledger_members
    WHERE ledger_id = p_ledger_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. New policies ------------------------------------------------

-- LEDGER_CONFIG
CREATE POLICY "Members can view own ledgers"
  ON public.ledger_config FOR SELECT
  USING (id IN (SELECT ledger_id FROM public.ledger_members WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated can create ledger"
  ON public.ledger_config FOR INSERT
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Members can update ledger"
  ON public.ledger_config FOR UPDATE
  USING (id IN (SELECT ledger_id FROM public.ledger_members WHERE user_id = auth.uid()));

CREATE POLICY "Only owner can delete ledger"
  ON public.ledger_config FOR DELETE
  USING (admin_id = auth.uid());

-- STUDENTS
CREATE POLICY "Members can manage students"
  ON public.students FOR ALL
  USING (public.user_has_ledger_access(ledger_id));

-- PAYMENTS (via student → ledger)
CREATE POLICY "Members can manage payments"
  ON public.payments FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM public.students s
      WHERE public.user_has_ledger_access(s.ledger_id)
    )
  );

-- CALENDAR_OVERRIDES
CREATE POLICY "Members can manage overrides"
  ON public.calendar_overrides FOR ALL
  USING (public.user_has_ledger_access(ledger_id));

-- BACKUPS
CREATE POLICY "Members can manage backups"
  ON public.backups FOR ALL
  USING (public.user_has_ledger_access(ledger_id));

-- AUDIT_LOG (append-only: INSERT + SELECT)
CREATE POLICY "Members can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (public.user_has_ledger_access(ledger_id));

CREATE POLICY "Members can view audit logs"
  ON public.audit_log FOR SELECT
  USING (public.user_has_ledger_access(ledger_id));

-- LEDGER_MEMBERS
ALTER TABLE public.ledger_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view members"
  ON public.ledger_members FOR SELECT
  USING (public.user_has_ledger_access(ledger_id));

CREATE POLICY "Owner can add members"
  ON public.ledger_members FOR INSERT
  WITH CHECK (
    ledger_id IN (SELECT id FROM public.ledger_config WHERE admin_id = auth.uid())
  );

CREATE POLICY "Owner can remove members"
  ON public.ledger_members FOR DELETE
  USING (
    ledger_id IN (SELECT id FROM public.ledger_config WHERE admin_id = auth.uid())
    AND role != 'owner'
  );

-- LEDGER_INVITATIONS
ALTER TABLE public.ledger_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage invitations"
  ON public.ledger_invitations FOR ALL
  USING (
    ledger_id IN (SELECT id FROM public.ledger_config WHERE admin_id = auth.uid())
  );

CREATE POLICY "Authenticated can view invitation by token"
  ON public.ledger_invitations FOR SELECT
  USING (auth.role() = 'authenticated');

-- USER_PREFERENCES
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own prefs"
  ON public.user_preferences FOR ALL
  USING (user_id = auth.uid());

-- 4. Update restore_backup RPC to use membership check -----------

CREATE OR REPLACE FUNCTION public.restore_backup(
  p_ledger_id uuid,
  p_config    jsonb,
  p_students  jsonb,
  p_payments  jsonb,
  p_overrides jsonb
) RETURNS void AS $$
DECLARE
  v_student    jsonb;
  v_payment    jsonb;
  v_override   jsonb;
  v_old_id     text;
  v_new_id     uuid;
  v_student_id uuid;
BEGIN
  -- Verify caller is a member of this ledger
  IF NOT EXISTS (
    SELECT 1 FROM public.ledger_members
    WHERE ledger_id = p_ledger_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not a member of this ledger';
  END IF;

  -- 1. Delete existing data (students cascade-deletes payments)
  DELETE FROM public.calendar_overrides WHERE ledger_id = p_ledger_id;
  DELETE FROM public.students WHERE ledger_id = p_ledger_id;

  -- 2. Update config (preserve id, admin_id, created_at)
  UPDATE public.ledger_config SET
    name           = p_config->>'name',
    deposit_amount = (p_config->>'deposit_amount')::numeric,
    week_filter    = p_config->'week_filter',
    payment_goal   = (p_config->>'payment_goal')::numeric,
    start_date     = (p_config->>'start_date')::date
  WHERE id = p_ledger_id;

  -- 3. Create temp table for student ID mapping
  CREATE TEMP TABLE _student_id_map (
    old_id text PRIMARY KEY,
    new_id uuid NOT NULL
  ) ON COMMIT DROP;

  -- 4. Insert students and build mapping
  FOR v_student IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    v_new_id := gen_random_uuid();
    v_old_id := v_student->>'id';

    INSERT INTO public.students (id, ledger_id, name, sex, avatar_url)
    VALUES (v_new_id, p_ledger_id, v_student->>'name', v_student->>'sex', v_student->>'avatar_url');

    INSERT INTO _student_id_map (old_id, new_id) VALUES (v_old_id, v_new_id);
  END LOOP;

  -- 5. Insert payments with mapped student IDs
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    SELECT new_id INTO v_student_id
    FROM _student_id_map
    WHERE old_id = v_payment->>'student_id';

    IF v_student_id IS NOT NULL THEN
      INSERT INTO public.payments (student_id, amount, payment_date, recorded_by, method, voided_at)
      VALUES (
        v_student_id,
        (v_payment->>'amount')::numeric,
        (v_payment->>'payment_date')::date,
        (v_payment->>'recorded_by')::uuid,
        COALESCE(v_payment->>'method', 'manual'),
        (v_payment->>'voided_at')::timestamptz
      );
    END IF;
  END LOOP;

  -- 6. Insert calendar overrides
  FOR v_override IN SELECT * FROM jsonb_array_elements(p_overrides)
  LOOP
    INSERT INTO public.calendar_overrides (ledger_id, override_date, status, label)
    VALUES (
      p_ledger_id,
      (v_override->>'override_date')::date,
      v_override->>'status',
      v_override->>'label'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
