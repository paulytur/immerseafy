-- Run in Supabase SQL Editor if you see "Access not set up" after login
-- Creates missing profiles for all auth users and grants admin role

insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data ->> 'role', 'admin')
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- Ensure your account is admin (change email if needed)
update public.profiles
set role = 'admin'
where email = 'hello@immerseafy.com';

-- Verify
select id, email, full_name, role from public.profiles;
