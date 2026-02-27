-- Ledger Configuration (singleton per admin)
create table public.ledger_config (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  deposit_amount numeric(10,2) not null check (deposit_amount > 0),
  week_filter jsonb not null default '{"0":false,"1":true,"2":true,"3":true,"4":true,"5":true,"6":false}',
  payment_goal numeric(12,2) not null default 0 check (payment_goal >= 0),
  start_date date not null,
  admin_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(admin_id)
);

-- Students
create table public.students (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledger_config(id) on delete cascade,
  name text not null,
  sex text not null check (sex in ('male', 'female', 'other')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_students_ledger on public.students(ledger_id);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  payment_date date not null,
  created_at timestamptz not null default now(),
  recorded_by uuid not null references auth.users(id)
);

create index idx_payments_student on public.payments(student_id);
create index idx_payments_date on public.payments(payment_date);
create index idx_payments_student_date on public.payments(student_id, payment_date);

-- Calendar Overrides (explicit holidays / no-class days)
create table public.calendar_overrides (
  id uuid primary key default gen_random_uuid(),
  override_date date unique not null,
  status text not null check (status in ('holiday', 'no_class')),
  label text,
  ledger_id uuid not null references public.ledger_config(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_calendar_overrides_date on public.calendar_overrides(override_date);
create index idx_calendar_overrides_ledger on public.calendar_overrides(ledger_id);

-- Bug Reports
create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  screenshot_url text,
  reported_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Updated_at trigger function
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_ledger_config_updated_at before update on public.ledger_config
  for each row execute function public.update_updated_at();
create trigger update_students_updated_at before update on public.students
  for each row execute function public.update_updated_at();
