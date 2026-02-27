-- Student profile images
insert into storage.buckets (id, name, public)
values ('student-avatars', 'student-avatars', true)
on conflict (id) do nothing;

-- Bug report screenshots
insert into storage.buckets (id, name, public)
values ('bug-screenshots', 'bug-screenshots', false)
on conflict (id) do nothing;

-- Storage policies: student avatars
create policy "Authenticated users can upload student avatars"
  on storage.objects for insert
  with check (bucket_id = 'student-avatars' and auth.role() = 'authenticated');
create policy "Anyone can view student avatars"
  on storage.objects for select
  using (bucket_id = 'student-avatars');
create policy "Authenticated users can update student avatars"
  on storage.objects for update
  using (bucket_id = 'student-avatars' and auth.role() = 'authenticated');
create policy "Authenticated users can delete student avatars"
  on storage.objects for delete
  using (bucket_id = 'student-avatars' and auth.role() = 'authenticated');

-- Storage policies: bug screenshots
create policy "Authenticated users can upload bug screenshots"
  on storage.objects for insert
  with check (bucket_id = 'bug-screenshots' and auth.role() = 'authenticated');
create policy "Authenticated users can view own bug screenshots"
  on storage.objects for select
  using (bucket_id = 'bug-screenshots' and auth.role() = 'authenticated');
