-- ============================================================
-- Migration 014: Update restore_backup to include audit_log
-- Backups now include audit logs; restoring anchors the ledger
-- to the exact state at backup time, including system logs.
-- ============================================================

CREATE OR REPLACE FUNCTION public.restore_backup(
  p_ledger_id   uuid,
  p_config      jsonb,
  p_students    jsonb,
  p_payments    jsonb,
  p_overrides   jsonb,
  p_audit_logs  jsonb DEFAULT '[]'::jsonb
) RETURNS void AS $$
DECLARE
  v_student    jsonb;
  v_payment    jsonb;
  v_override   jsonb;
  v_audit      jsonb;
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

  -- Acquire advisory lock on the ledger to prevent concurrent operations
  PERFORM pg_advisory_xact_lock(hashtext(p_ledger_id::text));

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
