-- Fixes the 'media' bucket from 20261018110550: that migration likely
-- rolled back entirely (bucket never created, hence "bucket not found" on
-- upload) because `alter table storage.objects enable row level security`
-- requires owner privileges this project's migration role doesn't have —
-- storage.objects already ships with RLS enabled on every Supabase project,
-- so that statement was both redundant and the landmine. Dropped here, and
-- everything made idempotent so this is safe to run even if some of it
-- partially applied.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "Admins upload media" on storage.objects;
create policy "Admins upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update media" on storage.objects;
create policy "Admins update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete media" on storage.objects;
create policy "Admins delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
