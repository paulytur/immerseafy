# Immerseafy Freediving

Marketing site and booking system for Immerseafy Freediving — built with Next.js, Supabase, and deployed on Vercel.

## Pages

- **Home** — hero, highlights, teasers
- **Our Team** — instructor profiles
- **Services** — courses and training offerings
- **Book** — pick a scheduled date and request a session
- **Contact** — Formspree form + contact details
- **Admin** (`/admin`) — schedule, bookings, users, QR Pay settings

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill in Supabase, Resend, and site URL values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/001_booking_system.sql` via the SQL editor.
3. Create storage buckets:
   - `payment-assets` — public (QR Pay image)
   - `invoices` — private
4. Copy **Project URL**, **anon key**, and **service role key** into `.env.local`.
5. Create the first admin in Supabase → Authentication → Users, with user metadata:
   ```json
   { "full_name": "Your Name", "role": "admin" }
   ```
   The trigger will create a matching `profiles` row.

## Booking flow

1. Admin adds dates in `/admin/schedule` (after calling the resort).
2. Customer books at `/book` → status **pending**.
3. Admin approves in `/admin/bookings` → payment email with QR Pay link.
4. Customer pays via QR Ph → admin confirms payment → PDF invoice emailed.
5. Unpaid bookings expire after 48 hours (configurable in admin settings).

Customers cannot cancel from the website — admin handles cancellations.

## Environment variables

See `.env.example`. Required for booking:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations |
| `NEXT_PUBLIC_SITE_URL` | Live site URL (emails, payment links) |
| `RESEND_API_KEY` | Transactional email |
| `RESEND_FROM_EMAIL` | Sender address |
| `CRON_SECRET` | Secures `/api/cron/expire-bookings` on Vercel |

## Deploy on Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add all env vars from `.env.example`.
3. Set `CRON_SECRET` in Vercel — the cron in `vercel.json` expires unpaid bookings hourly.
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain.

## Contact form (Formspree)

Still used on `/contact`. Set `NEXT_PUBLIC_FORMSPREE_ID` or use `public/site-config.json` in production.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
