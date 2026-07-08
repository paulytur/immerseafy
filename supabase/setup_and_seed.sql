-- Immerseafy booking system

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('admin', 'staff')) default 'staff',
  created_at timestamptz not null default now()
);

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  qr_pay_image_url text,
  payment_expiry_hours int not null default 120,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1);

create table public.session_slots (
  id uuid primary key default gen_random_uuid(),
  service_slug text not null,
  date date not null,
  max_slots int not null default 4 check (max_slots > 0),
  booked_count int not null default 0 check (booked_count >= 0),
  price_cents int not null check (price_cents > 0),
  status text not null check (status in ('open', 'full', 'cancelled')) default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_slug, date)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  session_slot_id uuid not null references public.session_slots(id),
  reference text not null unique,
  payment_token text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  headcount int not null default 1 check (headcount > 0),
  status text not null check (
    status in ('pending', 'awaiting_payment', 'confirmed', 'expired', 'cancelled')
  ) default 'pending',
  payment_expires_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  approved_by uuid references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  invoice_number text not null unique,
  pdf_path text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index bookings_status_idx on public.bookings (status);
create index bookings_session_slot_id_idx on public.bookings (session_slot_id);
create index session_slots_date_idx on public.session_slots (date);
create index session_slots_status_idx on public.session_slots (status);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'staff')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger session_slots_updated_at
  before update on public.session_slots
  for each row execute function public.set_updated_at();

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.session_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.invoices enable row level security;

-- Role helpers (security definer avoids infinite recursion on profiles)
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

create policy "Staff can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

create policy "Public can view open future slots"
  on public.session_slots for select
  using (status = 'open' and date >= current_date);

create policy "Staff can manage session slots"
  on public.session_slots for all
  using (public.is_staff());

create policy "Staff can manage bookings"
  on public.bookings for all
  using (public.is_staff());

create policy "Staff can view invoices"
  on public.invoices for select
  using (public.is_staff());

create policy "Staff can manage invoices"
  on public.invoices for insert
  with check (public.is_staff());

create policy "Staff can view site settings"
  on public.site_settings for select
  using (public.is_staff());

create policy "Admins can update site settings"
  on public.site_settings for update
  using (public.is_admin());

-- Storage buckets (run in Supabase dashboard or via API)
-- payment-assets: QR Pay images (public read)
-- invoices: PDF files (private)
-- Storage buckets for QR Pay and invoices
insert into storage.buckets (id, name, public)
values
  ('payment-assets', 'payment-assets', true),
  ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Public read for QR images
create policy "Public read payment assets"
  on storage.objects for select
  using (bucket_id = 'payment-assets');

-- Admins upload QR images
create policy "Admins upload payment assets"
  on storage.objects for insert
  with check (bucket_id = 'payment-assets' and public.is_admin());

create policy "Admins update payment assets"
  on storage.objects for update
  using (bucket_id = 'payment-assets' and public.is_admin());

-- Service role handles invoice uploads via API
create policy "Service role manages invoices"
  on storage.objects for all
  using (bucket_id = 'invoices')
  with check (bucket_id = 'invoices');
-- Seed schedule: run AFTER migrations (001 + 002)
-- Safe to re-run — skips duplicates

insert into public.session_slots (service_slug, date, max_slots, price_cents, status)
values
  ('discover-freediving', '2026-07-12', 4, 300000, 'open'),
  ('discover-freediving', '2026-07-19', 4, 300000, 'open'),
  ('discover-freediving', '2026-07-26', 4, 300000, 'open'),
  ('practice-dive',      '2026-07-15', 6, 300000, 'open'),
  ('practice-dive',      '2026-07-22', 6, 300000, 'open'),
  ('fundive',            '2026-07-13', 8,  75000, 'open'),
  ('fundive',            '2026-07-20', 8,  75000, 'open'),
  ('line-training',      '2026-07-18', 4, 150000, 'open'),
  ('line-training',      '2026-07-25', 4, 150000, 'open'),
  ('wave-1',             '2026-08-01', 4, 1450000, 'open'),
  ('wave-2',             '2026-08-15', 4, 1900000, 'open')
on conflict (service_slug, date) do nothing;
