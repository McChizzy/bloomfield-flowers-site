import './style.css'
import { products, parsePriceValue, priceBounds } from './catalog.js'
import { lookupDeliveryFee } from './delivery-zones.js'

const SITE_URL = 'https://bloomfieldflowers.ng'
const primaryLogo = '/images/bff logo-p.jpeg'
const instagramHandle = 'bloomfieldflowers_'
const instagramUrl = 'https://www.instagram.com/bloomfieldflowers_/'
const emailAddress = 'houseofbloomfield@gmail.com'
const phoneNumber = '+234 701 120 3325'
const whatsappUrl = 'https://wa.me/2347011203325'
const businessHours = 'Open 24 hours'
// Business hours: Mon–Sat 9am–7pm, Sun 12pm–5pm
// Delivery slots: 1hr after opening, 1hr before closing
const WEEKDAY_SLOT_START = 10  // 10 AM
const WEEKDAY_SLOT_END = 18    // 6 PM
const SUNDAY_SLOT_START = 13   // 1 PM
const SUNDAY_SLOT_END = 16     // 4 PM
const dmPrefill = encodeURIComponent('Hello Bloomfield Flowers. I would like to place an order. We will respond to process your order and confirm flower availability. Thanks for your patronage.')
const customOrderPrefill = encodeURIComponent('Hello Bloomfield Flowers. I would like to request a custom bouquet. We will respond to process your order and confirm flower availability. Thanks for your patronage.')

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// Longest valid Nigerian number: +234 followed by 10 digits
const NIGERIA_PHONE_MAX_LENGTH = 14

function sanitizePhoneInput(value) {
  let cleaned = String(value ?? '').replace(/[^\d+]/g, '')
  const hasPlus = cleaned.startsWith('+')
  cleaned = cleaned.replace(/\+/g, '')
  if (hasPlus) cleaned = `+${cleaned}`
  return cleaned.slice(0, NIGERIA_PHONE_MAX_LENGTH)
}

function isValidNigerianPhone(value) {
  const digits = String(value ?? '').replace(/^\+/, '')
  if (!/^\d+$/.test(digits)) return false
  if (digits.startsWith('234')) return digits.length === 13
  return digits.length === 11 && digits.startsWith('0')
}

function deliverySlotRange(dateStr) {
  const day = dateStr ? new Date(dateStr + 'T12:00:00').getDay() : new Date().getDay()
  return day === 0
    ? { start: SUNDAY_SLOT_START, end: SUNDAY_SLOT_END }
    : { start: WEEKDAY_SLOT_START, end: WEEKDAY_SLOT_END }
}

function deliveryMinDate() {
  const now = new Date()
  const d = new Date(now)
  const { end } = deliverySlotRange(d.toISOString().split('T')[0])
  if (now.getHours() >= end) d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function deliveryMaxDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

function deliveryTimeOptions(selected = '', dateStr = '') {
  const { start, end } = deliverySlotRange(dateStr)
  const opts = []
  for (let h = start; h <= end; h++) {
    const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`
    const val = `${String(h).padStart(2, '0')}:00`
    opts.push(`<option value="${val}"${selected === val ? ' selected' : ''}>${label}</option>`)
  }
  return opts.join('')
}

const testimonials = [
  {
    name: 'Tosan A.',
    rating: 5,
    text: 'I rate the customer service a 10/10. I called their attention to my delivery and they made sure they got it fixed even when I asked them not to bother. It changed my whole experience with them and I will recommend them to my friends.',
    image: '/images/5_red_roses.jpg',
  },
  {
    name: 'Adaeze J.',
    rating: 5,
    text: 'Excellent service, very prompt delivery and beautiful flowers. I recommend.',
    image: '/images/roses_with_fillers.jpg',
  },
  {
    name: 'Oluwadamilola O.',
    rating: 5,
    text: 'The flowers were fresh, beautiful and arrived on time. Love the service.',
    image: '/images/optimized/barbie-deluxe.jpg',
  },
  {
    name: 'Ngozi N.',
    rating: 5,
    text: 'Very quick response, exceptional customer service. Bouquet came very fresh.',
    image: '/images/the_seraphina.jpg',
  },
  {
    name: 'Tems K.',
    rating: 5,
    text: 'Very lovely flowers, swift responses and very polite and reliable.',
    image: '/images/bloom_no_2.jpg',
  },
  {
    name: 'Mudah A.',
    rating: 5,
    text: "Very fast and reliable! Try them out, you won't regret it!",
    image: '/images/bloom_no_1.jpg',
  },
]

const reviewAggregate = {
  ratingValue: 4.8,
  reviewCount: 12,
  bestRating: 5,
}

const featuredCollections = [
  {
    name: 'Romantic Bouquets',
    image: '/images/optimized/pink-bouquet.jpg',
  },
  {
    name: 'Birthday Blooms',
    image: '/images/optimized/chrysanthemum-bouquet.jpg',
  },
  {
    name: 'Celebration Flowers',
    image: '/images/optimized/celebration-flowers.jpg',
  },
  {
    name: 'Luxury Arrangements',
    image: '/images/optimized/luxury-arrangements.jpg',
  },
  {
    name: 'Just Because',
    image: '/images/optimized/just-because.jpg',
  },
]

const landingShowcaseSlides = [
  {
    image: '/images/hero1.jpeg',
    title: 'Signature Collection',
    caption: 'Statement bouquets crafted for the moments that matter most.',
  },
  {
    image: '/images/optimized/hero2.jpg',
    title: 'Premium Gifting',
    caption: 'Because some feelings are best expressed in flowers.',
  },
  {
    image: '/images/optimized/pink-bouquet.jpg',
    title: 'Romantic Bouquets',
    caption: 'Soft pinks and blush tones for the most romantic moments.',
  },
  {
    image: '/images/optimized/chrysanthemum-bouquet.jpg',
    title: 'Birthday Blooms',
    caption: 'Make their birthday unforgettable with a bouquet they\'ll always remember.',
  },
  {
    image: '/images/optimized/celebration-flowers.jpg',
    title: 'Celebration Flowers',
    caption: 'Every milestone deserves a bouquet as special as the moment.',
  },
  {
    image: '/images/optimized/luxury-arrangements.jpg',
    title: 'Luxury Arrangements',
    caption: 'Premium blooms, artfully arranged for those who appreciate the finest things.',
  },
  {
    image: '/images/optimized/just-because.jpg',
    title: 'Just Because',
    caption: 'Sometimes you don\'t need a reason — just the right flowers.',
  },
]

const heroHighlights = [
  'Same-day delivery',
  'Abuja & Lagos delivery',
  'Hand-tied premium bouquets',
]

const heroScene = {
  bouquetImage: '/images/optimized/hero-bouquet-softcut.png',
  alt: 'Bloomfield Flowers signature bouquet',
  eyebrow: 'Bloomfield Flowers',
  title: 'Luxury bouquets for meaningful moments',
  body: 'Elegant floral gifting in Abuja and Lagos for romance, birthdays, celebrations, and premium everyday surprises.',
}

const careMoments = [
  {
    title: 'Fresh from the first day',
    body: 'Trim the stems slightly before arranging your bouquet in clean water so the flowers stay hydrated and lively.',
  },
  {
    title: 'Keep the water clean',
    body: 'Refresh the water every day or two and gently rinse the vase to help your arrangement last longer.',
  },
  {
    title: 'Protect delicate blooms',
    body: 'Keep flowers away from direct sunlight, heat, and strong wind or air-conditioning for a longer vase life.',
  },
]

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

const storageKey = 'bloomfield-cart'
const heroStorageKey = 'bloomfield-hero-index'
const checkoutDraftKey = 'bloomfield-checkout-draft'
const cartCityKey = 'bloomfield-cart-city'
const app = document.querySelector('#app')

let shopSort = 'featured'
let shopPriceFilter = 'all'

const shopPriceFilters = {
  all: { label: 'All prices', test: () => true },
  'under-100k': { label: 'Under ₦100,000', test: (price) => price < 100000 },
  '100k-300k': { label: '₦100,000 – ₦300,000', test: (price) => price >= 100000 && price <= 300000 },
  '300k-600k': { label: '₦300,000 – ₦600,000', test: (price) => price > 300000 && price <= 600000 },
  'over-600k': { label: 'Over ₦600,000', test: (price) => price > 600000 },
}

const shopSortOptions = {
  featured: { label: 'Featured', sort: null },
  'price-asc': { label: 'Price: Low to High', sort: (a, b) => parsePriceValue(a.price) - parsePriceValue(b.price) },
  'price-desc': { label: 'Price: High to Low', sort: (a, b) => parsePriceValue(b.price) - parsePriceValue(a.price) },
  'name-asc': { label: 'Name: A to Z', sort: (a, b) => a.name.localeCompare(b.name) },
}

function getHeroIndex() {
  try {
    const value = Number(localStorage.getItem(heroStorageKey) || '0')
    return Number.isFinite(value) ? Math.max(0, Math.min(landingShowcaseSlides.length - 1, value)) : 0
  } catch {
    return 0
  }
}

function saveHeroIndex(index) {
  localStorage.setItem(heroStorageKey, String(index))
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch {
    return []
  }
}

function saveCart(cart) {
  try { localStorage.setItem(storageKey, JSON.stringify(cart)) } catch { /* storage unavailable */ }
}

function getCartCity() {
  try { return localStorage.getItem(cartCityKey) || 'Lagos' } catch { return 'Lagos' }
}
function saveCartCity(city) {
  try { localStorage.setItem(cartCityKey, city) } catch { }
}

function showAddedToCartModal(product) {
  const prev = document.getElementById('cart-popup')
  if (prev) prev.remove()

  const backdrop = document.createElement('div')
  backdrop.id = 'cart-popup'
  backdrop.className = 'cart-popup-backdrop'
  backdrop.innerHTML = `
    <div class="cart-popup" role="dialog" aria-modal="true" aria-labelledby="cart-popup-title">
      <button class="cart-popup-close" type="button" aria-label="Close" data-cart-popup-close>&times;</button>
      <div class="cart-popup-icon">✓</div>
      <h3 id="cart-popup-title">Added to your cart</h3>
      <p><strong>${esc(product?.name || 'Item')}</strong> has been added to your cart.</p>
      <div class="cart-popup-actions">
        <a class="btn btn-primary" href="#/cart" data-cart-popup-close>View Cart</a>
        <button class="btn btn-secondary" type="button" data-cart-popup-close>Keep Shopping</button>
      </div>
    </div>
  `
  document.body.appendChild(backdrop)
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('is-visible')))

  const close = () => {
    document.removeEventListener('keydown', onKeydown)
    backdrop.classList.remove('is-visible')
    backdrop.addEventListener('transitionend', () => backdrop.remove(), { once: true })
  }
  const onKeydown = (event) => {
    if (event.key === 'Escape') close()
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close()
  })
  backdrop.querySelectorAll('[data-cart-popup-close]').forEach((el) => {
    el.addEventListener('click', close)
  })
  document.addEventListener('keydown', onKeydown)
}

function trackPixelEvent(event, params) {
  if (typeof window.fbq === 'function') window.fbq('track', event, params)
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId)
  const cart = getCart()
  const existing = cart.find((item) => item.id === productId)
  if (existing) {
    existing.qty += 1
  } else {
    cart.push({ id: productId, qty: 1 })
  }
  saveCart(cart)
  renderApp()
  showAddedToCartModal(product)
  if (product) {
    trackPixelEvent('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: parsePriceValue(product.price),
      currency: 'NGN',
    })
  }
}

function updateQty(productId, delta) {
  const cart = getCart()
    .map((item) => item.id === productId ? { ...item, qty: item.qty + delta } : item)
    .filter((item) => item.qty > 0)
  saveCart(cart)
  renderApp()
}

function formatPrice(price) {
  if (typeof price === 'number') return naira.format(price)
  return price
}

function productCard(product) {
  return `
    <article class="product-card">
      <a class="product-card-media" href="#/product/${product.id}">
        <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" width="400" height="480">
      </a>
      <div class="product-body">
        <p class="product-category">${product.category}</p>
        <h3><a href="#/product/${product.id}">${product.name}</a></h3>
        <p>${product.short}</p>
        <div class="product-meta">
          <strong>${formatPrice(product.price)}</strong>
          <div class="product-actions">
            <button class="btn btn-primary" data-add="${product.id}">Add to Cart</button>
            <a class="btn btn-secondary" href="${product.instagramPost || instagramUrl + '?hl=en'}" target="_blank" rel="noreferrer">DM to Order</a>
          </div>
        </div>
      </div>
    </article>
  `
}

function getCheckoutDraft() {
  try {
    return JSON.parse(localStorage.getItem(checkoutDraftKey) || '{}')
  } catch {
    return {}
  }
}

function saveCheckoutDraft(draft) {
  try { localStorage.setItem(checkoutDraftKey, JSON.stringify(draft)) } catch { /* storage unavailable */ }
}

function getDeliveryFee() {
  const draft = getCheckoutDraft()
  if ((draft.deliveryMethod || 'delivery') === 'pickup') return 0
  const { fee } = lookupDeliveryFee(draft.city || 'Abuja', draft.area || '')
  return fee ?? 0
}

function renderDeliveryFeeContent(city, area) {
  if (!area || !area.trim()) {
    return `<p class="delivery-fee-note">Enter your area above to see the estimated delivery fee.</p>`
  }
  const { fee, exact } = lookupDeliveryFee(city || 'Abuja', area)
  if (!fee) {
    return `<p class="delivery-fee-note">We'll confirm your delivery fee after you place your order.</p>`
  }
  return `
    <div class="delivery-fee-amount">${naira.format(fee)}</div>
    <p class="delivery-fee-note">${exact ? 'Estimated fee for your area.' : 'Estimated fee — exact amount may vary by location.'}</p>
  `
}

function checkoutGrandTotal(city = '') {
  return cartTotal(city) + getDeliveryFee()
}

function getTransactionRefFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('transaction_ref') || params.get('reference') || ''
}

function checkoutResultState() {
  const hashRoute = location.hash.replace('#/', '')
  if (hashRoute) return hashRoute
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
  if (path === 'checkout-complete') return 'checkout-complete'
  return 'home'
}

function cartDetailed(city = '') {
  return getCart()
    .map((item) => {
      const product = products.find((p) => p.id === item.id)
      if (!product) return null
      const basePrice = parsePriceValue(product.price, city)
      return { ...item, product, subtotal: basePrice * item.qty }
    })
    .filter(Boolean)
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0)
}

function cartTotal(city = '') {
  return cartDetailed(city).reduce((sum, item) => sum + item.subtotal, 0)
}

function shell(content, route = '') {
  const navItems = [
    ['home', 'Home'],
    ['shop', 'Shop'],
    ['about', 'About'],
    ['custom-orders', 'Custom Orders'],
    ['delivery', 'Delivery'],
    ['flower-care', 'Flower Care'],
    ['contact', 'Contact'],
  ]

  return `
    <div class="site-shell">
      <header class="site-header">
        <div class="container nav-row">
          <a class="brand" href="#/home">
            <span class="brand-logo-wrap">
              <img class="brand-logo-static" src="${primaryLogo}" alt="Bloomfield Flowers logo">
            </span>
            <span>Bloomfield Flowers</span>
          </a>
          <div class="nav-actions">
            <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-label="Open navigation menu">
              <span></span><span></span><span></span>
            </button>
            <nav class="nav-links" data-nav-panel aria-label="Primary navigation">
              ${navItems.map(([key, label]) => `<a href="#/${key}" class="${route === key ? 'is-active' : ''}">${label}</a>`).join('')}
              <a href="#/cart" class="cart-link ${route === 'cart' ? 'is-active-cart' : ''}"><span>Cart</span> <span class="cart-badge">${route === 'checkout-complete' ? '' : cartCount()}</span></a>
            </nav>
          </div>
        </div>
      </header>
      ${content}
      <footer class="site-footer">
        <div class="container footer-grid">
          <div>
            <h3>Bloomfield Flowers</h3>
            <p>Luxury bouquets, everyday gifting, romance, celebrations, and custom floral moments, beautifully arranged for Abuja and Lagos.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <a href="#/shop">Shop</a>
            <a href="#/custom-orders">Custom Orders</a>
            <a href="#/delivery">Delivery Info</a>
            <a href="#/flower-care">Flower Care</a>
          </div>
          <div>
            <h4>Order & contact</h4>
            <p><a href="${instagramUrl}" target="_blank" rel="noreferrer">Connect with us on Instagram</a></p>
            <p><a href="mailto:${emailAddress}">${emailAddress}</a></p>
            <p>${phoneNumber} · <a href="${whatsappUrl}" target="_blank" rel="noreferrer">WhatsApp</a></p>
          </div>
        </div>
        <div class="footer-seo-links">
          <p>Flower delivery: <a href="/flower-delivery-lagos">Lagos</a> · <a href="/flower-delivery-abuja">Abuja</a></p>
          <p>Shop by occasion: <a href="/birthday-flowers-lagos">Birthdays</a> · <a href="/anniversary-flowers-lagos">Anniversaries</a> · <a href="/graduation-flowers-lagos">Graduations</a></p>
        </div>
        <div class="footer-legal">
          <p>&copy; ${new Date().getFullYear()} Bloomfield Flowers. All rights reserved.</p>
          <p><a href="#/terms">Terms &amp; Conditions</a> · <a href="#/privacy">Privacy Policy</a></p>
        </div>
      </footer>
    </div>
  `
}

function homePage() {
  return shell(`
    <main>
      <section class="hero-section hero-section-reimagined">
        <div class="container hero-reimagined-shell hero-reimagined-shell-final">
          <div class="hero-copy-panel hero-copy-panel-reimagined hero-copy-panel-final">
            <p class="hero-mini-copy">${heroScene.eyebrow}</p>
            <h1>${heroScene.title}</h1>
            <p class="hero-copy">${heroScene.body}</p>
            <div class="hero-actions hero-actions-final">
              <a class="btn btn-primary" href="#/shop">Shop Bouquets</a>
              <a class="btn btn-secondary" href="#/custom-orders">Request Custom Order</a>
            </div>
            <div class="hero-highlights hero-highlights-trust">
              ${heroHighlights.map((item) => `<div class="hero-highlight-pill hero-highlight-pill-trust">${item}</div>`).join('')}
            </div>
          </div>
          <div class="hero-photo-wrap">
            <img src="${heroScene.bouquetImage}" alt="${heroScene.alt}" loading="eager" fetchpriority="high" decoding="async" width="569" height="549">
          </div>
        </div>
      </section>

      <section class="section container showcase-section section-tight-top">
        <div class="section-heading section-heading-centered">
          <p class="eyebrow">Bouquet showcase</p>
          <h2>Shop by gifting mood</h2>
          <p>Explore Bloomfield favourites for romance, birthdays, celebrations, and thoughtful just-because moments.</p>
        </div>
        <div class="hero-card hero-card-polished hero-card-gallery-shell">
          <div class="hero-slider-shell hero-slider-shell-below">
            ${landingShowcaseSlides.map((slide, index) => `
              <article class="hero-gallery-card hero-slide showcase-slide ${index === getHeroIndex() ? 'is-active' : ''}" data-slide="${index}">
                <img src="${slide.image}" alt="${slide.title}" ${index === getHeroIndex() ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"'}>
                <div class="hero-showcase-overlay hero-showcase-overlay-soft hero-showcase-overlay-captioned">
                  <p class="hero-showcase-label">Bloomfield bouquet deck</p>
                  <strong>${slide.title}</strong>
                  <span>${slide.caption}</span>
                </div>
              </article>
            `).join('')}
            <div class="hero-slider-controls hero-slider-controls-below">
              <button type="button" class="hero-slider-btn" data-hero-nav="prev" aria-label="Previous showcase image">‹</button>
              <div class="hero-slider-dots">
                ${landingShowcaseSlides.map((_, index) => `<button type="button" class="hero-dot ${index === getHeroIndex() ? 'is-active' : ''}" data-hero-dot="${index}" aria-label="Go to slide ${index + 1}"></button>`).join('')}
              </div>
              <button type="button" class="hero-slider-btn" data-hero-nav="next" aria-label="Next showcase image">›</button>
            </div>
          </div>
        </div>
      </section>

      <section class="section container">
        <div class="section-heading">
          <p class="eyebrow">Best sellers</p>
          <h2>Start with our most gift-ready bouquets</h2>
        </div>
        <div class="product-grid product-grid-featured">
          ${products.slice(0, 3).map((product) => productCard(product)).join('')}
        </div>
      </section>

      <section class="section section-soft section-story-band">
        <div class="container two-col story-grid story-grid-polished">
          <div class="story-visual-card">
            <img src="/images/optimized/just-because.jpg" alt="Bloomfield Flowers arrangement detail" loading="lazy" decoding="async">
          </div>
          <div>
            <p class="eyebrow">About Bloomfield Flowers</p>
            <h2>Thoughtfully curated bouquets for life's most meaningful moments</h2>
            <p>At Bloomfield Flowers, we create arrangements that feel elegant, expressive, and gift-worthy. We serve Abuja and Lagos with premium gifting, custom bouquets, romance flowers, birthday blooms, and same-day delivery for confirmed orders placed before 2pm.</p>
            <a class="text-link" href="#/about">Learn more about Bloomfield Flowers</a>
          </div>
        </div>
      </section>

      <section class="section container">
        <div class="section-heading">
          <p class="eyebrow">Why us</p>
          <h2>Why Bloomfield Flowers</h2>
        </div>
        <div class="bullet-grid">
          ${['Premium bouquet styling with gift-ready presentation', 'Same-day delivery available for confirmed orders before 2pm', 'Serving Abuja and Lagos with elegant bouquets for gifting moments', 'Custom bouquet options for personal requests and special occasions', 'Clear delivery confirmation before payment so expectations stay aligned'].map((item) => `<div class="bullet-card">${item}</div>`).join('')}
        </div>
      </section>

      <section class="section container">
        <div class="section-heading section-heading-centered">
          <p class="eyebrow">Customer love</p>
          <h2>What customers are saying about Bloomfield Flowers</h2>
          <p>${reviewAggregate.ratingValue} out of 5 from ${reviewAggregate.reviewCount} Google reviews — real feedback from people who have received Bloomfield bouquets.</p>
        </div>
        <div class="review-grid">
          ${testimonials.map((review) => `
            <article class="review-card testimonial-card">
              <img src="${review.image}" alt="A bouquet from Bloomfield Flowers" loading="lazy" decoding="async" width="400" height="335">
              <div class="testimonial-body">
                <div class="testimonial-stars" aria-label="${review.rating} out of 5 stars">${'★'.repeat(review.rating)}</div>
                <p class="testimonial-text">&ldquo;${review.text}&rdquo;</p>
                <p class="testimonial-author">${review.name} <span class="testimonial-source">· Google review</span></p>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="section container cta-band cta-band-polished section-tight-bottom">
        <div>
          <p class="eyebrow">Custom bouquets</p>
          <h2>Need something personal and beautifully styled?</h2>
          <p>Create a bouquet that feels uniquely made for your moment. Tell us your style, color palette, and occasion, and we'll craft something beautiful for you, then confirm flower availability before payment.</p>
        </div>
        <div class="cta-actions-stack">
          <a class="btn btn-primary" href="#/custom-orders">Request a Custom Bouquet</a>
          <a class="btn btn-secondary" href="${instagramUrl}?hl=en" target="_blank" rel="noreferrer">Message us on Instagram</a>
        </div>
      </section>
    </main>
  `, 'home')
}

function shopPage() {
  const filtered = products.filter((product) => shopPriceFilters[shopPriceFilter].test(parsePriceValue(product.price)))
  const sortFn = shopSortOptions[shopSort].sort
  const visible = sortFn ? [...filtered].sort(sortFn) : filtered

  return shell(`
    <main class="section container">
      <div class="section-heading">
        <p class="eyebrow">Shop bouquets</p>
        <h1>Elegant florals designed for gifting</h1>
        <p>Explore beautifully curated bouquets for birthdays, anniversaries, romantic gestures, celebrations, and everyday surprises.</p>
      </div>
      <div class="shop-toolbar">
        <p>${visible.length === products.length ? `${products.length} bouquets available.` : `Showing ${visible.length} of ${products.length} bouquets.`}</p>
        <div class="shop-filters">
          <label class="shop-filter-label">
            Price
            <select class="shop-filter-select" data-shop-price-filter>
              ${Object.entries(shopPriceFilters).map(([value, { label }]) => `
                <option value="${value}" ${value === shopPriceFilter ? 'selected' : ''}>${label}</option>
              `).join('')}
            </select>
          </label>
          <label class="shop-filter-label">
            Sort by
            <select class="shop-filter-select" data-shop-sort>
              ${Object.entries(shopSortOptions).map(([value, { label }]) => `
                <option value="${value}" ${value === shopSort ? 'selected' : ''}>${label}</option>
              `).join('')}
            </select>
          </label>
        </div>
        <a class="btn btn-secondary" href="#/custom-orders">Need a custom bouquet?</a>
      </div>
      ${visible.length === 0 ? `
        <div class="empty-state">
          <h3>No bouquets in this price range</h3>
          <p>Try a different price filter, or get in touch for a custom arrangement.</p>
          <a class="btn btn-primary" href="#/custom-orders">Request a Custom Order</a>
        </div>
      ` : `
      <div class="product-grid">
        ${visible.map((product) => productCard(product)).join('')}
      </div>
      `}
    </main>
  `, 'shop')
}

function productPage(id) {
  const product = products.find((p) => p.id === id)

  if (!product) {
    return shell(`
      <main class="section container">
        <div class="empty-state">
          <h3>Bouquet not found</h3>
          <p>This bouquet may have been renamed or is no longer available.</p>
          <a class="btn btn-primary" href="#/shop">Back to Shop</a>
        </div>
      </main>
    `, 'shop')
  }

  return shell(`
    <main class="section container">
      <p class="breadcrumb"><a href="#/shop">&larr; Back to Shop</a></p>
      <div class="two-col story-grid-polished product-detail-grid">
        <div class="story-visual-card product-detail-visual">
          <img src="${product.image}" alt="${product.name}" loading="eager" decoding="async" width="600" height="720">
        </div>
        <div class="about-copy product-detail-copy">
          <p class="product-category">${product.category}</p>
          <h1>${product.name}</h1>
          <p class="product-detail-price"><strong>${formatPrice(product.price)}</strong></p>
          <p>${product.description}</p>
          <div class="product-actions product-detail-actions">
            <button class="btn btn-primary" data-add="${product.id}">Add to Cart</button>
            <a class="btn btn-secondary" href="${product.instagramPost || instagramUrl + '?hl=en'}" target="_blank" rel="noreferrer">DM to Order</a>
          </div>
          <p>Need a custom size or colour palette? <a class="text-link" href="#/custom-orders">Request a custom bouquet</a>.</p>
        </div>
      </div>
    </main>
  `, 'shop')
}

function aboutPage() {
  return shell(`
    <main>
      <section class="section container two-col story-grid-polished">
        <div class="story-visual-card">
          <img src="/images/optimized/century-of-roses.jpg" alt="Bloomfield century of roses arrangement" loading="lazy" decoding="async">
        </div>
        <div class="about-copy">
          <p class="eyebrow">About</p>
          <h1>We make gifting feel like a moment</h1>
          <p>Bloomfield Flowers is a Nigeria-based floral studio creating beautifully curated bouquets for meaningful moments across Abuja and Lagos. We believe flowers are more than gifts — they are expressions of love, care, celebration, and thoughtfulness.</p>
          <p>Every arrangement is carefully styled, elegantly presented, and easy to order. We work closely with each customer to make sure the bouquet feels personal, gift-ready, and exactly right for the moment.</p>
          <a class="btn btn-primary" href="#/shop">Shop Bouquets</a>
        </div>
      </section>
      <section class="section section-soft">
        <div class="container">
          <div class="section-heading section-heading-centered">
            <p class="eyebrow">What we stand for</p>
            <h2>The Bloomfield difference</h2>
          </div>
          <div class="bullet-grid">
            ${[
              ['Thoughtfully curated', 'Every bouquet is selected and styled with care, not just assembled.'],
              ['Elegant presentation', 'Gift-ready from the first look — packaging that matches the flowers.'],
              ['Personal gifting', 'We treat every order like it matters, because to someone it does.'],
              ['Warm experience', 'Secure online checkout with delivery details confirmed every step of the way.'],
              ['Abuja & Lagos delivery', 'Same-day delivery for confirmed orders placed before 2pm.'],
            ].map(([title, body]) => `
              <div class="bullet-card about-value-card">
                <h3>${title}</h3>
                <p>${body}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </main>
  `, 'about')
}

function customOrdersPage() {
  return shell(`
    <main class="section container split-page">
      <div>
        <p class="eyebrow">Custom Orders</p>
        <h1>Custom Bouquet Orders</h1>
        <p>Looking for something more personal? We create custom bouquets tailored to your occasion, style, and budget.</p>
        <p>Tell us what you're celebrating, the color palette you prefer, and the mood you want the arrangement to capture. We'll build something beautifully curated for your moment.</p>
        <div class="contact-list">
          <p><strong>Instagram DM:</strong> <a href="${instagramUrl}" target="_blank" rel="noreferrer">@${instagramHandle}</a></p>
          <p><strong>Phone:</strong> ${phoneNumber}</p>
          <p><strong>Delivery:</strong> Abuja and Lagos, same day for confirmed orders before 2pm</p>
        </div>
      </div>
      <form class="form-card" data-contact-form data-form-type="custom-order">
        <div class="form-status" data-contact-status aria-live="polite"></div>
        <label>Name<input name="name" type="text" placeholder="Your name" required></label>
        <label>Email<input name="email" type="email" placeholder="you@example.com"></label>
        <label>Phone<input name="phone" type="tel" placeholder="Phone number"></label>
        <label>Instagram handle <span class="form-label-hint">(optional — so we can reach you)</span><input name="instagram" type="text" placeholder="@yourhandle"></label>
        <label>Occasion<select name="occasion"><option>Birthday</option><option>Anniversary</option><option>Romantic</option><option>Celebration</option><option>Other</option></select></label>
        <label>Preferred colors<input name="colors" type="text" placeholder="Pink, white, purple"></label>
        <label>Budget<input name="budget" type="text" placeholder="e.g. ₦50,000"></label>
        <label>Tell us your vision<textarea name="message" rows="5" placeholder="Occasion, mood, color palette, anything that helps us create something perfect" required></textarea></label>
        <button class="btn btn-primary" type="submit" data-contact-submit>Send Custom Order Request</button>
        <p class="form-note">We'll confirm flower availability and get back to you soon.</p>
        <p class="form-note">We will respond to process your order and confirm flower availability. Thanks for your patronage.</p>
      </form>
    </main>
  `, 'custom-orders')
}

function deliveryPage() {
  return shell(`
    <main class="section container stack-page">
      <p class="eyebrow">Delivery</p>
      <h1>Delivery Information</h1>
      <p>We want your flowers to arrive beautifully and on time. Please review our delivery guidance before placing your order.</p>
      <div class="info-list">
        <div class="info-card"><h3>Locations Served</h3><p>Bloomfield Flowers currently serves Abuja and Lagos, Nigeria.</p></div>
        <div class="info-card"><h3>Same-Day Delivery</h3><p>Same-day delivery is available for confirmed orders placed before 2pm. Orders after that may roll into the next delivery window.</p></div>
        <div class="info-card"><h3>Delivery Confirmation</h3><p>Delivery details and fees are confirmed before payment. Standard delivery cutoff is 7pm.</p></div>
      </div>
      <div class="section-heading top-gap">
        <p class="eyebrow">Ordering</p>
        <h2>How ordering works</h2>
      </div>
      <div class="bullet-grid">
        <div class="bullet-card">Browse bouquet inspiration on Instagram or on the shop page.</div>
        <div class="bullet-card">Add your favorites to your cart and check out securely online.</div>
        <div class="bullet-card">We'll confirm your delivery details and get your bouquet ready for delivery.</div>
      </div>
    </main>
  `, 'delivery')
}

function flowerCarePage() {
  return shell(`
    <main>
      <section class="section flower-care-hero flower-care-hero-polished">
        <div class="container flower-care-hero-grid">
          <div class="flower-care-copy">
            <p class="eyebrow">Flower care</p>
            <h1>Keep your Bloomfield bouquet fresh, soft, and beautiful for longer</h1>
            <p class="hero-copy">A little care goes a long way. These simple steps will help your flowers stay vibrant, hydrated, and gift-ready after delivery.</p>
            <div class="hero-highlights flower-care-pills">
              <div class="hero-highlight-pill">Fresh water matters</div>
              <div class="hero-highlight-pill">Trim stems regularly</div>
              <div class="hero-highlight-pill">Keep away from direct heat</div>
            </div>
          </div>
          <div class="flower-care-hero-card flower-care-hero-card-polished">
            <img src="/images/optimized/flower-care.jpg" alt="Bloomfield bouquet care inspiration" loading="lazy" decoding="async">
          </div>
        </div>
      </section>

      <section class="section container stack-page flower-care-content-polished">
        <div class="section-heading">
          <p class="eyebrow">Care essentials</p>
          <h2>The easiest way to help flowers last longer</h2>
        </div>
        <div class="info-list care-card-grid">
          ${careMoments.map((item) => `
            <article class="info-card care-card">
              <span class="care-step-dot"></span>
              <h3>${item.title}</h3>
              <p>${item.body}</p>
            </article>
          `).join('')}
        </div>
        <div class="flower-care-band top-gap">
          <div>
            <p class="eyebrow">Extra tips</p>
            <h2>Small details that make a difference</h2>
          </div>
          <div class="bullet-grid">
            <div class="bullet-card">Remove leaves below the water line to help prevent bacteria buildup.</div>
            <div class="bullet-card">Mist delicate blooms lightly if needed, especially in dry indoor spaces.</div>
            <div class="bullet-card">Contact Bloomfield Flowers on Instagram if you want bouquet-specific care advice.</div>
          </div>
        </div>
      </section>
    </main>
  `, 'flower-care')
}

function contactPage() {
  return shell(`
    <main class="section container split-page">
      <div>
        <p class="eyebrow">Contact</p>
        <h1>Contact Bloomfield Flowers</h1>
        <p>We'd love to help you find the perfect bouquet for your moment. Reach out for questions, custom orders, or delivery inquiries.</p>
        <div class="contact-list">
          <p><strong>Email:</strong> <a href="mailto:${emailAddress}">${emailAddress}</a></p>
          <p><strong>Instagram:</strong> <a href="${instagramUrl}" target="_blank" rel="noreferrer">@${instagramHandle}</a></p>
          <p><strong>Phone / WhatsApp:</strong> <a href="${whatsappUrl}" target="_blank" rel="noreferrer">${phoneNumber}</a></p>
          <p><strong>Business Hours:</strong> ${businessHours}</p>
        </div>
      </div>
      <form class="form-card" data-contact-form>
        <div class="form-status" data-contact-status aria-live="polite"></div>
        <label>Name<input name="name" type="text" placeholder="Your name" required></label>
        <label>Email<input name="email" type="email" placeholder="you@example.com"></label>
        <label>Instagram handle <span class="form-label-hint">(optional — so we can reach you)</span><input name="instagram" type="text" placeholder="@yourhandle"></label>
        <label>Message<textarea name="message" rows="6" placeholder="How can we help?" required></textarea></label>
        <button class="btn btn-primary" type="submit" data-contact-submit>Send Message</button>
        <p class="form-note">We'll respond as soon as possible, usually within a few hours.</p>
      </form>
    </main>
  `, 'contact')
}

function cartPage() {
  const city = getCartCity()
  const items = cartDetailed(city)
  return shell(`
    <main class="section container split-page cart-layout">
      <div>
        <p class="eyebrow">Cart</p>
        <h1>Your Cart</h1>
        ${items.length ? items.map((item) => `
          <div class="cart-item-card">
            <div>
              <p class="product-category">${item.product.category}</p>
              <h3>${item.product.name}</h3>
              <p>${formatPrice(item.product.price)} each</p>
            </div>
            <div class="qty-controls">
              <button type="button" data-qty="minus" data-id="${item.id}">−</button>
              <span>${item.qty}</span>
              <button type="button" data-qty="plus" data-id="${item.id}">+</button>
            </div>
            <strong data-cart-item-total="${item.id}">${naira.format(item.subtotal)}</strong>
          </div>
        `).join('') : '<div class="empty-state"><h3>Your cart is empty</h3><p>Add a bouquet to get started.</p><a class="btn btn-primary" href="#/shop">Continue Shopping</a></div>'}
      </div>
      <aside class="summary-card summary-card-emphasis">
        <h3>Order Summary</h3>
        <div class="cart-city-row">
          <label class="cart-city-label" for="cart-city-select">Delivery city</label>
          <select id="cart-city-select" data-cart-city class="cart-city-select">
            <option value="Lagos"${city === 'Lagos' ? ' selected' : ''}>Lagos</option>
            <option value="Abuja"${city === 'Abuja' ? ' selected' : ''}>Abuja</option>
          </select>
        </div>
        <p>Items: ${cartCount()}</p>
        <p class="summary-total" data-cart-subtotal>Subtotal: ${naira.format(cartTotal(city))}</p>
        <p class="summary-note">Delivery fee is calculated at checkout based on your area.</p>
        <div class="summary-actions">
          <a class="btn btn-primary" href="#/checkout">Proceed to Checkout</a>
        </div>
        <p class="form-note cart-dm-note">Have a question before ordering? <a href="${instagramUrl}?hl=en" target="_blank" rel="noreferrer">Message us on Instagram</a></p>
      </aside>
    </main>
  `, 'cart')
}

function checkoutPage() {
  const draft = getCheckoutDraft()
  const isPickup = (draft.deliveryMethod || 'delivery') === 'pickup'
  const city = draft.city || getCartCity() || 'Lagos'
  const items = cartDetailed(city)
  const deliveryFee = isPickup ? 0 : getDeliveryFee()
  return shell(`
    <main class="section container split-page">
      <form class="form-card checkout-form-card" data-checkout-form>
        <p class="eyebrow">Checkout</p>
        <h1>Secure checkout</h1>
        <p class="form-intro">Complete your details and we'll take care of the rest.</p>
        <label>Full name<input name="fullName" type="text" placeholder="Customer full name" value="${esc(draft.fullName || '')}" required></label>
        <label>Email<input name="email" type="email" placeholder="you@example.com" value="${esc(draft.email || '')}" required></label>
        <label>Phone<input name="phone" type="tel" inputmode="tel" placeholder="Phone number" value="${esc(draft.phone || '')}" required>
          <span class="field-warning" data-phone-warning="phone" hidden>Nigerian phone numbers are at most 14 characters — e.g. 0801 234 5678 or +234 801 234 5678.</span>
        </label>
        <label>Recipient name<input name="recipientName" type="text" placeholder="Who is receiving the bouquet?" value="${esc(draft.recipientName || '')}"></label>
        <label>Recipient phone<input name="recipientPhone" type="tel" inputmode="tel" placeholder="Recipient phone number" value="${esc(draft.recipientPhone || '')}">
          <span class="field-warning" data-phone-warning="recipientPhone" hidden>Nigerian phone numbers are at most 14 characters — e.g. 0801 234 5678 or +234 801 234 5678.</span>
        </label>
        <div class="delivery-method-toggle" role="group" aria-label="Delivery method">
          <label class="method-option${!isPickup ? ' is-selected' : ''}">
            <input type="radio" name="deliveryMethod" value="delivery" ${!isPickup ? 'checked' : ''}>
            <span>Delivery</span>
          </label>
          <label class="method-option${isPickup ? ' is-selected' : ''}">
            <input type="radio" name="deliveryMethod" value="pickup" ${isPickup ? 'checked' : ''}>
            <span>Pick up</span>
          </label>
        </div>
        <label>City<select name="city" required><option value="Abuja"${city === 'Abuja' ? ' selected' : ''}>Abuja</option><option value="Lagos"${city === 'Lagos' ? ' selected' : ''}>Lagos</option></select></label>
        <div data-delivery-fields${isPickup ? ' class="hidden"' : ''}>
          <label>Delivery address<input name="address" type="text" placeholder="Street address" value="${esc(draft.address || '')}" required ${isPickup ? 'disabled' : ''}></label>
          <label>Area / district<input name="area" type="text" placeholder="e.g. Maitama, Lekki Phase 1, Victoria Island" value="${esc(draft.area || '')}" required ${isPickup ? 'disabled' : ''}></label>
          <div class="delivery-fee-display" data-delivery-fee-display>
            ${renderDeliveryFeeContent(draft.city, draft.area)}
          </div>
          <label>Delivery notes<textarea name="deliveryNotes" rows="3" placeholder="Gate code or access instructions" maxlength="500" ${isPickup ? 'disabled' : ''}>${esc(draft.deliveryNotes || '')}</textarea></label>
        </div>
        <div data-pickup-fields${!isPickup ? ' class="hidden"' : ''}>
          <div class="pickup-info-box">
            <p><strong>Pick up from our studio</strong></p>
            <p>We'll confirm the exact pickup address and your collection time via WhatsApp once your order is placed.</p>
            <a href="${whatsappUrl}" target="_blank" rel="noreferrer" class="pickup-whatsapp-link">WhatsApp us: ${phoneNumber}</a>
          </div>
        </div>
        <label>Preferred date <span class="form-label-hint">(day / month / year)</span><input name="deliveryDate" type="date" min="${deliveryMinDate()}" max="${deliveryMaxDate()}" value="${esc(draft.deliveryDate || '')}" required></label>
        <label>Preferred time<select name="deliveryTime" data-delivery-time-select required><option value="" disabled${!draft.deliveryTime ? ' selected' : ''}>Select a time</option>${deliveryTimeOptions(draft.deliveryTime || '', draft.deliveryDate || '')}</select></label>
        <label>Card message<textarea name="cardMessage" rows="3" placeholder="Add a note for the recipient" maxlength="500">${esc(draft.cardMessage || '')}</textarea></label>
        <div class="form-status" data-checkout-status aria-live="polite"></div>
        <div class="checkout-actions">
          <button class="btn btn-primary btn-pay" type="submit" data-checkout-submit>${items.length ? 'Pay Securely' : 'Add items to continue'}</button>
          <a class="btn btn-secondary" href="#/cart">Back to Cart</a>
        </div>
        <div class="payment-methods-strip">
          <span class="payment-method-badge">Card</span>
          <span class="payment-method-badge">Bank Transfer</span>
          <span class="payment-method-badge">USSD</span>
          <span class="payment-method-badge">Transfer</span>
        </div>
      </form>
      <aside class="summary-card summary-card-emphasis">
        <h3>Order Summary</h3>
        ${items.length ? `<div class="checkout-line-items">${items.map((item) => `<div class="checkout-line-item"><span>${esc(item.product.name)} × ${item.qty}</span><strong>${naira.format(item.subtotal)}</strong></div>`).join('')}</div>` : '<p>No items yet.</p>'}
        <p class="summary-total">Subtotal: ${naira.format(cartTotal(city))}</p>
        <p>Delivery: <span data-checkout-delivery>${naira.format(deliveryFee)}</span></p>
        <p class="summary-total">Total: <span data-checkout-total>${naira.format(isPickup ? cartTotal(city) : checkoutGrandTotal(city))}</span></p>
        <p class="summary-note">You'll be redirected to a secure payment page. Once payment is confirmed, we'll contact you to ${isPickup ? 'arrange your pickup' : 'arrange delivery'}.</p>
      </aside>
    </main>
  `, 'checkout')
}

function checkoutCompletePage() {
  const transactionRef = getTransactionRefFromUrl()
  return shell(`
    <main class="section container split-page checkout-complete-layout">
      <section class="form-card checkout-form-card">
        <p class="eyebrow">Order received</p>
        <h1 data-payment-title>${transactionRef ? 'Thank you for your order!' : 'Payment reference missing'}</h1>
        <div class="form-status form-status-persistent ${transactionRef ? 'form-status-working' : 'form-status-error'}" data-payment-status aria-live="polite">
          ${transactionRef
            ? 'We\'re confirming your payment — this only takes a moment. Please don\'t close this page.'
            : 'We could not verify the payment — no transaction reference was found. Please contact us on Instagram or WhatsApp if you completed a payment.'}
        </div>
        ${transactionRef ? `<p class="form-note">Reference: <strong>${esc(transactionRef)}</strong></p>` : ''}
        <div class="checkout-actions">
          <a class="btn btn-primary" href="#/shop">Continue Shopping</a>
          <a class="btn btn-secondary" href="${whatsappUrl}" target="_blank" rel="noreferrer">WhatsApp us</a>
        </div>
      </section>
      <aside class="summary-card summary-card-emphasis checkout-complete-next-steps">
        <h3>What happens next</h3>
        <div class="checkout-next-steps-grid">
          <div class="bullet-card checkout-next-step"><p>We'll confirm your order and check flower availability for your bouquet.</p></div>
          <div class="bullet-card checkout-next-step"><p>We'll contact you on WhatsApp or Instagram to confirm your delivery window.</p></div>
          <div class="bullet-card checkout-next-step"><p>Your bouquet is beautifully prepared and delivered with care on the agreed day.</p></div>
        </div>
        <p class="summary-note checkout-complete-contact-note">Questions? <a href="${whatsappUrl}" target="_blank" rel="noreferrer">WhatsApp us</a> or <a href="${instagramUrl}?hl=en" target="_blank" rel="noreferrer">message us on Instagram</a> — we respond quickly.</p>
      </aside>
    </main>
  `, 'checkout-complete')
}

function termsPage() {
  return shell(`
    <main class="section container stack-page legal-page">
      <p class="eyebrow">Legal</p>
      <h1>Terms &amp; Conditions</h1>
      <p class="legal-intro">Please read these terms carefully before placing an order with Bloomfield Flowers. By completing a purchase you confirm that you have read, understood, and agreed to the following.</p>

      <h2>1. About Bloomfield Flowers</h2>
      <p>Bloomfield Flowers is a luxury floral gifting brand based in Nigeria, serving Abuja and Lagos. We create bespoke bouquets and floral arrangements for romance, birthdays, anniversaries, and celebrations.</p>

      <h2>2. Orders</h2>
      <p>All orders are subject to flower availability. Placing an order and completing payment does not constitute a guaranteed acceptance until we have confirmed availability with you. We will contact you via WhatsApp or Instagram within a reasonable time after your order is placed to confirm details.</p>
      <p>We reserve the right to cancel any order and issue a full refund if we are unable to fulfil it due to stock unavailability or circumstances beyond our control.</p>

      <h2>3. Pricing</h2>
      <p>All prices are displayed in Nigerian Naira (₦) and are inclusive of applicable taxes. Delivery fees are calculated at checkout based on your delivery location. Prices may vary by city — Lagos and Abuja pricing may differ for the same arrangement.</p>
      <p>We reserve the right to update prices at any time. The price displayed at the time of checkout is the price you will be charged.</p>

      <h2>4. Payment</h2>
      <p>Payment is processed securely via Squad (a PCI-compliant payment platform). We accept card payments, bank transfers, and USSD. Payment must be completed in full before your order is prepared.</p>

      <h2>5. Delivery</h2>
      <p><strong>Delivery method:</strong> We use third-party dispatch riders (including but not limited to Bolt and Uber) for deliveries across Abuja and Lagos. Delivery is kerbside — our rider will bring your order to the front of the delivery address. We are unable to enter gated communities, office blocks, or residential buildings without prior arrangement.</p>
      <p><strong>Kerbside delivery:</strong> The recipient or a designated person must be available at the kerbside to receive the order at the agreed time. Bloomfield Flowers is not responsible for delays arising from the recipient being unavailable.</p>
      <p><strong>Delivery window:</strong> Deliveries are made Monday–Saturday between 10am and 6pm, and on Sundays between 1pm and 4pm. Same-day delivery is available for orders confirmed before 2pm (subject to availability). Delivery times are estimates and may be affected by traffic or unforeseen circumstances.</p>
      <p><strong>Customer responsibility:</strong> It is your responsibility to ensure that the recipient's address, phone number, and availability are correct. Bloomfield Flowers is not liable for failed deliveries caused by incorrect information provided by the customer.</p>

      <h2>6. Redelivery</h2>
      <p>If a delivery attempt fails because the recipient is unavailable or the address provided is incorrect, a redelivery fee will apply. The redelivery fee will be communicated to you before a second attempt is made.</p>

      <h2>7. Refunds &amp; Cancellations</h2>
      <p>Due to the perishable nature of fresh flowers, <strong>we do not offer refunds once an order has been prepared</strong>. If you need to cancel, please contact us via WhatsApp or Instagram as soon as possible. Cancellations received before bouquet preparation has begun may be eligible for a full refund at our discretion.</p>
      <p>If your flowers arrive in a condition that does not meet a reasonable standard of quality, please photograph them and contact us within 2 hours of delivery. We will review each case individually and, where appropriate, offer a replacement or store credit.</p>

      <h2>8. Substitutions</h2>
      <p>We source the freshest seasonal flowers available. In rare cases where a specific flower in an arrangement is unavailable, we reserve the right to substitute it with a bloom of equal or greater value that maintains the overall aesthetic and spirit of the arrangement. We will make reasonable efforts to notify you before making significant substitutions.</p>

      <h2>9. Force Majeure</h2>
      <p>Bloomfield Flowers is not liable for failure to perform obligations where such failure results from circumstances beyond our reasonable control, including but not limited to natural disasters, strikes, severe weather, supply disruptions, or government restrictions.</p>

      <h2>10. Photography &amp; Social Media</h2>
      <p>We may photograph or video our arrangements before or during delivery for use on our social media channels (Instagram, etc.). By placing an order, you consent to this use unless you specifically request otherwise in your order notes. We will never share photographs that include individuals without their explicit consent.</p>

      <h2>11. Intellectual Property</h2>
      <p>All content on the Bloomfield Flowers website — including images, text, designs, and branding — is the intellectual property of Bloomfield Flowers. You may not reproduce, distribute, or use our content without prior written permission.</p>

      <h2>12. Data &amp; Privacy</h2>
      <p>We collect and use personal data (name, email, phone, delivery address) solely for the purpose of fulfilling your order and communicating with you about it. We comply with the Nigeria Data Protection Regulation (NDPR). Please see our <a href="#/privacy">Privacy Policy</a> for full details.</p>

      <h2>13. Governing Law</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of Nigerian courts.</p>

      <h2>14. Contact Us</h2>
      <p>If you have any questions about these terms, please contact us:</p>
      <ul>
        <li>Instagram: <a href="${instagramUrl}" target="_blank" rel="noreferrer">@bloomfieldflowers_</a></li>
        <li>Email: <a href="mailto:${emailAddress}">${emailAddress}</a></li>
        <li>WhatsApp: <a href="${whatsappUrl}" target="_blank" rel="noreferrer">${phoneNumber}</a></li>
      </ul>

      <p class="legal-updated">Last updated: June 2025</p>
    </main>
  `, 'terms')
}

function privacyPage() {
  return shell(`
    <main class="section container stack-page legal-page">
      <p class="eyebrow">Legal</p>
      <h1>Privacy Policy</h1>
      <p class="legal-intro">Bloomfield Flowers is committed to protecting your personal data and respecting your privacy. This policy explains what data we collect, how we use it, and your rights under the Nigeria Data Protection Regulation (NDPR).</p>

      <h2>1. Data We Collect</h2>
      <p>When you place an order or contact us, we may collect:</p>
      <ul>
        <li>Your name and the recipient's name</li>
        <li>Email address and phone number</li>
        <li>Delivery address</li>
        <li>Order details (items, quantities, amounts)</li>
        <li>Any messages or notes included with your order</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <p>We use your personal data to:</p>
      <ul>
        <li>Process and fulfil your order</li>
        <li>Contact you about delivery arrangements</li>
        <li>Respond to enquiries</li>
        <li>Comply with legal obligations</li>
      </ul>
      <p>We do not sell, rent, or share your data with third parties for marketing purposes.</p>

      <h2>3. Data Storage</h2>
      <p>Order data is stored securely in our database. Payment processing is handled by Squad, a PCI-compliant payment platform — we do not store card details. We retain order records for a period necessary to fulfil our legal and operational obligations.</p>

      <h2>4. Your Rights</h2>
      <p>Under the NDPR, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data (subject to legal retention requirements)</li>
        <li>Withdraw consent where processing is consent-based</li>
      </ul>
      <p>To exercise any of these rights, contact us via the details below.</p>

      <h2>5. Cookies</h2>
      <p>Our website uses browser localStorage to remember your cart and checkout form state. We do not use third-party tracking cookies or advertising cookies. Google Fonts are loaded via Google's CDN, which may involve minimal data processing by Google in accordance with their privacy policy.</p>

      <h2>6. Third-Party Services</h2>
      <p>We use third-party services for payment processing, website hosting, and secure data storage. Each of these services has its own privacy policy and processes only the data necessary to perform its function. We do not grant these services access to your data for any purpose other than fulfilling your order.</p>

      <h2>7. Contact</h2>
      <p>For any privacy-related enquiries:</p>
      <ul>
        <li>Email: <a href="mailto:${emailAddress}">${emailAddress}</a></li>
        <li>WhatsApp: <a href="${whatsappUrl}" target="_blank" rel="noreferrer">${phoneNumber}</a></li>
      </ul>

      <p class="legal-updated">Last updated: June 2025</p>
    </main>
  `, 'privacy')
}

function router(route = checkoutResultState()) {
  if (route.startsWith('product/')) return productPage(route.slice('product/'.length))

  switch (route) {
    case 'shop': return shopPage()
    case 'about': return aboutPage()
    case 'custom-orders': return customOrdersPage()
    case 'delivery': return deliveryPage()
    case 'flower-care': return flowerCarePage()
    case 'contact': return contactPage()
    case 'cart': return cartPage()
    case 'checkout': return checkoutPage()
    case 'checkout-complete': return checkoutCompletePage()
    case 'terms': return termsPage()
    case 'privacy': return privacyPage()
    default: return homePage()
  }
}

async function handleCheckoutSubmit(event) {
  event.preventDefault()
  const form = event.currentTarget
  const status = form.querySelector('[data-checkout-status]')
  const submit = form.querySelector('[data-checkout-submit]')
  const formData = new FormData(form)
  const draft = Object.fromEntries(formData.entries())
  saveCheckoutDraft(draft)

  if (submit.disabled) return

  if (!cartCount()) {
    status.textContent = 'Your cart is empty. Add bouquets before checkout.'
    status.className = 'form-status form-status-error'
    return
  }

  if (!isValidNigerianPhone(draft.phone)) {
    status.textContent = 'Please enter a valid Nigerian phone number (11 digits, e.g. 0801 234 5678, or +234 followed by 10 digits).'
    status.className = 'form-status form-status-error'
    return
  }

  if (draft.recipientPhone && !isValidNigerianPhone(draft.recipientPhone)) {
    status.textContent = 'Please enter a valid Nigerian recipient phone number (11 digits, e.g. 0801 234 5678, or +234 followed by 10 digits).'
    status.className = 'form-status form-status-error'
    return
  }

  const payload = {
    customer: {
      fullName: draft.fullName,
      email: draft.email,
      phone: draft.phone,
      recipientName: draft.recipientName,
      recipientPhone: draft.recipientPhone,
    },
    delivery: {
      method: draft.deliveryMethod || 'delivery',
      city: draft.city,
      area: draft.area,
      address: draft.address,
      deliveryDate: draft.deliveryDate,
      deliveryTime: draft.deliveryTime,
      cardMessage: draft.cardMessage,
      deliveryNotes: draft.deliveryNotes,
    },
    items: getCart(),
  }

  submit.disabled = true
  status.textContent = 'Opening secure checkout…'
  status.className = 'form-status form-status-working'

  // Reuse an existing checkout session if it was created in the last 5 minutes
  const existingDraft = getCheckoutDraft()
  const pending = existingDraft._pendingCheckout
  if (pending?.url && pending?.ts && (Date.now() - pending.ts) < 5 * 60 * 1000) {
    status.textContent = 'Redirecting to payment page…'
    window.location.href = pending.url
    return
  }

  try {
    const response = await fetch('/api/checkout/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const contentType = response.headers.get('content-type') || ''
    const raw = await response.text()
    let result = {}

    if (contentType.includes('application/json')) {
      result = raw ? JSON.parse(raw) : {}
    } else if (!response.ok || raw.startsWith('<!doctype html>') || raw.includes('export default async function handler')) {
      throw new Error('Checkout requires the Vercel server runtime. For local testing, run this site with `npx vercel dev` instead of plain `npm run dev`.')
    }

    if (!response.ok || !result.checkoutUrl) {
      throw new Error(result.error || 'Unable to start checkout. Please try again.')
    }

    // Store the checkout URL so re-clicks reuse it instead of creating a new transaction
    saveCheckoutDraft({ ...getCheckoutDraft(), _pendingCheckout: { url: result.checkoutUrl, ref: result.transactionRef, ts: Date.now() } })
    status.textContent = 'Redirecting to payment page…'
    window.location.href = result.checkoutUrl
  } catch (error) {
    submit.disabled = false
    const msg = String(error.message || '')
    const isNetwork = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')
    status.textContent = isNetwork
      ? 'Network error — please check your connection and try again.'
      : msg || 'Unable to start checkout. Please try again.'
    status.className = 'form-status form-status-error'
  }
}

async function verifyReturnedPayment(retryCount = 0) {
  const target = document.querySelector('[data-payment-status]')
  const titleEl = document.querySelector('[data-payment-title]')
  const transactionRef = getTransactionRefFromUrl()
  if (!target || !transactionRef) return
  if (target.classList.contains('form-status-success') || target.classList.contains('form-status-error')) return

  try {
    const response = await fetch(`/api/checkout/verify?transaction_ref=${encodeURIComponent(transactionRef)}`)
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(result.error || 'Verification failed.')
    }

    const paymentState = String(result.transaction_status || 'Pending').toLowerCase()
    const ref = result.transaction_ref || transactionRef

    if (paymentState === 'success') {
      if (titleEl) titleEl.textContent = 'Order confirmed!'
      target.textContent = `Payment received (ref: ${ref}). We'll reach out on WhatsApp or Instagram shortly to confirm your delivery. Thank you for choosing Bloomfield Flowers!`
      target.className = 'form-status form-status-persistent form-status-success'
      const purchasedCity = getCheckoutDraft().city || 'Abuja'
      const purchaseValue = checkoutGrandTotal(purchasedCity)
      const purchasedIds = getCart().map((item) => item.id)
      if (purchaseValue > 0) {
        trackPixelEvent('Purchase', { value: purchaseValue, currency: 'NGN', content_ids: purchasedIds, content_type: 'product' })
      }
      saveCart([])
      localStorage.removeItem('bloomfield-checkout-draft')
      const badge = document.querySelector('.cart-badge')
      if (badge) badge.textContent = ''
    } else if (paymentState === 'failed' || paymentState === 'fail') {
      const d = getCheckoutDraft(); delete d._pendingCheckout; saveCheckoutDraft(d)
      if (titleEl) titleEl.textContent = 'Payment unsuccessful'
      target.textContent = 'Your payment was not completed. Your cart is saved — please return to checkout and try again, or contact us on Instagram or WhatsApp if you need help.'
      target.className = 'form-status form-status-persistent form-status-error'
    } else if (paymentState === 'abandoned') {
      const d = getCheckoutDraft(); delete d._pendingCheckout; saveCheckoutDraft(d)
      if (titleEl) titleEl.textContent = 'Payment not completed'
      target.textContent = "It looks like the payment was not completed. No worries — your cart is still saved when you're ready."
      target.className = 'form-status form-status-persistent form-status-error'
    } else if (paymentState === 'pending' || !paymentState) {
      if (retryCount < 4) {
        if (titleEl) titleEl.textContent = 'Confirming your payment…'
        target.textContent = `Almost there — your payment is being confirmed (ref: ${ref}). Hang tight, this usually takes a few seconds.`
        target.className = 'form-status form-status-persistent form-status-working'
        setTimeout(() => verifyReturnedPayment(retryCount + 1), 5000)
      } else {
        // After all retries still pending — Squad's webhook will confirm async. Clear cart.
        if (titleEl) titleEl.textContent = 'Order received!'
        target.textContent = `Your order has been placed (ref: ${ref}). Payment confirmation may take a few more minutes — we'll contact you on WhatsApp or Instagram once it clears. If you have any questions, message us directly.`
        target.className = 'form-status form-status-persistent form-status-success'
        saveCart([])
        localStorage.removeItem('bloomfield-checkout-draft')
        const badge = document.querySelector('.cart-badge')
        if (badge) badge.textContent = ''
      }
    } else {
      // Unknown status from Squad — treat pending, clear cart as safety net
      if (titleEl) titleEl.textContent = 'Order received!'
      target.textContent = `Your order has been placed (ref: ${ref}). We'll confirm your payment status and contact you on WhatsApp or Instagram shortly.`
      target.className = 'form-status form-status-persistent form-status-success'
      saveCart([])
      localStorage.removeItem('bloomfield-checkout-draft')
      const badge = document.querySelector('.cart-badge')
      if (badge) badge.textContent = ''
    }
  } catch (error) {
    const d = getCheckoutDraft(); delete d._pendingCheckout; saveCheckoutDraft(d)
    if (titleEl) titleEl.textContent = 'Unable to verify payment'
    target.textContent = 'Unable to verify payment status. Please contact us on Instagram or WhatsApp with your reference number.'
    target.className = 'form-status form-status-persistent form-status-error'
  }
}

function updateSliderDOM(index) {
  document.querySelectorAll('.showcase-slide').forEach((slide, i) => {
    slide.classList.toggle('is-active', i === index)
  })
  document.querySelectorAll('.hero-dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === index)
  })
}

async function handleContactSubmit(event) {
  event.preventDefault()
  const form = event.currentTarget
  const status = form.querySelector('[data-contact-status]')
  const submit = form.querySelector('[data-contact-submit]')
  const formType = form.dataset.formType || 'contact'
  const data = Object.fromEntries(new FormData(form).entries())
  data.formType = formType

  submit.disabled = true
  status.className = 'form-status form-status-working'
  status.textContent = 'Sending your message…'

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(result.error || 'Something went wrong.')

    const igUrl = `${instagramUrl}?hl=en`
    const msgText = data.message || ''
    status.className = 'form-status form-status-success contact-success-state'
    status.innerHTML = `
      <p><strong>Message received!</strong> We'll be in touch soon.</p>
      <p>You can also follow up with us directly on Instagram. Copy your message below and paste it into our DM.</p>
      <textarea class="contact-copy-box" readonly rows="4" data-msg-display></textarea>
      <div class="contact-success-actions">
        <button class="btn btn-secondary" data-copy-msg>Copy message</button>
        <a class="btn btn-primary" href="${igUrl}" target="_blank" rel="noreferrer">Open Instagram DM</a>
      </div>
    `
    const msgDisplay = status.querySelector('[data-msg-display]')
    if (msgDisplay) msgDisplay.value = msgText
    form.querySelectorAll('input, textarea, select, button[type=submit]').forEach((el) => { el.disabled = true })
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    status.querySelector('[data-copy-msg]')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(msgText).then(() => {
        const btn = status.querySelector('[data-copy-msg]')
        if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy message' }, 2000) }
      })
    })
  } catch (err) {
    status.className = 'form-status form-status-error'
    status.textContent = err.message || 'Unable to send. Please try again or reach out on Instagram.'
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    submit.disabled = false
  }
}

function changeHero(delta) {
  const next = (getHeroIndex() + delta + landingShowcaseSlides.length) % landingShowcaseSlides.length
  saveHeroIndex(next)
  updateSliderDOM(next)
}

function goToHero(index) {
  saveHeroIndex(index)
  updateSliderDOM(index)
}

function bindEvents() {
  document.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => addToCart(button.dataset.add))
  })

  const shopPriceFilterSelect = document.querySelector('[data-shop-price-filter]')
  if (shopPriceFilterSelect) {
    shopPriceFilterSelect.addEventListener('change', () => {
      shopPriceFilter = shopPriceFilterSelect.value
      renderApp()
    })
  }

  const shopSortSelect = document.querySelector('[data-shop-sort]')
  if (shopSortSelect) {
    shopSortSelect.addEventListener('change', () => {
      shopSort = shopSortSelect.value
      renderApp()
    })
  }

  document.querySelectorAll('[data-qty]').forEach((button) => {
    button.addEventListener('click', () => updateQty(button.dataset.id, button.dataset.qty === 'plus' ? 1 : -1))
  })

  document.querySelectorAll('[data-hero-nav]').forEach((button) => {
    button.addEventListener('click', () => changeHero(button.dataset.heroNav === 'next' ? 1 : -1))
  })

  document.querySelectorAll('[data-hero-dot]').forEach((button) => {
    button.addEventListener('click', () => goToHero(Number(button.dataset.heroDot)))
  })

  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', handleContactSubmit)
  })

  const cartCitySelect = document.querySelector('[data-cart-city]')
  if (cartCitySelect) {
    cartCitySelect.addEventListener('change', () => {
      const newCity = cartCitySelect.value
      saveCartCity(newCity)
      const updatedItems = cartDetailed(newCity)
      updatedItems.forEach((item) => {
        const el = document.querySelector(`[data-cart-item-total="${item.id}"]`)
        if (el) el.textContent = naira.format(item.subtotal)
      })
      const subtotalEl = document.querySelector('[data-cart-subtotal]')
      if (subtotalEl) subtotalEl.textContent = `Subtotal: ${naira.format(cartTotal(newCity))}`
    })
  }

  const checkoutForm = document.querySelector('[data-checkout-form]')
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit)

    checkoutForm.querySelectorAll('[name="deliveryMethod"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const pickup = radio.value === 'pickup'
        const deliveryFields = checkoutForm.querySelector('[data-delivery-fields]')
        const pickupFields = checkoutForm.querySelector('[data-pickup-fields]')
        if (deliveryFields) {
          deliveryFields.classList.toggle('hidden', pickup)
          deliveryFields.querySelectorAll('input, select, textarea').forEach((el) => { el.disabled = pickup })
        }
        if (pickupFields) pickupFields.classList.toggle('hidden', !pickup)
        checkoutForm.querySelectorAll('.method-option').forEach((opt) => {
          opt.classList.toggle('is-selected', opt.querySelector('input')?.checked)
        })
        const currentCity = checkoutForm.querySelector('[name="city"]')?.value || getCartCity() || 'Lagos'
        const currentArea = checkoutForm.querySelector('[name="area"]')?.value || ''
        const effectiveFee = pickup ? 0 : (lookupDeliveryFee(currentCity, currentArea).fee ?? 0)
        const deliveryEl = document.querySelector('[data-checkout-delivery]')
        const totalEl = document.querySelector('[data-checkout-total]')
        if (deliveryEl) deliveryEl.textContent = naira.format(effectiveFee)
        if (totalEl) totalEl.textContent = naira.format(cartTotal(currentCity) + effectiveFee)
      })
    })

    let feeUpdateTimeout
    checkoutForm.querySelectorAll('input, select, textarea').forEach((field) => {
      field.addEventListener('input', () => {
        if (field.name === 'phone' || field.name === 'recipientPhone') {
          const rawCleaned = String(field.value).replace(/[^\d+]/g, '')
          field.value = sanitizePhoneInput(field.value)
          const warningEl = checkoutForm.querySelector(`[data-phone-warning="${field.name}"]`)
          if (warningEl) warningEl.hidden = rawCleaned.length <= NIGERIA_PHONE_MAX_LENGTH
        }

        const newDraft = {
          ...getCheckoutDraft(),
          [field.name]: field.value,
        }
        saveCheckoutDraft(newDraft)

        if (field.name === 'city' || field.name === 'area') {
          clearTimeout(feeUpdateTimeout)
          feeUpdateTimeout = setTimeout(() => {
            const pickupActive = (newDraft.deliveryMethod || 'delivery') === 'pickup'
            if (!pickupActive) {
              const feeDisplay = document.querySelector('[data-delivery-fee-display]')
              if (feeDisplay) feeDisplay.innerHTML = renderDeliveryFeeContent(newDraft.city, newDraft.area)
            }
            const effectiveFee = pickupActive ? 0 : (lookupDeliveryFee(newDraft.city || 'Abuja', newDraft.area || '').fee ?? 0)
            const deliveryEl = document.querySelector('[data-checkout-delivery]')
            const totalEl = document.querySelector('[data-checkout-total]')
            if (deliveryEl) deliveryEl.textContent = naira.format(effectiveFee)
            if (totalEl) totalEl.textContent = naira.format(cartTotal(newDraft.city) + effectiveFee)
          }, 350)
        }

        if (field.name === 'deliveryDate') {
          const timeSelect = checkoutForm.querySelector('[data-delivery-time-select]')
          if (timeSelect) {
            const currentTime = timeSelect.value
            timeSelect.innerHTML = `<option value="" disabled>Select a time</option>${deliveryTimeOptions(currentTime, field.value)}`
            if (currentTime && !timeSelect.querySelector(`option[value="${currentTime}"]`)) {
              timeSelect.value = ''
            } else if (currentTime) {
              timeSelect.value = currentTime
            }
          }
        }
      })
    })
  }

  const header = document.querySelector('.site-header')
  const navToggle = document.querySelector('[data-nav-toggle]')
  const navPanel = document.querySelector('[data-nav-panel]')

  if (header && navToggle && navPanel) {
    const closeNav = () => {
      header.classList.remove('is-open')
      navToggle.setAttribute('aria-expanded', 'false')
    }

    navToggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('is-open')
      navToggle.setAttribute('aria-expanded', String(isOpen))
    })

    navPanel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNav)
    })

    document.addEventListener('click', (event) => {
      if (!header.classList.contains('is-open')) return
      if (header.contains(event.target)) return
      closeNav()
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav()
    })
  }
}

let lastRenderedRoute = ''

function renderApp() {
  try {
    const route = checkoutResultState()
    const shouldResetScroll = route !== lastRenderedRoute
    const currentScrollX = window.scrollX
    const currentScrollY = window.scrollY

    app.innerHTML = router(route)

    if (shouldResetScroll) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    } else {
      window.scrollTo({ top: currentScrollY, left: currentScrollX, behavior: 'auto' })
    }

    bindEvents()
    if (route === 'checkout-complete') verifyReturnedPayment()
    lastRenderedRoute = route
  } catch (err) {
    console.error('Render error:', err)
    if (app) app.innerHTML = '<div style="padding:3rem;text-align:center"><p>Something went wrong loading this page. <a href="/">Reload</a> or <a href="https://www.instagram.com/bloomfieldflowers_/" target="_blank">contact us on Instagram</a>.</p></div>'
  }
}

function injectProductJsonLd() {
  if (document.getElementById('product-catalog-jsonld')) return

  const merchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
    applicableCountry: 'NG',
  }

  const shippingDeliveryTime = {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
  }

  const shippingDetails = [
    {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 4000, currency: 'NGN' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NG', addressRegion: 'Lagos' },
      deliveryTime: shippingDeliveryTime,
    },
    {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 3500, currency: 'NGN' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NG', addressRegion: 'Abuja' },
      deliveryTime: shippingDeliveryTime,
    },
  ]

  const aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: reviewAggregate.ratingValue,
    reviewCount: reviewAggregate.reviewCount,
    bestRating: reviewAggregate.bestRating,
  }

  const review = testimonials.map((t) => ({
    '@type': 'Review',
    reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: reviewAggregate.bestRating },
    author: { '@type': 'Person', name: t.name },
    reviewBody: t.text,
  }))

  const itemListElement = products
    .map((product, index) => {
      const { low, high } = priceBounds(product.price)
      const offers = low === high
        ? { '@type': 'Offer', priceCurrency: 'NGN', price: low, availability: 'https://schema.org/InStock', url: `${SITE_URL}/#/product/${product.id}`, hasMerchantReturnPolicy: merchantReturnPolicy, shippingDetails }
        : { '@type': 'AggregateOffer', priceCurrency: 'NGN', lowPrice: low, highPrice: high, offerCount: 2, availability: 'https://schema.org/InStock', url: `${SITE_URL}/#/product/${product.id}`, hasMerchantReturnPolicy: merchantReturnPolicy, shippingDetails }

      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: `${SITE_URL}${product.image}`,
          url: `${SITE_URL}/#/product/${product.id}`,
          brand: { '@type': 'Brand', name: 'Bloomfield Flowers' },
          aggregateRating,
          review,
          offers,
        },
      }
    })

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = 'product-catalog-jsonld'
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Bloomfield Flowers Catalog',
    itemListElement,
  })
  document.head.appendChild(script)
}

injectProductJsonLd()
window.addEventListener('hashchange', renderApp)
renderApp()
