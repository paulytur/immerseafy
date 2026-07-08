-- Payment window: 120 hours (5 days)
alter table site_settings
  alter column payment_expiry_hours set default 120;

update site_settings
set payment_expiry_hours = 120
where id = 1;
