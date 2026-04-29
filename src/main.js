import './style.css'

const primaryLogo = '/images/bff logo-p.jpeg'
const instagramHandle = 'bloomfieldflowers_'
const instagramUrl = 'https://www.instagram.com/bloomfieldflowers_/'
const emailAddress = 'houseofbloomfield@gmail.com'
const phoneNumber = '+234 701 120 3325'
const businessHours = 'Open 24 hours'
const dmPrefill = encodeURIComponent('Hello Bloomfield Flowers. I would like to place an order. We will respond to process your order and confirm flower availability. Thanks for your patronage.')
const customOrderPrefill = encodeURIComponent('Hello Bloomfield Flowers. I would like to request a custom bouquet. We will respond to process your order and confirm flower availability. Thanks for your patronage.')

const products = [
  {
    id: 'barbie-deluxe-m',
    name: 'Barbie Deluxe (M)',
    category: 'Flowers',
    price: '₦250,000',
    image: '/images/optimized/barbie-deluxe.jpg',
    short: 'A lush mixed bouquet made with roses, spray roses, lilies, and gypsos fillers.',
    description: 'Mixed bouquet (M) made with different types of flowers, including 20 roses, 3 spray roses, 6 lilies, and 2 gypsos fillers.',
    instagramPost: 'https://www.instagram.com/p/DWuVT6lDu8v/?img_index=1',
  },
  {
    id: 'pastel-cloud-s',
    name: 'Pastel Cloud (S)',
    category: 'Flowers',
    price: '₦50,000 - ₦80,000',
    image: '/images/optimized/pastel-cloud.jpg',
    short: 'A soft pastel mixed bouquet with lilac, white, and pink blooms.',
    description: 'Mixed bouquet (S) made with different colors of chrysanthemums, lilac, white, pink roses, and gypsos.',
    instagramPost: 'https://www.instagram.com/p/DV-wqrvDVVs/?img_index=1',
  },
  {
    id: 'century-of-roses',
    name: 'Century of Roses',
    category: 'Flowers',
    price: '₦700,000 - ₦800,000',
    image: '/images/optimized/century-of-roses.jpg',
    short: 'A dramatic 100-rose arrangement for grand romantic and luxury gifting moments.',
    description: 'A premium rose statement piece featuring 100 roses in red, pink, white, yellow, or purple.',
    instagramPost: 'https://www.instagram.com/p/DV36cdujSiI/',
  },
  {
    id: 'bff-collection',
    name: 'BFF Collection',
    category: 'Flowers',
    price: '₦390,000 - ₦840,000',
    image: '/images/optimized/bff-collection.jpg',
    short: 'A signature rose collection styled with gypsos lettering for standout gifting.',
    description: 'A premium collection of 50, 75, or 100 roses styled with custom gypsos letters.',
    instagramPost: 'https://www.instagram.com/p/DVi5Wt0l8my/?img_index=1',
  },
  {
    id: 'the-radiant-garden',
    name: 'The Radiant Garden',
    category: 'Flowers',
    price: '₦150,000 - ₦400,000',
    image: '/images/optimized/radiant-garden.jpg',
    short: 'A full mixed bouquet with layered floral textures and a rich premium feel.',
    description: 'Mixed bouquet (L) made with chrysanthemums, lilies, roses, spray roses, and gypsos.',
    instagramPost: 'https://www.instagram.com/p/DW61kFWDT10/?img_index=1',
  },
]


const reviewImages = [
  '/images/optimized/review-1.jpg',
  '/images/optimized/review-2.jpg',
  '/images/optimized/review-3.jpg',
  '/images/optimized/review-4.jpg',
  '/images/optimized/review-5.jpg',
  '/images/optimized/review-6.jpg',
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
  alt: 'Bloomfield Flowers signature bouquet hero',
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

function addToCart(productId) {
  const cart = getCart()
  const existing = cart.find((item) => item.id === productId)
  if (existing) {
    existing.qty += 1
  } else {
    cart.push({ id: productId, qty: 1 })
  }
  saveCart(cart)
  renderApp()
}

function updateQty(productId, delta) {
  const cart = getCart()
    .map((item) => item.id === productId ? { ...item, qty: item.qty + delta } : item)
    .filter((item) => item.qty > 0)
  saveCart(cart)
  renderApp()
}

function parsePriceValue(price) {
  if (typeof price === 'number') return price
  const digits = String(price).replace(/[^\d-]/g, '')
  const first = digits.split('-')[0]
  return Number(first || 0)
}

function formatPrice(price) {
  if (typeof price === 'number') return naira.format(price)
  return price
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
          <div class="hero-stage-card hero-stage-card-final">
            <div class="hero-stage-art hero-stage-art-final">
              <div class="hero-stage-glow hero-stage-glow-left"></div>
              <div class="hero-stage-glow hero-stage-glow-right"></div>
              <div class="hero-stage-frame hero-stage-frame-final">
                <img src="${heroScene.bouquetImage}" alt="${heroScene.alt}" loading="eager" fetchpriority="high" decoding="async">
              </div>
            </div>
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
            <h2>Thoughtfully curated bouquets for life’s most meaningful moments</h2>
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
          ${reviewImages.map((image, index) => `
            <article class="review-card">
              <img src="${image}" alt="Bloomfield Flowers customer review ${index + 1}" loading="lazy" decoding="async">
            </article>
          `).join('')}
        </div>
      </section>

      <section class="section container cta-band cta-band-polished section-tight-bottom">
        <div>
          <p class="eyebrow">Custom bouquets</p>
          <h2>Need something personal and beautifully styled?</h2>
          <p>Create a bouquet that feels uniquely made for your moment. Tell us your style, color palette, and occasion, and we’ll craft something beautiful for you, then confirm flower availability before payment.</p>
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
                <button class="btn btn-primary" data-add="${product.id}">Add to Cart</button>
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
    <main class="section container stack-page">
      <p class="eyebrow">About</p>
      <h1>About Bloomfield Flowers</h1>
      <p>Bloomfield Flowers is a Nigeria-based flower business dedicated to creating beautifully curated bouquets for meaningful moments across Abuja and Lagos. We believe flowers are more than gifts, they are expressions of love, care, celebration, and thoughtfulness.</p>
      <p>Our goal is to make gifting feel elegant, easy, and memorable through floral arrangements that are carefully styled, beautifully presented, and easy to order through Instagram DM first.</p>
      <div class="bullet-grid">
        ${['Thoughtfully curated designs', 'Elegant presentation', 'Meaningful gifting', 'Warm customer experience', 'Beauty in every detail'].map((item) => `<div class="bullet-card">${item}</div>`).join('')}
      </div>
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
        <p>Tell us what you’re celebrating, the color palette you prefer, and the mood you want the arrangement to capture. We’ll build something beautifully curated for your moment.</p>
        <div class="contact-list">
          <p><strong>Instagram DM:</strong> <a href="${instagramUrl}" target="_blank" rel="noreferrer">@${instagramHandle}</a></p>
          <p><strong>Secondary phone:</strong> ${phoneNumber}</p>
          <p><strong>Delivery:</strong> Abuja and Lagos, same day for confirmed orders before 2pm</p>
        </div>
      </div>
      <form class="form-card">
        <label>Name<input type="text" placeholder="Your name"></label>
        <label>Email<input type="email" placeholder="you@example.com"></label>
        <label>Phone<input type="tel" placeholder="Phone number"></label>
        <label>Occasion<select><option>Birthday</option><option>Anniversary</option><option>Romantic</option><option>Celebration</option><option>Other</option></select></label>
        <label>Preferred colors<input type="text" placeholder="Pink, white, purple"></label>
        <label>Budget<input type="number" placeholder="20000"></label>
        <label>Additional notes<textarea rows="5" placeholder="Tell us more about your vision"></textarea></label>
        <a class="btn btn-primary" href="${instagramUrl}?hl=en" target="_blank" rel="noreferrer">Send Custom Order via Instagram DM</a>
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
        <p>We’d love to help you find the perfect bouquet for your moment. Reach out for questions, custom orders, or delivery inquiries.</p>
        <div class="contact-list">
          <p><strong>Email:</strong> <a href="mailto:${emailAddress}">${emailAddress}</a></p>
          <p><strong>Instagram:</strong> <a href="${instagramUrl}" target="_blank" rel="noreferrer">@${instagramHandle}</a></p>
          <p><strong>Phone:</strong> ${phoneNumber}</p>
          <p><strong>Business Hours:</strong> ${businessHours}</p>
        </div>
      </div>
      <form class="form-card">
        <label>Name<input type="text" placeholder="Your name"></label>
        <label>Email<input type="email" placeholder="you@example.com"></label>
        <label>Message<textarea rows="6" placeholder="How can we help?"></textarea></label>
        <a class="btn btn-primary" href="${instagramUrl}?hl=en" target="_blank" rel="noreferrer">Send Instagram DM</a>
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
        <p class="summary-note">Delivery fee will be added based on the area selected in Abuja or Lagos during checkout.</p>
        <div class="summary-actions">
          <a class="btn btn-primary" href="#/checkout">Proceed to Checkout</a>
          <a class="btn btn-secondary" href="${instagramUrl}?hl=en" target="_blank" rel="noreferrer">Confirm Order in Instagram DM</a>
        </div>
      </aside>
    </main>
  `, 'cart')
}

function checkoutPage() {
  const items = cartDetailed()
  return shell(`
    <main class="section container split-page">
      <form class="form-card checkout-form-card">
        <p class="eyebrow">Checkout</p>
        <h1>Delivery details before payment</h1>
        <p class="form-intro">Complete the order details now so the payment step can be finalized cleanly once Squad is connected.</p>
        <label>Full name<input type="text" placeholder="Customer full name"></label>
        <label>Email<input type="email" placeholder="you@example.com"></label>
        <label>Phone<input type="tel" placeholder="Phone number"></label>
        <label>Recipient name<input type="text" placeholder="Who is receiving the bouquet?"></label>
        <label>Recipient phone<input type="tel" placeholder="Recipient phone number"></label>
        <label>Delivery address<input type="text" placeholder="Street address"></label>
        <label>City<select><option>Abuja</option><option>Lagos</option></select></label>
        <label>Area / district<input type="text" placeholder="Area used to calculate delivery fee"></label>
        <label>Card message<textarea rows="3" placeholder="Add a note for the recipient"></textarea></label>
        <label>Delivery notes<textarea rows="4" placeholder="Gate code, preferred time, or order instructions"></textarea></label>
        <div class="checkout-actions">
          <a class="btn btn-primary" href="${instagramUrl}?hl=en" target="_blank" rel="noreferrer">Send Order via Instagram DM</a>
          <a class="btn btn-secondary" href="#/cart">Back to Cart</a>
        </div>
        <p class="form-note">Delivery fee will be based on area. Secure payment will be added here once Squad is connected and verified.</p>
      </form>
      <aside class="summary-card summary-card-emphasis">
        <h3>Order Summary</h3>
        ${items.length ? `<div class="checkout-line-items">${items.map((item) => `<div class="checkout-line-item"><span>${item.product.name} × ${item.qty}</span><strong>${naira.format(item.subtotal)}</strong></div>`).join('')}</div>` : '<p>No items yet.</p>'}
        <p class="summary-total">Subtotal: ${naira.format(cartTotal())}</p>
        <p class="summary-note">Area-based delivery will be added after city and area are confirmed. Payment comes after that step.</p>
      </aside>
    </main>
  `, 'checkout')
}

function router() {
  const route = location.hash.replace('#/', '') || 'home'
  switch (route) {
    case 'shop': return shopPage()
    case 'about': return aboutPage()
    case 'custom-orders': return customOrdersPage()
    case 'delivery': return deliveryPage()
    case 'flower-care': return flowerCarePage()
    case 'contact': return contactPage()
    case 'cart': return cartPage()
    case 'checkout': return checkoutPage()
    default: return homePage()
  }
}

function changeHero(delta) {
  const next = (getHeroIndex() + delta + landingShowcaseSlides.length) % landingShowcaseSlides.length
  saveHeroIndex(next)
  renderApp()
}

function goToHero(index) {
  saveHeroIndex(index)
  renderApp()
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

function renderApp() {
  app.innerHTML = router()
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  bindEvents()
}

window.addEventListener('hashchange', renderApp)
renderApp()
