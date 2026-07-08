-- Allow is_staff/is_admin to read role from JWT metadata (fallback)

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin';
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'staff')
    )
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') in ('admin', 'staff');
$$;

-- INSERT requires WITH CHECK (USING alone does not allow inserts)
drop policy if exists "Staff can manage session slots" on public.session_slots;
drop policy if exists "Staff can manage bookings" on public.bookings;

create policy "Staff can manage session slots"
  on public.session_slots for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "Staff can manage bookings"
  on public.bookings for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());
