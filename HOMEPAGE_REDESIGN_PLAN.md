# Bloomfield Homepage Redesign Plan

## Current problems
- Hero reference images are broken on live site because `hero_cutout.PNG` and `hero-website.PNG` exist in `images/` but are not being served from `public/images/` or imported via Vite.
- Homepage still contains concept-comparison copy and internal design notes.
- Main CTA is DM-first while cart/checkout also exists, creating mixed signals.
- Image payload is too heavy for a premium landing page.
- Mobile nav and homepage hierarchy need simplification.

## Recommended hero direction
Use a **hybrid of the website-style composition and live HTML text**.

### Why
- The current `hero-website.PNG` proves the visual direction you want.
- But using that image literally as the final hero is not ideal because the text is baked into the image.
- Better: use the composition style, color flow, and bouquet placement from `hero-website.PNG`, but rebuild the text and CTA as live HTML/CSS.

### Final hero structure
- Left: premium headline, short supporting copy, 2 CTAs
- Under CTA: subtle 3-item trust strip
- Right: bouquet visual integrated into a blended soft editorial background
- Desktop: full scene feel inspired by `hero-website.PNG`
- Mobile: cleaner crop with reduced decoration and tighter copy

## Trust strip
Keep it minimal and real:
- Same-day delivery before 2pm
- Abuja & Lagos delivery
- Hand-tied premium bouquets

No stars, fake counters, or loud badges unless backed by real evidence.

## Homepage rewrite

### Hero
**Eyebrow:** Bloomfield Flowers

**Headline:** Luxury bouquets for meaningful moments

**Subcopy:** Elegant floral gifting in Abuja and Lagos for romance, birthdays, celebrations, and premium everyday surprises.

**Primary CTA:** Shop Bouquets
**Secondary CTA:** Request Custom Order

**Trust strip:** Same-day delivery before 2pm · Abuja & Lagos · Hand-tied premium bouquets

### Section 2: Best sellers
Headline: Start with Bloomfield favourites
- Show 3 strongest products only
- Cleaner image crops
- Stronger product spacing

### Section 3: Occasion deck
Headline: Shop by gifting mood
- Romantic Bouquets
- Birthday Blooms
- Luxury Arrangements
- Just Because

### Section 4: Why Bloomfield
Headline: Designed to feel gift-ready from the first look
- Premium bouquet styling
- Same-day delivery options
- Custom bouquet requests
- Thoughtful presentation

### Section 5: Customer proof
Headline: Loved by real recipients
- 2 short text pull-quotes first
- Screenshot proof grid below

### Section 6: Custom orders CTA
Headline: Need something more personal?
Copy: Tell us the mood, palette, and occasion and we’ll create something beautifully tailored.
CTA: Request a Custom Bouquet

## Batch plan

### Batch 1 — Hero + homepage cleanup
- Fix broken hero assets
- Remove internal design comparison sections
- Rebuild hero around hybrid website-style composition
- Add subtle trust strip
- Simplify nav behavior on smaller screens

### Batch 2 — Performance + responsiveness
- Compress oversized images
- Replace heavy PNGs where possible with WebP/JPEG
- Tighten card spacing and mobile layout
- Improve section rhythm and load weight

### Batch 3 — Cart + checkout polish
- Make product/cart flow feel consistent
- Keep DM as fallback, not primary
- Add clearer checkout summary and delivery fields

### Batch 4 — Squad payment integration
- Add secure payment initialization flow
- Add callback/redirect handling
- Add transaction verification server-side
- Connect successful payment to order confirmation state

## Squad integration notes
We should not put Squad secret keys in the frontend.

### Safer setup
- Frontend uses Squad public key / modal or initiated session
- Backend/serverless function uses Squad secret key
- Verify every transaction server-side before marking paid
- Add webhook validation for payment events

### What we need for Squad test integration
1. Squad sandbox account
2. Sandbox public key
3. Sandbox secret key
4. Preferred callback/redirect URL
5. Preferred webhook URL target
6. Decision on whether delivery fee is fixed, city-based, or confirmed manually
7. Fields required before payment (recipient phone, sender name, card message, delivery slot, etc.)

## Immediate implementation choice to confirm
Preferred route:
- **Option A (recommended):** rebuild the hero in code using `hero-website.PNG` as composition reference only
- **Option B:** place `hero-website.PNG` directly as the desktop hero background and layer minimal live text over it

Option A will look better long-term and respond better on mobile.
