create table public.niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.niches to anon, authenticated;
grant select, insert, update, delete on public.niches to authenticated;
grant all on public.niches to service_role;
alter table public.niches enable row level security;
create policy "Public read niches"
  on public.niches for select
  using (visible = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins write niches"
  on public.niches for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text,
  created_at timestamptz not null default now()
);

grant insert on public.page_views to anon, authenticated;
grant select on public.page_views to authenticated;
grant all on public.page_views to service_role;
alter table public.page_views enable row level security;
create policy "Anyone can record page views"
  on public.page_views for insert
  with check (true);
create policy "Admins read page views"
  on public.page_views for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

alter table public.projects
  add column if not exists niche_id uuid references public.niches(id) on delete set null;
alter table public.projects
  add column if not exists source_url text;
alter table public.projects
  add column if not exists likes_count integer not null default 0;

create or replace function public.increment_project_likes(p_project_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.projects set likes_count = likes_count + 1 where id = p_project_id;
$$;
grant execute on function public.increment_project_likes(uuid) to anon, authenticated;
