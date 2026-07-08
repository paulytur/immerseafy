-- Fix profile id mismatch and RLS read for own profile

drop policy if exists "Staff can view own profile" on public.profiles;
drop policy if exists "Authenticated users read own profile" on public.profiles;

create policy "Authenticated users read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Ensure every auth user has a profile with matching id
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data ->> 'role', 'admin')
from auth.users u
on conflict (id) do update
  set
    email = excluded.email,
    role = coalesce(public.profiles.role, excluded.role);

-- Verify
select u.email, u.id as auth_id, p.id as profile_id, p.role
from auth.users u
left join public.profiles p on p.id = u.id;
