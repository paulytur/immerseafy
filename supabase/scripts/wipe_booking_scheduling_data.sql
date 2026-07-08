-- Clear booking + scheduling data only.
-- Keeps coaches, team accounts, site settings, and services (defined in app code).

delete from public.invoices;
delete from public.booking_item_slots;
delete from public.booking_items;
delete from public.bookings;
delete from public.session_slots;
delete from public.coach_availability;

-- Restore coaches if they were removed by mistake:
-- insert into public.coaches (name, slug) values
--   ('Paul Yturzaita', 'paul-yturzaita'),
--   ('Dominic Rivera', 'dominic-rivera'),
--   ('J-lyn Guevarra', 'j-lyn-guevarra'),
--   ('Zed Tanjista', 'zed-tanjista'),
--   ('Lance Dusaban', 'lance-dusaban')
-- on conflict (slug) do nothing;
