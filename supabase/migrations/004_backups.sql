-- Backup metadata
create table public.backups (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledger_config(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create index idx_backups_ledger on public.backups(ledger_id);

-- Storage bucket for backup JSON files
insert into storage.buckets (id, name, public)
values ('ledger-backups', 'ledger-backups', false)
on conflict (id) do nothing;

-- Storage policies for backups (scoped by owner)
create policy "Authenticated users can upload backups"
  on storage.objects for insert
  with check (bucket_id = 'ledger-backups' and auth.role() = 'authenticated');
create policy "Users can view own backups"
  on storage.objects for select
  using (bucket_id = 'ledger-backups' and owner_id = auth.uid());
create policy "Users can delete own backups"
  on storage.objects for delete
  using (bucket_id = 'ledger-backups' and owner_id = auth.uid());

-- RLS for backups table
alter table public.backups enable row level security;

create policy "Users can manage backups for own ledgers"
  on public.backups for all
  using (
    ledger_id in (
      select id from public.ledger_config where admin_id = auth.uid()
    )
  );
