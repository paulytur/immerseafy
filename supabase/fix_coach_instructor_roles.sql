-- Allow coach and instructor roles on profiles (run if create-user fails)

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'staff', 'coach', 'instructor'));

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
      where id = auth.uid()
        and role in ('admin', 'staff', 'coach', 'instructor')
    )
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') in (
      'admin', 'staff', 'coach', 'instructor'
    );
$$;
