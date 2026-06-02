import './style.css'
import { products, parsePriceValue } from './catalog.js'
import { lookupDeliveryFee } from './delivery-zones.js'

const primaryLogo = '/images/bff logo-p.jpeg'
const instagramHandle = 'bloomfieldflowers_'
const instagramUrl = 'https://www.instagram.com/bloomfieldflowers_/'
const emailAddress = 'houseofbloomfield@gmail.com'
const phoneNumber = '+234 701 120 3325'
const businessHours = 'Open 24 hours'
const dmPrefill = encodeURIComponent('Hello Bloomfield Flowers. I would like to place an order. We will respond to process your order and confirm flower availability. Thanks for your patronage.')
const customOrderPrefill = encodeURIComponent('Hello Bloomfield Flowers. I would like to request a custom bouquet. We will respond to process your order and confirm flower availability. Thanks for your patronage.')

const reviewImages = [
  '/images/optimized/review-1.jpg',
  '/images/optimized/review-2.jpg',
  '/images/optimized/review-3.jpg',
  '/images/optimized/review-4.jpg',
  '/images/optimized/review-5.jpg',
  '/images/optimized/review-6.jpg',
]

const reviewCaptions = [
  { location: 'Abuja', occasion: 'Anniversary' },
  { location: 'Lagos, Lekki', occasion: 'Birthday Surprise' },
  { location: 'Abuja, Maitama', occasion: 'Romantic Gesture' },
  { location: 'Lagos, VI', occasion: 'Birthday Gift' },
  { location: 'Abuja', occasion: 'Celebration' },
  { location: 'Lagos', occasion: 'Just Because' },
]

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
    title: 'Bloomfield Signature Hero',
    caption: 'Our current hero bouquet, now part of the showcase deck.',
  },
  {
    image: '/images/optimized/hero2.jpg',
    title: 'Bloomfield Hero Alt',
    caption: 'A softer alternate hero moment for premium gifting.',
  },
  {
    image: '/images/optimized/pink-bouquet.jpg',
    title: 'Romantic Bouquets',
    caption: 'Elegant gifting with Instagram-first ordering, premium presentation, and soft luxury styling.',
  },
  {
    image: '/images/optimized/chrysanthemum-bouquet.jpg',
    title: 'Birthday Blooms',
    caption: 'Elegant gifting with Instagram-first ordering, premium presentation, and soft luxury styling.',
  },
  {
    image: '/images/optimized/celebration-flowers.jpg',
    title: 'Celebration Flowers',
    caption: 'Elegant gifting with Instagram-first ordering, premium presentation, and soft luxury styling.',
  },
  {
    image: '/images/optimized/luxury-arrangements.jpg',
    title: 'Luxury Arrangements',
    caption: 'Elegant gifting with Instagram-first ordering, premium presentation, and soft luxury styling.',
  },
  {
    image: '/images/optimized/just-because.jpg',
    title: 'Just Because',
    caption: 'Elegant gifting with Instagram-first ordering, premium presentation, and soft luxury styling.',
  },
]

const heroHighlights = [
  'Same-day delivery before 2pm',
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
const app = document.querySelector('#app')

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
  localStorage.setItem(storageKey, JSON.stringify(cart))
}

function showCartToast(productName) {
  const prev = document.getElementById('cart-toast')
  if (prev) prev.remove()
  const toast = document.createElement('div')
  toast.id = 'cart-toast'
  toast.className = 'cart-toast'
  toast.innerHTML = `<span class="cart-toast-check">✓</span> <strong>${productName}</strong> added to cart`
  document.body.appendChild(toast)
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('cart-toast--visible')))
  setTimeout(() => {
    toast.classList.remove('cart-toast--visible')
    toast.addEventListener('transitionend', () => toast.remove(), { once: true })
  }, 2800)
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
  showCartToast(product?.name || 'Item')
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

function getCheckoutDraft() {
  try {
    return JSON.parse(localStorage.getItem(checkoutDraftKey) || '{}')
  } catch {
    return {}
  }
}

function saveCheckoutDraft(draft) {
  localStorage.setItem(checkoutDraftKey, JSON.stringify(draft))
}

function getDeliveryFee() {
  const draft = getCheckoutDraft()
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

function checkoutGrandTotal() {
  return cartTotal() + getDeliveryFee()
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

function cartDetailed() {
  return getCart()
    .map((item) => {
      const product = products.find((p) => p.id === item.id)
      if (!product) return null
      const basePrice = parsePriceValue(product.price)
      return {
        ...item,
        product,
        subtotal: basePrice * item.qty,
      }
    })
    .filter(Boolean)
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0)
}

function cartTotal() {
  return cartDetailed().reduce((sum, item) => sum + item.subtotal, 0)
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
              <a href="#/cart" class="cart-link ${route === 'cart' ? 'is-active-cart' : ''}"><span>Cart</span> <span class="cart-badge">${cartCount()}</span></a>
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
            <p>${phoneNumber}</p>
          </div>
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
            <img src="${heroScene.bouquetImage}" alt="${heroScene.alt}" loading="eager" fetchpriority="high" decoding="async">
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
          ${products.slice(0, 3).map((product) => `
            <article class="product-card">
              <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async">
              <div class="product-body">
                <p class="product-category">${product.category}</p>
                <h3>${product.name}</h3>
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
          `).join('')}
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
          <p>Real feedback and happy reactions from people who have received Bloomfield bouquets.</p>
        </div>
        <div class="review-grid">
          ${reviewImages.map((image, index) => {
            const caption = reviewCaptions[index]
            return `
            <article class="review-card">
              <img src="${image}" alt="Bloomfield Flowers customer review ${index + 1}" ${index < 3 ? 'loading="eager"' : 'loading="lazy"'} decoding="async">
              ${caption ? `
              <div class="review-caption">
                <span class="review-location">${caption.location}</span>
                <span class="review-occasion">${caption.occasion}</span>
              </div>` : ''}
            </article>
          `}).join('')}
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
  return shell(`
    <main class="section container">
      <div class="section-heading">
        <p class="eyebrow">Shop bouquets</p>
        <h1>Elegant florals designed for gifting</h1>
        <p>Explore beautifully curated bouquets for birthdays, anniversaries, romantic gestures, celebrations, and everyday surprises.</p>
      </div>
      <div class="shop-toolbar">
        <p>${products.length} bouquet styles are currently displayed while the full Bloomfield catalog is being prepared.</p>
        <a class="btn btn-secondary" href="#/custom-orders">Need a custom bouquet?</a>
      </div>
      <div class="product-grid">
        ${products.map((product) => `
          <article class="product-card">
            <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async">
            <div class="product-body">
              <p class="product-category">${product.category}</p>
              <h3>${product.name}</h3>
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
        `).join('')}
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
              ['Warm experience', 'We confirm availability and delivery before you pay. No surprises.'],
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
        <div class="bullet-card">Send an Instagram DM first, and we will confirm flower availability and delivery details.</div>
        <div class="bullet-card">After confirmation, payment can be processed and your bouquet prepared for delivery.</div>
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
          <p><strong>Phone:</strong> ${phoneNumber}</p>
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
  const items = cartDetailed()
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
            <strong>${naira.format(item.subtotal)}</strong>
          </div>
        `).join('') : '<div class="empty-state"><h3>Your cart is empty</h3><p>Add a bouquet to get started.</p><a class="btn btn-primary" href="#/shop">Continue Shopping</a></div>'}
      </div>
      <aside class="summary-card summary-card-emphasis">
        <h3>Order Summary</h3>
        <p>Items: ${cartCount()}</p>
        <p class="summary-total">Subtotal: ${naira.format(cartTotal())}</p>
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
  const items = cartDetailed()
  const draft = getCheckoutDraft()
  const deliveryFee = getDeliveryFee()
  return shell(`
    <main class="section container split-page">
      <form class="form-card checkout-form-card" data-checkout-form>
        <p class="eyebrow">Checkout</p>
        <h1>Secure checkout</h1>
        <p class="form-intro">Complete your delivery details and we'll take care of the rest.</p>
        <label>Full name<input name="fullName" type="text" placeholder="Customer full name" value="${draft.fullName || ''}" required></label>
        <label>Email<input name="email" type="email" placeholder="you@example.com" value="${draft.email || ''}" required></label>
        <label>Phone<input name="phone" type="tel" placeholder="Phone number" value="${draft.phone || ''}" required></label>
        <label>Recipient name<input name="recipientName" type="text" placeholder="Who is receiving the bouquet?" value="${draft.recipientName || ''}"></label>
        <label>Recipient phone<input name="recipientPhone" type="tel" placeholder="Recipient phone number" value="${draft.recipientPhone || ''}"></label>
        <label>Delivery address<input name="address" type="text" placeholder="Street address" value="${draft.address || ''}" required></label>
        <label>City<select name="city" required><option ${draft.city === 'Abuja' ? 'selected' : ''}>Abuja</option><option ${draft.city === 'Lagos' ? 'selected' : ''}>Lagos</option></select></label>
        <label>Area / district<input name="area" type="text" placeholder="e.g. Maitama, Lekki Phase 1, Victoria Island" value="${draft.area || ''}" required></label>
        <div class="delivery-fee-display" data-delivery-fee-display>
          ${renderDeliveryFeeContent(draft.city, draft.area)}
        </div>
        <label>Card message<textarea name="cardMessage" rows="3" placeholder="Add a note for the recipient">${draft.cardMessage || ''}</textarea></label>
        <label>Delivery notes<textarea name="deliveryNotes" rows="4" placeholder="Gate code, preferred time, or order instructions">${draft.deliveryNotes || ''}</textarea></label>
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
        ${items.length ? `<div class="checkout-line-items">${items.map((item) => `<div class="checkout-line-item"><span>${item.product.name} × ${item.qty}</span><strong>${naira.format(item.subtotal)}</strong></div>`).join('')}</div>` : '<p>No items yet.</p>'}
        <p class="summary-total">Subtotal: ${naira.format(cartTotal())}</p>
        <p>Delivery: <span data-checkout-delivery>${naira.format(deliveryFee)}</span></p>
        <p class="summary-total">Total: <span data-checkout-total>${naira.format(checkoutGrandTotal())}</span></p>
        <p class="summary-note">You'll be redirected to a secure payment page. Once payment is confirmed, we'll contact you to arrange delivery.</p>
      </aside>
    </main>
  `, 'checkout')
}

function checkoutCompletePage() {
  const transactionRef = getTransactionRefFromUrl()
  return shell(`
    <main class="section container split-page checkout-complete-layout">
      <section class="form-card checkout-form-card">
        <p class="eyebrow">Order status</p>
        <h1 data-payment-title>${transactionRef ? 'Verifying your payment…' : 'Payment reference missing'}</h1>
        <div class="form-status form-status-persistent ${transactionRef ? 'form-status-working' : 'form-status-error'}" data-payment-status aria-live="polite">
          ${transactionRef ? 'Checking your payment status…' : 'We could not verify the payment — no transaction reference was found in the return URL. Please contact us on Instagram if you completed a payment.'}
        </div>
        ${transactionRef ? `<p class="form-note">Reference: <strong>${transactionRef}</strong></p>` : ''}
        <div class="checkout-actions">
          <a class="btn btn-primary" href="#/shop">Continue Shopping</a>
          <a class="btn btn-secondary" href="${instagramUrl}?hl=en" target="_blank" rel="noreferrer">Contact us on Instagram</a>
        </div>
      </section>
      <aside class="summary-card summary-card-emphasis checkout-complete-next-steps">
        <h3>What happens next</h3>
        <div class="checkout-next-steps-grid">
          <div class="bullet-card checkout-next-step"><p>We'll review your order and confirm flower availability for your bouquet.</p></div>
          <div class="bullet-card checkout-next-step"><p>We'll reach out to you to confirm your delivery time and address details.</p></div>
          <div class="bullet-card checkout-next-step"><p>Your bouquet will be beautifully prepared and delivered with care.</p></div>
        </div>
        <p class="summary-note checkout-complete-contact-note">Questions about your order? <a href="${instagramUrl}?hl=en" target="_blank" rel="noreferrer">Message us on Instagram</a> — we typically respond within a few hours.</p>
      </aside>
    </main>
  `, 'checkout')
}

function router(route = checkoutResultState()) {
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

  if (!cartCount()) {
    status.textContent = 'Your cart is empty. Add bouquets before checkout.'
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
      city: draft.city,
      area: draft.area,
      address: draft.address,
      cardMessage: draft.cardMessage,
      deliveryNotes: draft.deliveryNotes,
    },
    items: getCart(),
  }

  submit.disabled = true
  status.textContent = 'Opening secure checkout…'
  status.className = 'form-status form-status-working'

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

    status.textContent = 'Redirecting to payment page…'
    window.location.href = result.checkoutUrl
  } catch (error) {
    submit.disabled = false
    status.textContent = error.message || 'Unable to start checkout.'
    status.className = 'form-status form-status-error'
  }
}

async function verifyReturnedPayment() {
  const target = document.querySelector('[data-payment-status]')
  const titleEl = document.querySelector('[data-payment-title]')
  const transactionRef = getTransactionRefFromUrl()
  if (!target || !transactionRef) return

  try {
    const response = await fetch(`/api/checkout/verify?transaction_ref=${encodeURIComponent(transactionRef)}`)
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(result.error || 'Verification failed.')
    }

    const paymentState = String(result.transaction_status || 'Pending')
    const ref = result.transaction_ref || transactionRef

    const states = {
      Success: {
        title: 'Payment confirmed',
        message: `Your order has been received (ref: ${ref}). We'll be in touch shortly to confirm your delivery details.`,
        className: 'form-status form-status-persistent form-status-success',
      },
      Pending: {
        title: 'Payment is being processed',
        message: `Your payment is still being processed (ref: ${ref}). We'll confirm once it clears — this usually takes a few minutes.`,
        className: 'form-status form-status-persistent form-status-working',
      },
      Failed: {
        title: 'Payment unsuccessful',
        message: 'Your payment was not completed. Please return to checkout and try again, or contact us on Instagram if you need help.',
        className: 'form-status form-status-persistent form-status-error',
      },
      Abandoned: {
        title: 'Payment not completed',
        message: 'It looks like the payment was not completed. Your cart is still saved — return to checkout when ready.',
        className: 'form-status form-status-persistent form-status-error',
      },
    }

    const state = states[paymentState] || states.Pending
    if (titleEl) titleEl.textContent = state.title
    target.textContent = state.message
    target.className = state.className

    if (paymentState === 'Success' || paymentState === 'Pending') {
      saveCart([])
      localStorage.removeItem('bloomfield-checkout-draft')
    }
  } catch (error) {
    if (titleEl) titleEl.textContent = 'Unable to verify payment'
    target.textContent = error.message || 'Unable to verify payment status. Please contact us on Instagram with your reference number.'
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
      <textarea class="contact-copy-box" readonly rows="4">${msgText.replace(/</g, '&lt;')}</textarea>
      <div class="contact-success-actions">
        <button class="btn btn-secondary" data-copy-msg>Copy message</button>
        <a class="btn btn-primary" href="${igUrl}" target="_blank" rel="noreferrer">Open Instagram DM</a>
      </div>
    `
    form.querySelectorAll('input, textarea, select, button[type=submit]').forEach((el) => { el.disabled = true })

    status.querySelector('[data-copy-msg]')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(msgText).then(() => {
        const btn = status.querySelector('[data-copy-msg]')
        if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy message' }, 2000) }
      })
    })
  } catch (err) {
    status.className = 'form-status form-status-error'
    status.textContent = err.message || 'Unable to send. Please try again or reach out on Instagram.'
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

  const checkoutForm = document.querySelector('[data-checkout-form]')
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit)
    let feeUpdateTimeout
    checkoutForm.querySelectorAll('input, select, textarea').forEach((field) => {
      field.addEventListener('input', () => {
        const newDraft = {
          ...getCheckoutDraft(),
          [field.name]: field.value,
        }
        saveCheckoutDraft(newDraft)

        if (field.name === 'city' || field.name === 'area') {
          clearTimeout(feeUpdateTimeout)
          feeUpdateTimeout = setTimeout(() => {
            const feeDisplay = document.querySelector('[data-delivery-fee-display]')
            if (feeDisplay) feeDisplay.innerHTML = renderDeliveryFeeContent(newDraft.city, newDraft.area)
            const { fee } = lookupDeliveryFee(newDraft.city || 'Abuja', newDraft.area || '')
            const effectiveFee = fee ?? 0
            const deliveryEl = document.querySelector('[data-checkout-delivery]')
            const totalEl = document.querySelector('[data-checkout-total]')
            if (deliveryEl) deliveryEl.textContent = naira.format(effectiveFee)
            if (totalEl) totalEl.textContent = naira.format(cartTotal() + effectiveFee)
          }, 350)
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
  verifyReturnedPayment()
  lastRenderedRoute = route
}

window.addEventListener('hashchange', renderApp)
renderApp()
