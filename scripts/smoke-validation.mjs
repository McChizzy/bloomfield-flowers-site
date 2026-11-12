import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { mock } from 'node:test'

const playwrightModule = process.env.BLOOMFIELD_PLAYWRIGHT_MODULE || 'playwright-core'
const { chromium } = await import(playwrightModule)
const root = fileURLToPath(new URL('../dist/', import.meta.url))
let origin
let gatewayCalls = []
let messages = []
const originalFetch = globalThis.fetch
const secretName = 'SQUAD_SECRET_KEY'
const originalSecret = process.env[secretName]
process.env[secretName] = 'sandbox_browser_validation_fixture'

mock.module('../api/_lib/supabase.js', { exports: {
  getSupabase: () => ({ from(table) {
    if (table === 'discount_codes') {
      let code
      const query = {
        select: () => query,
        eq(key, value) { if (key === 'code') code = value; return query },
        single: async () => ({ data: code === 'TEST' ? {
          code, type: 'fixed', value: 1000, active: true, max_uses: null, uses: 0,
          min_order: 0, expires_at: null, free_delivery_threshold: null,
        } : null, error: null }),
      }
      return query
    }
    if (table === 'orders') return { upsert: async () => ({ error: null }) }
    if (table === 'inquiries') return { insert: async () => ({ error: null }) }
    throw new Error('Unexpected mock database table')
  } }),
  supabaseQuery: async operation => operation(),
} })
mock.module('../api/_lib/mailer.js', { exports: { sendMail: async mail => { messages.push(mail) } } })
const { default: initiate } = await import('../api/checkout/initiate.js')
const { default: contact } = await import('../api/contact.js')
const { default: coupon } = await import('../api/checkout/apply-coupon.js')
const routes = new Map([
  ['/api/checkout/initiate', initiate], ['/api/contact', contact], ['/api/checkout/apply-coupon', coupon],
])
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://sandbox-api-d.squadco.com/transaction/initiate')
  gatewayCalls.push(JSON.parse(options.body))
  return { ok: true, status: 200, json: async () => ({ data: { checkout_url: `${origin}/test-payment` } }) }
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon' }
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, origin).pathname
    if (routes.has(pathname)) return await routes.get(pathname)(request, response)
    if (pathname.startsWith('/api/') || pathname.startsWith('/_vercel/')) {
      response.setHeader('Content-Type', 'application/json')
      response.end('{}')
      return
    }
    if (pathname === '/test-payment') {
      response.setHeader('Content-Type', 'text/html')
      response.end('<h1>Mock payment page</h1>')
      return
    }
    const extension = pathname.match(/\.[a-z0-9]+$/i)?.[0]
    const relative = extension ? decodeURIComponent(pathname).replace(/^\//, '') : 'index.html'
    if (relative.split('/').some(part => part === '..')) throw new Error('Invalid path')
    const data = await readFile(root + relative)
    response.setHeader('Content-Type', mime[extension || '.html'] || 'application/octet-stream')
    response.end(data)
  } catch {
    response.statusCode = 500
    response.end('Mock server request failed')
  }
})

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
origin = `http://127.0.0.1:${server.address().port}`
let browser
let checks = 0
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'], ...(process.env.BLOOMFIELD_CHROMIUM_PATH ? { executablePath: process.env.BLOOMFIELD_CHROMIUM_PATH } : {}) })
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, serviceWorkers: 'block' })
    await context.route('**/*', route => route.request().url().startsWith(origin + '/')
      ? route.continue() : route.fulfill({ status: 204, body: '' }))
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))

    async function check(label, action) {
      gatewayCalls = []
      messages = []
      await action()
      assert.deepEqual(errors, [], label)
      checks += 1
      console.log(`PASS ${viewport.width}px ${label}`)
    }

    for (const path of ['/contact', '/custom-orders']) {
      await check(path + ' successful submission', async () => {
        await page.goto(origin + path)
        const form = page.locator('[data-contact-form]')
        await form.locator('[name="name"]').fill('Chiké Synthetic')
        await form.locator('[name="message"]').fill('Purple flowers 🌷\nFor a birthday')
        if (path === '/custom-orders') {
          await form.locator('[name="phone"]').fill('+1 306 555 0123')
          await form.locator('[name="colors"]').fill('Purple and pink')
          await form.locator('[name="budget"]').fill('₦50,000')
        }
        const response = page.waitForResponse(result => result.url() === origin + '/api/contact')
        await form.locator('[data-contact-submit]').click()
        assert.equal((await response).status(), 200)
        await page.waitForFunction(() => document.querySelector('[data-contact-status]').textContent.includes('Message received'))
        assert.equal(messages.length, 1)
      })
    }

    async function checkout(items = [{ id: 'the-seraphina', qty: 1, addOns: [] }]) {
      await page.goto(origin + '/shop')
      await page.evaluate(cart => {
        localStorage.clear()
        localStorage.setItem('bloomfield-cart', JSON.stringify(cart))
        localStorage.setItem('bloomfield-cart-city', 'Lagos')
      }, items)
      await page.goto(origin + '/checkout')
      const form = page.locator('[data-checkout-form]')
      await form.locator('[name="fullName"]').fill('Synthetic Customer')
      await form.locator('[name="email"]').fill('synthetic@example.invalid')
      await form.locator('[name="phone"]').fill('08012345678')
      await form.locator('[name="address"]').fill('12 Test Road')
      await form.locator('[name="area"]').fill('Lekki Phase 1')
      const nextDay = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
      await form.locator('[name="deliveryDate"]').fill(nextDay)
      await form.locator('[name="deliveryTime"]').selectOption({ index: 1 })
      return form
    }

    await check('coupon valid and invalid responses', async () => {
      const form = await checkout()
      for (const [code, expected] of [['INVALID', 404], ['TEST', 200]]) {
        await form.locator('[data-coupon-input]').fill(code)
        const response = page.waitForResponse(result => result.url() === origin + '/api/checkout/apply-coupon')
        await form.locator('[data-apply-coupon]').click()
        assert.equal((await response).status(), expected)
        await page.waitForFunction(() => !document.querySelector('[data-apply-coupon]').disabled)
      }
      assert.equal(gatewayCalls.length, 0)
    })

    for (const mode of ['delivery', 'pickup-balloons', 'unknown-area']) {
      await check(mode + ' checkout', async () => {
        const form = await checkout(mode === 'pickup-balloons' ? [{ id: 'helium-balloons', qty: 3, addOns: ['colour-purple', 'inscription'] }] : undefined)
        if (mode === 'pickup-balloons') await form.locator('label.method-option').filter({ hasText: 'Pick up' }).click()
        if (mode === 'unknown-area') await form.locator('[name="area"]').fill('Synthetic new district')
        const response = page.waitForResponse(result => result.url() === origin + '/api/checkout/initiate')
        await form.locator('button[type="submit"]').click()
        const result = await response
        assert.equal(result.status(), 200)
        await page.waitForURL(origin + '/test-payment')
        assert.equal(gatewayCalls.length, 1)
        if (mode === 'pickup-balloons') assert.equal(gatewayCalls[0].amount, 33000 * 100)
        if (mode === 'unknown-area') assert.equal(gatewayCalls[0].metadata.order.deliveryFeePending, true)
      })
    }

    await check('invalid cart shows server error without initiating payment', async () => {
      const form = await checkout([{ id: 'the-seraphina', qty: 1.5, addOns: [] }])
      const response = page.waitForResponse(result => result.url() === origin + '/api/checkout/initiate')
      await form.locator('button[type="submit"]').click()
      assert.equal((await response).status(), 400)
      await page.waitForFunction(() => document.querySelector('[data-checkout-status]').textContent.includes('whole number'))
      assert.equal(gatewayCalls.length, 0)
    })
    await context.close()
  }
  console.log(`${checks} browser checks passed; real handlers with mocked mail/database/gateway, all external browser requests blocked.`)
} finally {
  await browser?.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
  globalThis.fetch = originalFetch
  if (originalSecret === undefined) delete process.env[secretName]
  else process.env[secretName] = originalSecret
  mock.restoreAll()
}
