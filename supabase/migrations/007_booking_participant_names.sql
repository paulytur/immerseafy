-- Store participant names per course line item (replaces count-only booking)

alter table public.booking_items
  add column if not exists participant_names text[] not null default '{}';
