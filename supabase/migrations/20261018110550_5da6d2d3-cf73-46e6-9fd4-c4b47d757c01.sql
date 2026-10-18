-- Public storage bucket for admin-uploaded media (profile photo, hero
-- images/videos, brand logos, testimonial avatars, etc). Anyone can read
-- (the portfolio is public), only admins can write.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy "Public read media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Admins upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

create policy "Admins update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
