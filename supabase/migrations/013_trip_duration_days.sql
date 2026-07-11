alter table public.bookings
  add column if not exists trip_duration_days smallint check (trip_duration_days in (1, 2));
