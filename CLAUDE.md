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

**Catalog:** `src/catalog.js` is the single source of truth for products. `parsePriceValue()` extracts the lower bound from range strings like `"₦50,000 - ₦80,000"` for cart math. Prices display as-is from the catalog but cart totals use the parsed number.

**Cart and checkout state** live entirely in `localStorage`:
- `bloomfield-cart` — array of `{ id, qty }`
- `bloomfield-checkout-draft` — form field values persisted on every keystroke
- `bloomfield-hero-index` — which showcase slide was last active

**Serverless API** (`api/`) uses plain Node.js Vercel handler style (no Express). Shared utilities are in `api/_lib/squad.js` — Squad API calls, webhook HMAC verification, order summarization, and cart server-side re-validation all live there. The API re-validates cart items against `src/catalog.js` server-side so the frontend price cannot be trusted alone.

**Payment flow:**
1. `POST /api/checkout/initiate` — validates cart + delivery fields, calls Squad to create a checkout session, returns `checkoutUrl`
2. Frontend redirects to Squad checkout URL
3. Squad redirects back to `/checkout-complete?transaction_ref=...`
4. `GET /api/checkout/verify?transaction_ref=...` — verifies transaction status with Squad
5. `api/squad-webhook.js` handles Squad webhook events with HMAC-SHA512 signature validation

**Squad environment:** `getSquadBaseUrl()` auto-selects sandbox (`https://sandbox-api-d.squadco.com`) vs live (`https://api-d.squadco.com`) based on whether the secret key starts with `sandbox_`. Required env var: `SQUAD_SECRET_KEY`.

## Key decisions and known TODOs

- Delivery fee is entered manually by the customer during checkout — a proper Abuja/Lagos zone pricing table is planned but not yet built.
- The custom order form on `/custom-orders` does not submit to a backend — the CTA opens an Instagram DM link.
- Contact form similarly links to Instagram DM rather than posting to an API.
- `HOMEPAGE_REDESIGN_PLAN.md` documents completed and upcoming design batches (Batches 1–4).
