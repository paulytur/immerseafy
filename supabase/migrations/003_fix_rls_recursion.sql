-- Fix: infinite recursion when profiles policies query profiles directly.
-- Uses security definer helpers that bypass RLS for role checks.

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

-- profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

-- session_slots
drop policy if exists "Staff can manage session slots" on public.session_slots;

create policy "Staff can manage session slots"
  on public.session_slots for all
  using (public.is_staff());

-- bookings
drop policy if exists "Staff can manage bookings" on public.bookings;

create policy "Staff can manage bookings"
  on public.bookings for all
  using (public.is_staff());

-- invoices
drop policy if exists "Staff can view invoices" on public.invoices;
drop policy if exists "Staff can manage invoices" on public.invoices;

create policy "Staff can view invoices"
  on public.invoices for select
  using (public.is_staff());

create policy "Staff can manage invoices"
  on public.invoices for insert
  with check (public.is_staff());

-- site_settings
drop policy if exists "Staff can view site settings" on public.site_settings;
drop policy if exists "Admins can update site settings" on public.site_settings;

create policy "Staff can view site settings"
  on public.site_settings for select
  using (public.is_staff());

create policy "Admins can update site settings"
  on public.site_settings for update
  using (public.is_admin());

-- storage (if buckets migration already ran)
drop policy if exists "Admins upload payment assets" on storage.objects;
drop policy if exists "Admins update payment assets" on storage.objects;

create policy "Admins upload payment assets"
  on storage.objects for insert
  with check (bucket_id = 'payment-assets' and public.is_admin());

create policy "Admins update payment assets"
  on storage.objects for update
  using (bucket_id = 'payment-assets' and public.is_admin());
