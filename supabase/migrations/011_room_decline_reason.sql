-- Reason when customer declines room arrangement on multi-day bookings

alter table public.bookings
  add column if not exists room_decline_reason text;
