-- Optional meals/carpool and room arrangement for multi-day bookings

alter table public.bookings
  add column if not exists meals_requested boolean not null default false,
  add column if not exists carpool_requested boolean not null default false,
  add column if not exists room_requested boolean not null default false;
