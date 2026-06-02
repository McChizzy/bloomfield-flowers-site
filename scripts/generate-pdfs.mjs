import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'
import { mkdirSync } from 'fs'

const brand = '#7a2e5a'

const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; color: #222; line-height: 1.65; padding: 2cm 2.2cm; }
  .logo-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 2em; border-bottom: 2px solid ${brand}; padding-bottom: 1em; }
  .logo-bar h1 { font-size: 18pt; color: ${brand}; letter-spacing: 0.03em; }
  .logo-bar .tagline { font-size: 9pt; color: #888; margin-top: 2px; font-style: italic; }
  h1.doc-title { font-size: 22pt; color: ${brand}; margin-bottom: 0.2em; }
  .doc-date { font-size: 9pt; color: #888; margin-bottom: 2em; }
  h2 { font-size: 12pt; color: ${brand}; margin-top: 1.6em; margin-bottom: 0.4em; font-family: Georgia, serif; }
  p { margin-bottom: 0.75em; }
  ul { margin: 0.4em 0 0.75em 1.4em; }
  li { margin-bottom: 0.3em; }
  a { color: ${brand}; }
  .intro { font-size: 10.5pt; color: #444; border-left: 3px solid ${brand}; padding-left: 12px; margin-bottom: 1.5em; }
  .footer-bar { margin-top: 2.5em; border-top: 1px solid #ddd; padding-top: 0.8em; font-size: 8.5pt; color: #aaa; text-align: center; }
  strong { color: #111; }
`

const termsHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Terms &amp; Conditions — Bloomfield Flowers</title>
<style>${baseStyles}</style></head><body>
<div class="logo-bar">
  <div>
    <h1>Bloomfield Flowers</h1>
    <div class="tagline">Luxury Bouquets · Abuja &amp; Lagos</div>
  </div>
</div>

<h1 class="doc-title">Terms &amp; Conditions</h1>
<p class="doc-date">Last updated: June 2025</p>

<p class="intro">Please read these terms carefully before placing an order with Bloomfield Flowers. By completing a purchase you confirm that you have read, understood, and agreed to the following.</p>

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
<p>We collect and use personal data (name, email, phone, delivery address) solely for the purpose of fulfilling your order and communicating with you about it. We comply with the Nigeria Data Protection Regulation (NDPR). Please see our Privacy Policy for full details.</p>

<h2>13. Governing Law</h2>
<p>These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of Nigerian courts.</p>

<h2>14. Contact Us</h2>
<p>If you have any questions about these terms, please contact us:</p>
<ul>
  <li>Instagram: @bloomfieldflowers_</li>
  <li>Email: houseofbloomfield@gmail.com</li>
  <li>WhatsApp: +234 701 120 3325</li>
</ul>

<div class="footer-bar">Bloomfield Flowers · houseofbloomfield@gmail.com · +234 701 120 3325 · bloomfield-flowers-site.vercel.app</div>
</body></html>`

const privacyHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Privacy Policy — Bloomfield Flowers</title>
<style>${baseStyles}</style></head><body>
<div class="logo-bar">
  <div>
    <h1>Bloomfield Flowers</h1>
    <div class="tagline">Luxury Bouquets · Abuja &amp; Lagos</div>
  </div>
</div>

<h1 class="doc-title">Privacy Policy</h1>
<p class="doc-date">Last updated: June 2025</p>

<p class="intro">Bloomfield Flowers is committed to protecting your personal data and respecting your privacy. This policy explains what data we collect, how we use it, and your rights under the Nigeria Data Protection Regulation (NDPR).</p>

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
<ul>
  <li><strong>Squad</strong> — payment processing (their privacy policy applies to payment data)</li>
  <li><strong>Vercel</strong> — website hosting and serverless functions</li>
  <li><strong>Supabase</strong> — secure database for order records</li>
</ul>

<h2>7. Contact</h2>
<p>For any privacy-related enquiries:</p>
<ul>
  <li>Email: houseofbloomfield@gmail.com</li>
  <li>WhatsApp: +234 701 120 3325</li>
</ul>

<div class="footer-bar">Bloomfield Flowers · houseofbloomfield@gmail.com · +234 701 120 3325 · bloomfield-flowers-site.vercel.app</div>
</body></html>`

mkdirSync('/home/user/bloomfield-flowers-site/dist-pdfs', { recursive: true })

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

const page1 = await browser.newPage()
await page1.setContent(termsHtml, { waitUntil: 'networkidle0' })
await page1.pdf({
  path: '/home/user/bloomfield-flowers-site/dist-pdfs/Bloomfield-Flowers-Terms-and-Conditions.pdf',
  format: 'A4',
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  printBackground: true,
})
console.log('Terms PDF generated.')

const page2 = await browser.newPage()
await page2.setContent(privacyHtml, { waitUntil: 'networkidle0' })
await page2.pdf({
  path: '/home/user/bloomfield-flowers-site/dist-pdfs/Bloomfield-Flowers-Privacy-Policy.pdf',
  format: 'A4',
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  printBackground: true,
})
console.log('Privacy PDF generated.')

await browser.close()
console.log('Done.')
