import { beforeEach, afterEach, mock, test } from 'node:test'
import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { productPriceValue, products, isProductAvailable } from '../src/catalog.js'
import { nigeriaToday } from '../src/delivery-zones.js'

let database
let calls
let persisted
let coupon
let upstream
const secretName = 'SQUAD_SECRET_KEY'
const originalSecret = process.env[secretName]

mock.module('../api/_lib/supabase.js', { exports: {
  getSupabase: () => database,
  supabaseQuery: async operation => operation(),
} })
const { default: handler } = await import('../api/checkout/initiate.js')

beforeEach(() => {
  process.env[secretName] = 'sandbox_synthetic_checkout_test_only'
  calls = []
  persisted = []
  database = null
  coupon = { code: 'TEST', type: 'fixed', value: 1000, min_order: 0, max_uses: null, free_delivery_threshold: null }
  upstream = { ok: true, status: 200, body: { data: { checkout_url: 'https://sandbox.example.invalid/pay' } } }
  mock.method(console, 'warn', () => {})
  mock.method(console, 'error', () => {})
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://sandbox-api-d.squadco.com/transaction/initiate')
    calls.push(JSON.parse(options.body))
    return { ok: upstream.ok, status: upstream.status, json: async () => upstream.body }
  })
})

afterEach(() => {
  mock.restoreAll()
  if (originalSecret === undefined) delete process.env[secretName]
  else process.env[secretName] = originalSecret
})

function fixture() {
  return {
    customer: { fullName: 'Synthetic Customer', email: 'synthetic@example.invalid', phone: '08012345678' },
    delivery: { method: 'delivery', city: 'Lagos', address: '12 Test Road', area: 'Lekki Phase 1', deliveryDate: '2030-11-12', deliveryTime: '10:00' },
    items: [{ id: 'the-seraphina', qty: 1, addOns: [] }],
  }
}

async function invoke(payload = fixture(), { method = 'POST', raw, headers = {} } = {}) {
  const request = new PassThrough()
  request.method = method
  request.headers = { host: 'local.example.invalid', ...headers }
  const response = { headers: {}, setHeader(key, value) { this.headers[key.toLowerCase()] = value }, end(body) { this.body = JSON.parse(body) } }
  const pending = handler(request, response)
  request.end(raw ?? JSON.stringify(payload))
  await pending
  return response
}

test('valid existing checkout opens the mocked gateway with server-controlled prices and fees', async () => {
  const payload = fixture()
  payload.items[0].price = 1
  payload.delivery.fee = 0
  const response = await invoke(payload)
  assert.equal(response.statusCode, 200)
  const price = productPriceValue(products.find(product => product.id === 'the-seraphina'), 'Lagos')
  assert.equal(response.body.amount, price + 5000)
  assert.equal(calls[0].amount, (price + 5000) * 100)
  assert.equal(calls[0].currency, 'NGN')
  assert.equal(response.body.checkoutUrl, 'https://sandbox.example.invalid/pay')
})

test('pickup accepts disabled address fields and charges no delivery fee', async () => {
  const payload = fixture()
  payload.delivery.method = 'pickup'
  delete payload.delivery.address
  delete payload.delivery.area
  const response = await invoke(payload)
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.deliveryFee, 0)
  assert.equal(response.body.deliveryFeePending, false)
})

test('unknown delivery area remains payable with delivery fee pending confirmation', async () => {
  const payload = fixture()
  payload.delivery.area = 'Synthetic new district'
  const response = await invoke(payload)
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.deliveryFeePending, true)
  assert.equal(calls[0].metadata.order.deliveryFee, null)
})

test('balloon colour, inscription and quantity retain correct pricing', async () => {
  const payload = fixture()
  payload.items = [{ id: 'helium-balloons', qty: 3, addOns: ['colour-purple', 'inscription'] }]
  const response = await invoke(payload)
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.subtotal, (6000 + 5000) * 3)
  assert.equal(calls[0].metadata.order.items[0].addOns.length, 2)
})

test('existing required colour selection remains enforced before gateway initiation', async () => {
  const payload = fixture()
  payload.items = [{ id: 'helium-balloons', qty: 1, addOns: [] }]
  const response = await invoke(payload)
  assert.equal(response.statusCode, 400)
  assert.match(response.body.error, /colour/i)
  assert.equal(calls.length, 0)
})

test('PH same-day delivery remains blocked while same-day pickup is allowed', async () => {
  const payload = fixture()
  payload.delivery.city = 'PH'
  payload.delivery.deliveryDate = nigeriaToday()
  payload.items = [{ id: products.find(product => isProductAvailable(product, 'Port Harcourt')).id, qty: 1 }]
  const blocked = await invoke(payload)
  assert.equal(blocked.statusCode, 400)
  assert.match(blocked.body.error, /Same-day/)
  assert.equal(calls.length, 0)
  payload.delivery.method = 'pickup'
  const pickup = await invoke(payload)
  assert.equal(pickup.statusCode, 200)
  assert.equal(calls[0].metadata.delivery.city, 'Port Harcourt')
})

test('city-specific availability stays enforced', async () => {
  const unavailable = products.find(product => !isProductAvailable(product, 'Port Harcourt'))
  assert(unavailable)
  const payload = fixture()
  payload.delivery.city = 'Port Harcourt'
  payload.items = [{ id: unavailable.id, qty: 1 }]
  const response = await invoke(payload)
  assert.equal(response.statusCode, 400)
  assert.match(response.body.error, /not available/)
  assert.equal(calls.length, 0)
})

test('approved discount codes and optional order persistence retain their flow', async () => {
  database = { from(table) {
    if (table === 'discount_codes') {
      const query = { select: () => query, eq: () => query, single: async () => ({ data: coupon, error: null }) }
      return query
    }
    assert.equal(table, 'orders')
    return { async upsert(row) { persisted.push(row); return { error: null } } }
  } }
  const payload = fixture()
  payload.discountCode = ' test '
  const response = await invoke(payload)
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.discountAmount, 1000)
  assert.equal(persisted.length, 1)
  assert.equal(persisted[0].total, response.body.amount)
  assert.equal(persisted[0].discount_code, 'TEST')
})

test('discount request still fails safely when the database is unavailable', async () => {
  const payload = fixture()
  payload.discountCode = 'TEST'
  const response = await invoke(payload)
  assert.equal(response.statusCode, 503)
  assert.equal(calls.length, 0)
})

const invalidEdits = [
  ['root array', () => []],
  ['null customer', payload => ({ ...payload, customer: null })],
  ['numeric phone', payload => ({ ...payload, customer: { ...payload.customer, phone: 8012345678 } })],
  ['object email', payload => ({ ...payload, customer: { ...payload.customer, email: {} } })],
  ['invalid city', payload => ({ ...payload, delivery: { ...payload.delivery, city: 'London' } })],
  ['invalid date', payload => ({ ...payload, delivery: { ...payload.delivery, deliveryDate: '2030-02-30' } })],
  ['cart object', payload => ({ ...payload, items: {} })],
  ['null item', payload => ({ ...payload, items: [null] })],
  ['fractional quantity', payload => ({ ...payload, items: [{ id: 'the-seraphina', qty: 0.5 }] })],
  ['string quantity', payload => ({ ...payload, items: [{ id: 'the-seraphina', qty: '1' }] })],
  ['unknown product', payload => ({ ...payload, items: [{ id: 'unknown', qty: 1 }] })],
  ['invalid options', payload => ({ ...payload, items: [{ id: 'helium-balloons', qty: 1, addOns: ['colour-red', 'colour-purple'] }] })],
  ['object discount', payload => ({ ...payload, discountCode: {} })],
]
for (const [label, transform] of invalidEdits) {
  test('invalid ' + label + ' returns a clean error before any database or gateway side effects', async () => {
    database = { from() { assert.fail('Invalid request touched the database') } }
    const response = await invoke(transform(fixture()))
    assert.equal(response.statusCode, 400)
    assert.equal(typeof response.body.error, 'string')
    assert.equal(calls.length, 0)
  })
}

test('malformed JSON returns 400 without payment calls', async () => {
  const response = await invoke(undefined, { raw: '{broken' })
  assert.equal(response.statusCode, 400)
  assert.equal(calls.length, 0)
})

test('oversized body returns 413 without payment calls', async () => {
  const response = await invoke(undefined, { raw: JSON.stringify({ message: 'x'.repeat(65536) }) })
  assert.equal(response.statusCode, 413)
  assert.equal(calls.length, 0)
})

test('unsupported methods return 405 without reading or initiating payment', async () => {
  const response = await invoke(undefined, { method: 'GET' })
  assert.equal(response.statusCode, 405)
  assert.equal(response.headers.allow, 'POST')
  assert.equal(calls.length, 0)
})
