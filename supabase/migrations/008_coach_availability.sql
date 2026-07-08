-- Coach availability (replaces slot/capacity scheduling)

create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (coach_id, date)
);

create index if not exists coach_availability_date_idx
  on public.coach_availability (date);

create index if not exists coaches_profile_id_idx
  on public.coaches (profile_id);

alter table public.coaches enable row level security;
alter table public.coach_availability enable row level security;

create policy "Anyone can read coaches"
  on public.coaches for select
  to anon, authenticated
  using (active = true);

create policy "Staff can read all coaches"
  on public.coaches for select
  to authenticated
  using (public.is_staff());

create policy "Admin can manage coaches"
  on public.coaches for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Anyone can read coach availability"
  on public.coach_availability for select
  to anon, authenticated
  using (true);

create policy "Staff can manage coach availability"
  on public.coach_availability for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

insert into public.coaches (name, slug) values
  ('Paul Yturzaita', 'paul-yturzaita'),
  ('Dominic Rivera', 'dominic-rivera'),
  ('J-lyn Guevarra', 'j-lyn-guevarra'),
  ('Zed Tanjista', 'zed-tanjista'),
  ('Lance Dusaban', 'lance-dusaban')
on conflict (slug) do nothing;
