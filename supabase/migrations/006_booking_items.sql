-- Multi-course bookings with 1- or 2-day duration per line item

alter table public.bookings
  alter column session_slot_id drop not null;

alter table public.bookings
  add column if not exists start_date date;

create table if not exists public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  service_slug text not null,
  quantity int not null check (quantity > 0),
  duration_days int not null check (duration_days in (1, 2)) default 1,
  unit_price_cents int not null check (unit_price_cents > 0),
  start_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_item_slots (
  id uuid primary key default gen_random_uuid(),
  booking_item_id uuid not null references public.booking_items(id) on delete cascade,
  session_slot_id uuid not null references public.session_slots(id),
  quantity int not null check (quantity > 0),
  unique (booking_item_id, session_slot_id)
);

create index if not exists booking_items_booking_id_idx on public.booking_items (booking_id);
create index if not exists booking_item_slots_item_id_idx on public.booking_item_slots (booking_item_id);

alter table public.booking_items enable row level security;
alter table public.booking_item_slots enable row level security;

create policy "Staff can manage booking items"
  on public.booking_items for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "Staff can manage booking item slots"
  on public.booking_item_slots for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());
