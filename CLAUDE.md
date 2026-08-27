# CLAUDE.md

## Commands
```bash
npm run dev          # frontend only (API routes 404)
npx vercel dev       # full stack including API
npm run build && npm run preview
```

## Stack
- **Frontend:** `src/main.js` (single file SPA, hash routing `#/route`, no framework). `router()` → `shell()` → `app.innerHTML` → `bindEvents()` on every render.
- **Catalog:** `src/catalog.js` — source of truth. `parsePriceValue(price, city)` returns low for Lagos, high for Abuja. No variant picker.
- **Delivery fees:** `lookupDeliveryFee(city, area)` in `src/delivery-zones.js` — re-validated server-side in `api/checkout/initiate.js`.
- **State:** `localStorage` — `bloomfield-cart` `[{id,qty}]`, `bloomfield-checkout-draft`, `bloomfield-hero-index`.
- **API:** Vercel serverless, no Express. Shared utils in `api/_lib/squad.js` (Squad calls, HMAC, order summary, cart re-validation). Mailer: `api/_lib/mailer.js` (`GMAIL_USER`, `GMAIL_APP_PASSWORD`). Supabase: `api/_lib/supabase.js` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — optional, degrades gracefully.
- **Payment:** initiate → Squad checkout URL → `/checkout-complete?transaction_ref=` → verify → webhook. Webhook (`api/squad-webhook.js`) sends two emails via `extractOrderDetails()`. Squad env auto-selects sandbox/live from `SQUAD_SECRET_KEY` prefix.
- **SEO:** `injectProductJsonLd()` in `src/main.js` injects Product JSON-LD. Static landing pages in `public/`. Instagram handle: `@bloomfieldflowers_`.
- **Supabase tables:** `orders`, `inquiries`, `discount_codes`, `settings`. Service role key bypasses RLS.
- **Instagram feed:** `api/instagram-feed.js` — bootstraps on first call (exchanges `INSTAGRAM_TOKEN`, discovers page token + IG account ID via `INSTAGRAM_APP_ID`/`INSTAGRAM_APP_SECRET`, stores in `settings` table). Cached 5 min in memory.

## CRITICAL — .vercelignore
**Never add `images/` or any asset folder.** This silently breaks the site (happened twice). Only safe entries: `node_modules`, `dist`, `.git`, `meta backups`, `*.zip`, `*.xlsx`, `leads`, `scripts`.

## Branch workflow
All work on `preview/*` or `claude/*` branches → user approves → merge to `main`.

## TODOs
- Product detail page (`#/product/:id`) not yet built.
- `HOMEPAGE_REDESIGN_PLAN.md` has design batch notes.
