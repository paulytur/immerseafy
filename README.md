# Immerseafy Freediving

Static marketing website for Immerseafy Freediving — built with Next.js and exported as plain HTML/CSS/JS.

## Pages

- **Home** — hero, highlights, teasers
- **Our Team** — instructor profiles
- **Services** — courses and training offerings
- **Contact** — Formspree form + contact details

## Theme (light / dark)

Use the sun/moon toggle in the navigation bar. The site defaults to **dark mode** and also respects your system preference when enabled via `next-themes`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contact form (Formspree)

1. Create a free form at [formspree.io](https://formspree.io).
2. Copy your form ID (the part after `/f/` in the form endpoint URL).
3. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

4. Set your ID:

   ```
   NEXT_PUBLIC_FORMSPREE_ID=your_formspree_form_id
   ```

5. Restart the dev server and submit a test message from `/contact`.

After a successful submit, Formspree redirects back to `/contact?success=true` and shows a confirmation message.

## Build & deploy

```bash
npm run build
```

Static files are output to the `out/` folder. Upload that folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

For GitHub Pages, you may need `basePath` / `assetPrefix` in `next.config.ts` if deploying to a project subdirectory.

## Customising content

- **Copy & team bios** — edit `app/page.tsx`, `app/team/page.tsx`, `app/services/page.tsx`, `app/contact/page.tsx`
- **Team photos** — replace SVG placeholders in `public/images/` with JPG/PNG and update paths in `app/team/page.tsx`
- **Service prices** — edit `price` and `priceNote` for each service in `app/services/page.tsx`
- **Contact details** — update email, phone, location, and social links in `app/contact/page.tsx` and `components/Footer.tsx`
- **Colours & fonts** — adjust `app/globals.css` and fonts in `app/layout.tsx`

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Development server     |
| `npm run build` | Static export to `out/` |
| `npm run lint` | ESLint                  |
