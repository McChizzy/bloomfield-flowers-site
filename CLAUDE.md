# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm run dev          # Vite dev server (frontend only — no API)
npx vercel dev       # full local dev including Vercel serverless API routes
npm run build        # production build to dist/
npm run preview      # preview the production build locally
```

> Checkout (`/api/checkout/initiate`) and payment verification (`/api/checkout/verify`) require the Vercel serverless runtime. Plain `npm run dev` will 404 on those routes — use `npx vercel dev` for end-to-end checkout testing.

## Architecture

**Single-file SPA.** The entire frontend is `src/main.js` — no framework, no component files. It renders HTML strings into `#app`, binds DOM events after each render, and uses `location.hash` (`#/route`) for client-side routing. `vercel.json` rewrites all paths to `index.html` so deep links work on Vercel.

**Routing pattern:** `router()` calls `checkoutResultState()` to read the current hash route, then returns the rendered HTML string for that page. Every page function calls `shell(content, route)` which wraps it in the shared header/footer. After `app.innerHTML = router(route)`, `bindEvents()` re-attaches all event listeners.

**Catalog:** `src/catalog.js` is the single source of truth for products. `priceBounds(price)` returns `{ low, high }` parsed from range strings like `"₦50,000 - ₦80,000"`. `parsePriceValue(price, city)` returns `low` for Lagos and `high` for Abuja — range-priced items are simply priced higher in Abuja, so there is no separate size/variant picker. Prices display as-is from the catalog but cart totals use the parsed number.

**Delivery fees:** `src/delivery-zones.js` (frontend) and the equivalent lookup used by `api/checkout/initiate.js` (server) map `city` + `area` to a fee via `lookupDeliveryFee(city, area)`. Known Abuja/Lagos areas resolve to an exact zone fee; unrecognized areas fall back to a per-city default. The customer no longer enters a delivery fee manually — it's computed from the area they type and re-validated server-side.

**Cart and checkout state** live entirely in `localStorage`:
- `bloomfield-cart` — array of `{ id, qty }`
- `bloomfield-checkout-draft` — form field values persisted on every keystroke
- `bloomfield-hero-index` — which showcase slide was last active

**SEO:** `injectProductJsonLd()` (called on app init in `src/main.js`) injects an `ItemList` of `Product` JSON-LD (`<script id="product-catalog-jsonld">`) generated from `src/catalog.js`, using `Offer` for fixed prices and `AggregateOffer` for ranges. Several static SEO landing pages live in `public/` (e.g. `anniversary-flowers-{abuja,lagos}.html`, `birthday-flowers-{abuja,lagos}.html`, `graduation-flowers-{abuja,lagos}.html`, `flower-delivery-{abuja,lagos}.html`), each with their own JSON-LD. The canonical Instagram handle across all JSON-LD `sameAs` fields and site copy is `@bloomfieldflowers_`.

**Serverless API** (`api/`) uses plain Node.js Vercel handler style (no Express). Shared utilities are in `api/_lib/squad.js` — Squad API calls, webhook HMAC verification, order summarization, and cart server-side re-validation all live there. The API re-validates cart items (and delivery fee) against `src/catalog.js` / `src/delivery-zones.js` server-side so the frontend can't be trusted alone. `api/_lib/mailer.js` sends mail via Gmail/nodemailer (`GMAIL_USER`, `GMAIL_APP_PASSWORD`). `api/_lib/supabase.js` provides an optional Supabase client (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) used to log contact/custom-order inquiries — features degrade gracefully if these env vars are absent.

**Payment flow:**
1. `POST /api/checkout/initiate` — validates cart + delivery fields, computes the delivery fee server-side, calls Squad to create a checkout session, returns `checkoutUrl`
2. Frontend redirects to Squad checkout URL
3. Squad redirects back to `/checkout-complete?transaction_ref=...`
4. `GET /api/checkout/verify?transaction_ref=...` — verifies transaction status with Squad
5. `api/squad-webhook.js` handles Squad webhook events with HMAC-SHA512 signature validation. On a successful payment it sends two emails: an internal order notification (`sendOrderEmail`) and a branded customer order confirmation with the bouquet image and delivery/pickup details (`sendCustomerOrderEmail`). Both share an `extractOrderDetails(event, orderRow)` helper.

**Squad environment:** `getSquadBaseUrl()` auto-selects sandbox (`https://sandbox-api-d.squadco.com`) vs live (`https://api-d.squadco.com`) based on whether the secret key starts with `sandbox_`. Required env var: `SQUAD_SECRET_KEY`.

## Key decisions and known TODOs

- Both the contact form and the `/custom-orders` form post to `api/contact.js` (`formType: 'contact' | 'custom-order'`), which emails `houseofbloomfield@gmail.com` via `api/_lib/mailer.js` and optionally logs the inquiry to Supabase.
- A product detail page (`#/product/:id`) is planned but not yet built — currently only short descriptions appear on cards.
- `HOMEPAGE_REDESIGN_PLAN.md` documents completed and upcoming design batches (Batches 1–4).
