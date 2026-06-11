# Bloomfield Bouquet Builder — Research & Implementation Plan

## The idea

Let a customer build their own bouquet by picking flower types and quantities,
see a running price total update live as they add/remove stems, and get some
form of visual feedback on what their bouquet will look like — without
requiring a full 3D/AR engine.

## What's out there today

A quick survey of existing "build your own bouquet" tools:

- **Bridal Bouquet Builder** and **BloomyPro** offer full 3D/360° bouquet
  visualizers with 200+ flower types — these are dedicated apps/platforms
  built by teams with 3D asset libraries and rendering pipelines.
- **flwrsAI** and similar "AI arrangement" tools generate images from text
  prompts rather than composing real assets live.
- Smaller florist sites mostly do **"pick a size/style, add notes"** rather
  than true stem-by-stem composition — true 3D builders are rare because the
  asset and engineering cost is high relative to the conversion lift for a
  single-location/two-city business.

**Conclusion:** a true "VR"/3D bouquet builder is a multi-month, asset-heavy
project that doesn't fit a single-file vanilla-JS SPA and isn't justified yet.
A **lighter visual + live price builder** gets ~80% of the delight at a
fraction of the cost, and can be upgraded later if it proves popular.

## Recommended approach: phased build

### Phase 1 — "Build & Price" (no visual composition yet)

A new route `#/build-a-bouquet` with:

- A new data file `src/bouquet-ingredients.js` — the flower "menu":
  ```js
  export const stems = [
    { id: 'red-rose', name: 'Red Rose', color: 'red', pricePerStem: 3500, image: '/images/stems/red-rose.png' },
    { id: 'spray-rose', name: 'Spray Rose', color: 'pink', pricePerStem: 2500, image: '/images/stems/spray-rose.png' },
    { id: 'chrysanthemum', name: 'Chrysanthemum', color: 'white', pricePerStem: 1500, image: '/images/stems/chrysanthemum.png' },
    { id: 'lily', name: 'Lily', color: 'white', pricePerStem: 4000, image: '/images/stems/lily.png' },
    { id: 'gypso', name: 'Gypsophila (Baby\'s Breath)', color: 'white', pricePerStem: 500, image: '/images/stems/gypso.png' },
    // ...
  ]
  export const wraps = [
    { id: 'kraft', name: 'Kraft Wrap', price: 2000 },
    { id: 'satin-blush', name: 'Satin Wrap — Blush', price: 4000 },
    // ...
  ]
  export const MIN_STEMS = 6
  export const MIN_ORDER_VALUE = 25000
  ```
  > **Open question:** the actual per-stem prices, available stem types, and
  > wrap options need to come from you — these are placeholders. If you
  > already keep a "bouquet calculator" (spreadsheet or notes) with real
  > stem costs, that's the source of truth to port in here.

- UI: a grid of stem cards, each with an image, name, price, and a `+ / −`
  stepper for quantity (same interaction pattern as the existing cart qty
  controls).
- A sticky summary panel showing: stem-by-stem subtotal, wrap price, total
  stem count, running total price, and a validation message if below
  `MIN_STEMS` / `MIN_ORDER_VALUE`.
- "Add to Cart" button, disabled until the minimum is met.

This phase alone delivers the **"live visual/price feedback as flowers are
added/removed"** behaviour for price — the most requested part — without any
new image/illustration work beyond simple stem photos (which can be cropped
from existing product photography or new product shots).

### Phase 2 — Lightweight visual composition ("lighter version" of the VR idea)

Once Phase 1 ships and pricing/UX is validated, add a live visual preview:

- A circular "bouquet canvas" `<div>` with a wrap/paper SVG background.
- Each stem type contributes a cluster of small flower icon images
  (PNG/SVG cutouts on transparent background), absolutely positioned within
  the canvas.
- **Layout algorithm**: precompute a fixed set of position "slots" (e.g. 30
  slots arranged in concentric rings, biased so larger flowers sit toward the
  center/back and smaller filler flowers sit toward the edges). As stem counts
  change, deterministically assign stems to slots in a stable order (so the
  arrangement doesn't visually "jump" wildly on small changes — same
  composition always renders the same way).
- This produces a stylized "moodboard" bouquet rather than a photoreal
  render, but updates instantly and requires only ~10–15 cutout flower images
  total (a few angles/colors per stem type).
- CSS `transform: scale()` per slot to vary apparent size/depth slightly for
  a more organic look.

**Asset cost:** the main investment here is photographing or sourcing ~10-15
clean flower-stem cutout images (transparent background) — this is a content
task, not a dev task, and can be done with the existing product photography
setup.

### Phase 3 — Stretch: photo-matched "closest bouquet" preview (optional, can ship alongside Phase 2)

In addition to (or instead of) the icon collage, show the **existing
catalog photo** that most closely matches the customer's composition (e.g.
"Your bouquet will look similar in style to: Pastel Cloud (L)") by tagging
each catalog product with its dominant stem types in `src/catalog.js` and
picking the best Jaccard-similarity match. This reuses photography you
already have and sets expectations ("style reference" framing avoids
overpromising an exact match).

### Phase 4 — Not recommended near-term: 3D/AR visualization

True 3D rendering (rotatable bouquet, AR placement) would require a 3D asset
library (licensed or custom-modeled flowers), a rendering library
(three.js/`<model-viewer>`), and meaningful performance testing on low-end
mobile devices common in the target market. Given the existing "no
framework, single file" architecture and small team, this is a **separate
project**, not an incremental feature. Worth revisiting only if Phase 1–2
prove the builder drives meaningful order volume.

## Cart & checkout integration

Custom bouquets don't exist in `src/catalog.js`, so they need a distinct cart
item shape, e.g.:

```js
{ id: 'custom-bouquet', customId: '<uuid>', qty: 1, composition: { 'red-rose': 6, 'gypso': 10 }, wrapId: 'kraft' }
```

- `src/main.js` cart rendering: compute display name ("Custom Bouquet — 6 Red
  Roses, 10 Gypso"), price, and a generic "custom bouquet" thumbnail
  (or the Phase 2 collage rendered to a canvas/data URL for a real preview in
  the cart).
- **Server-side validation is critical** (same principle as existing catalog
  re-validation): add `src/bouquet-ingredients.js` price data, and in
  `api/checkout/initiate.js` recompute the price for any `custom-bouquet`
  cart item from `composition` + `wrapId` server-side — never trust a
  client-submitted total. Reject unknown stem/wrap IDs or counts below
  `MIN_STEMS`.
- The Squad order summary and confirmation emails (`api/squad-webhook.js`)
  need a line-item formatter for custom bouquets, e.g. "Custom Bouquet (6×
  Red Rose, 10× Gypsophila, Kraft Wrap)".

## Implementation order

1. `src/bouquet-ingredients.js` — stem/wrap data (needs your real pricing —
   flagged above)
2. `#/build-a-bouquet` route + page in `src/main.js`: stem grid, qty steppers,
   live price summary, min-order validation, add-to-cart
3. Cart rendering support for `custom-bouquet` items (display name, price,
   remove/edit)
4. `api/checkout/initiate.js` — server-side recompute/validation for custom
   bouquet items
5. `api/squad-webhook.js` — order summary + email line items for custom
   bouquets
6. Phase 2: flower cutout assets + bouquet canvas visual composer
7. Phase 3 (optional): "closest catalog match" style reference

## Verification

- Add stems one at a time, confirm price updates instantly and matches
  `sum(stemPrice * qty) + wrapPrice`
- Confirm "Add to Cart" is disabled below `MIN_STEMS` / `MIN_ORDER_VALUE` with
  a clear message
- Add a custom bouquet to cart alongside catalog items, confirm cart totals
  and checkout delivery-fee logic both work unchanged
- Tamper with the submitted price/composition via devtools and confirm
  `api/checkout/initiate.js` rejects or recomputes correctly
- Confirm order emails (internal + customer) describe the custom bouquet
  composition clearly

## Open questions for you

1. Real stem types + per-stem prices (and any wrap/ribbon options + prices)
2. Minimum stem count / minimum order value for a custom bouquet
3. Do you want Phase 2 (visual collage) in the first release, or ship Phase 1
   (price-only builder) first and validate demand?
4. Any existing "bouquet calculator" (spreadsheet, notes, Instagram tool) you
   want ported in as the source of truth for pricing logic?
