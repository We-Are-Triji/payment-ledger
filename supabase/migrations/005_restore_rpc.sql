-- Atomic restore function: runs as a single transaction
-- If any step fails, the entire operation rolls back
create or replace function public.restore_backup(
  p_ledger_id uuid,
  p_config jsonb,
  p_students jsonb,
  p_payments jsonb,
  p_overrides jsonb
) returns void as $$
declare
  v_student jsonb;
  v_payment jsonb;
  v_override jsonb;
  v_old_id text;
  v_new_id uuid;
  v_student_id uuid;
begin
  -- Verify caller owns this ledger
  if not exists (
    select 1 from public.ledger_config
    where id = p_ledger_id and admin_id = auth.uid()
  ) then
    raise exception 'Unauthorized: ledger not owned by caller';
  end if;

  -- 1. Delete existing data (students cascade-deletes payments)
  delete from public.calendar_overrides where ledger_id = p_ledger_id;
  delete from public.students where ledger_id = p_ledger_id;

  -- 2. Update config (preserve id, admin_id, created_at)
  update public.ledger_config set
    name = p_config->>'name',
    deposit_amount = (p_config->>'deposit_amount')::numeric,
    week_filter = p_config->'week_filter',
    payment_goal = (p_config->>'payment_goal')::numeric,
    start_date = (p_config->>'start_date')::date
  where id = p_ledger_id;

  -- 3. Create temp table for student ID mapping
  create temp table _student_id_map (
    old_id text primary key,
    new_id uuid not null
  ) on commit drop;

  -- 4. Insert students and build mapping
  for v_student in select * from jsonb_array_elements(p_students)
  loop
    v_new_id := gen_random_uuid();
    v_old_id := v_student->>'id';

    insert into public.students (id, ledger_id, name, sex, avatar_url)
    values (
      v_new_id,
      p_ledger_id,
      v_student->>'name',
      v_student->>'sex',
      v_student->>'avatar_url'
    );

    insert into _student_id_map (old_id, new_id) values (v_old_id, v_new_id);
  end loop;

  -- 5. Insert payments with mapped student IDs
  for v_payment in select * from jsonb_array_elements(p_payments)
  loop
    select new_id into v_student_id
    from _student_id_map
    where old_id = v_payment->>'student_id';

    if v_student_id is not null then
      insert into public.payments (student_id, amount, payment_date, recorded_by)
      values (
        v_student_id,
        (v_payment->>'amount')::numeric,
        (v_payment->>'payment_date')::date,
        (v_payment->>'recorded_by')::uuid
      );
    end if;
  end loop;

  -- 6. Insert calendar overrides
  for v_override in select * from jsonb_array_elements(p_overrides)
  loop
    insert into public.calendar_overrides (ledger_id, override_date, status, label)
    values (
      p_ledger_id,
      (v_override->>'override_date')::date,
      v_override->>'status',
      v_override->>'label'
    );
  end loop;
end;
$$ language plpgsql security definer;
