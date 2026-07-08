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
