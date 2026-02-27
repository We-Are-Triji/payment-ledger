alter table public.ledger_config enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.calendar_overrides enable row level security;
alter table public.bug_reports enable row level security;

-- LEDGER CONFIG: admin-only
create policy "Admin can manage own ledger config"
  on public.ledger_config for all using (admin_id = auth.uid());

-- STUDENTS: via ledger ownership
create policy "Admin can manage students in own ledger"
  on public.students for all using (
    ledger_id in (select id from public.ledger_config where admin_id = auth.uid())
  );

-- PAYMENTS: via student -> ledger ownership
create policy "Admin can manage payments in own ledger"
  on public.payments for all using (
    student_id in (
      select s.id from public.students s
      join public.ledger_config lc on s.ledger_id = lc.id
      where lc.admin_id = auth.uid()
    )
  );

-- CALENDAR OVERRIDES: via ledger ownership
create policy "Admin can manage calendar overrides in own ledger"
  on public.calendar_overrides for all using (
    ledger_id in (select id from public.ledger_config where admin_id = auth.uid())
  );

-- BUG REPORTS: own reports only
create policy "Users can create bug reports"
  on public.bug_reports for insert with check (reported_by = auth.uid());
create policy "Users can view own bug reports"
  on public.bug_reports for select using (reported_by = auth.uid());
