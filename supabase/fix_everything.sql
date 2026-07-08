-- ============================================================
-- ONE-TIME FIX: infinite recursion on profiles + admin access
-- Run entire file in Supabase SQL Editor
-- ============================================================

-- 1. Security definer helpers (bypass RLS safely)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

-- 2. Drop ALL existing profiles policies (clears recursion)
drop policy if exists "Staff can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Authenticated users read own profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "admins read all profiles" on public.profiles;
drop policy if exists "admins update profiles" on public.profiles;

-- 3. Recreate profiles policies (no direct self-subquery)
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "admins read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "admins update profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin());

-- 4. Fix other tables that referenced profiles directly
drop policy if exists "Staff can manage session slots" on public.session_slots;
drop policy if exists "Staff can manage bookings" on public.bookings;
drop policy if exists "Staff can view invoices" on public.invoices;
drop policy if exists "Staff can manage invoices" on public.invoices;
drop policy if exists "Staff can view site settings" on public.site_settings;
drop policy if exists "Admins can update site settings" on public.site_settings;

create policy "Staff can manage session slots"
  on public.session_slots for all
  to authenticated
  using (public.is_staff());

create policy "Staff can manage bookings"
  on public.bookings for all
  to authenticated
  using (public.is_staff());

create policy "Staff can view invoices"
  on public.invoices for select
  to authenticated
  using (public.is_staff());

create policy "Staff can manage invoices"
  on public.invoices for insert
  to authenticated
  with check (public.is_staff());

create policy "Staff can view site settings"
  on public.site_settings for select
  to authenticated
  using (public.is_staff());

create policy "Admins can update site settings"
  on public.site_settings for update
  to authenticated
  using (public.is_admin());

-- 5. Create/fix admin profile for hello@immerseafy.com
insert into public.profiles (id, email, full_name, role)
select id, email, 'Admin', 'admin'
from auth.users
where email = 'hello@immerseafy.com'
on conflict (id) do update
  set role = 'admin', email = excluded.email, full_name = excluded.full_name;

-- 6. Set auth metadata (fallback for the app)
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || '{"full_name": "Admin", "role": "admin"}'::jsonb
where email = 'hello@immerseafy.com';

-- 7. Verify
select u.email, u.id as auth_id, p.id as profile_id, p.role, u.raw_user_meta_data
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'hello@immerseafy.com';
