import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { afterEach, beforeEach, mock, test } from 'node:test'

let databaseCalls
let queryCalls
let operations
let result
let databaseAvailable
let networkCalls
let mailCalls

mock.module('../api/_lib/mailer.js', {
  exports: { async sendMail() { mailCalls += 1 } },
})
mock.module('../api/_lib/supabase.js', {
  exports: {
    getSupabase() {
      databaseCalls += 1
      if (!databaseAvailable) return null
      return {
        from(table) {
          operations.push(['from', table])
          return {
            select(columns) {
              operations.push(['select', columns])
              return this
            },
            eq(field, value) {
              operations.push(['eq', field, value])
              return this
            },
            async single() { return result },
          }
        },
      }
    },
    async supabaseQuery(callback) {
      queryCalls += 1
      return callback()
    },
  },
})

const { default: handler } = await import('../api/checkout/apply-coupon.js')
const validCoupon = { code: ' rose10 ', subtotal: 50000 }

beforeEach(() => {
  databaseCalls = 0
  queryCalls = 0
  operations = []
  databaseAvailable = true
  networkCalls = 0
  mailCalls = 0
  result = {
    data: {
      code: 'ROSE10', type: 'percent', value: 10, active: true,
      expires_at: null, max_uses: null, uses: 0, min_order: 0, free_delivery_threshold: null,
    },
    error: null,
  }
  mock.method(globalThis, 'fetch', () => {
    networkCalls += 1
    throw new Error('Unexpected external call')
  })
})

afterEach(() => {
  assert.equal(networkCalls, 0)
  assert.equal(mailCalls, 0)
  mock.restoreAll()
})

async function invoke(payload = validCoupon, options = {}) {
  const raw = options.raw ?? JSON.stringify(payload)
  const request = options.streamError
    ? Readable.from((async function* () { throw options.streamError })())
    : Readable.from([Buffer.from(raw.slice(0, 12)), Buffer.from(raw.slice(12))])
  request.method = options.method || 'POST'
  request.headers = { 'content-type': 'application/json' }
  const response = {
    headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value },
    end(body) { this.body = JSON.parse(body) },
  }
  await handler(request, response)
  assert.equal(response.headers['content-type'], 'application/json')
  return response
}

async function assertRejected(payload, options = {}, status = 400) {
  const response = await invoke(payload, options)
  assert.equal(response.statusCode, status)
  assert.equal(typeof response.body.error, 'string')
  assert.equal(databaseCalls, 0)
  assert.equal(queryCalls, 0)
  assert.deepEqual(operations, [])
  return response
}

for (const payload of [null, [], [validCoupon], 'ROSE10', 42, true]) {
  test(`rejects non-object coupon root ${JSON.stringify(payload)}`, async () => {
    await assertRejected(payload)
  })
}

for (const code of [undefined, null, false, 42, [], ['ROSE10'], {}, '', ' \t ', 'a'.repeat(101), ` ${'a'.repeat(101)} `]) {
  test(`rejects invalid coupon code ${JSON.stringify(code)} before database access`, async () => {
    await assertRejected({ ...validCoupon, code })
  })
}

for (const subtotal of [undefined, null, false, '50000', [], {}, -1, -0.01, 1e9 + 1, Number.MAX_SAFE_INTEGER, NaN, Infinity, -Infinity]) {
  test(`rejects invalid subtotal ${String(subtotal)} before database access`, async () => {
    await assertRejected({ ...validCoupon, subtotal })
  })
}

for (const literal of ['1e309', '-1e309']) {
  test(`rejects nonfinite JSON subtotal ${literal}`, async () => {
    await assertRejected(validCoupon, { raw: `{"code":"ROSE10","subtotal":${literal}}` })
  })
}

test('valid percentage coupon keeps the frontend contract and normalizes the code', async () => {
  const response = await invoke()
  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body, {
    valid: true, code: 'ROSE10', discountAmount: 5000, freeDelivery: false,
    type: 'percent', value: 10, message: '10% off applied',
  })
  assert.equal(databaseCalls, 1)
  assert.equal(queryCalls, 1)
  assert.deepEqual(operations, [
    ['from', 'discount_codes'], ['select', '*'], ['eq', 'code', 'ROSE10'], ['eq', 'active', true],
  ])
})

for (const subtotal of [0, 0.5, 1e9]) {
  test(`accepts finite bounded subtotal ${subtotal}`, async () => {
    const response = await invoke({ ...validCoupon, subtotal })
    assert.equal(response.statusCode, 200)
    assert.equal(response.body.discountAmount, Math.round(subtotal * 0.1))
  })
}

for (const code of ['a', 'a'.repeat(100), ` ${'a'.repeat(100)} `, ' 花束-é10 ']) {
  test(`accepts bounded trimmed coupon code ${JSON.stringify(code)}`, async () => {
    result.data.code = code.trim().toUpperCase()
    const response = await invoke({ ...validCoupon, code })
    assert.equal(response.statusCode, 200)
    assert.equal(response.body.code, code.trim().toUpperCase())
    assert.deepEqual(operations[2], ['eq', 'code', code.trim().toUpperCase()])
  })
}

test('fixed coupon remains capped at subtotal and preserves free delivery', async () => {
  Object.assign(result.data, { type: 'fixed', value: 60000, free_delivery_threshold: 50000 })
  const response = await invoke()
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.discountAmount, 50000)
  assert.equal(response.body.freeDelivery, true)
  assert.equal(response.body.message, '60000₦ off applied · free delivery included')
})

test('unknown codes keep the existing user-friendly response', async () => {
  result = { data: null, error: { message: 'private database detail' } }
  const response = await invoke()
  assert.equal(response.statusCode, 404)
  assert.deepEqual(response.body, { valid: false, error: 'Invalid or expired discount code' })
})

for (const [label, fields, expected] of [
  ['expired', { expires_at: '2000-01-01T00:00:00Z' }, 'This discount code has expired'],
  ['exhausted', { max_uses: 5, uses: 5 }, 'This discount code has reached its usage limit'],
  ['minimum order', { min_order: 60000 }, 'Minimum order of ₦60,000 required for this code'],
]) {
  test(`${label} coupon keeps the existing failure contract`, async () => {
    Object.assign(result.data, fields)
    const response = await invoke()
    assert.equal(response.statusCode, 400)
    assert.deepEqual(response.body, { valid: false, error: expected })
  })
}

test('missing discount service keeps the existing availability response', async () => {
  databaseAvailable = false
  const response = await invoke()
  assert.equal(response.statusCode, 503)
  assert.deepEqual(response.body, { error: 'Discount service temporarily unavailable' })
  assert.equal(queryCalls, 0)
})

for (const raw of ['{', '{"code":', '']) {
  test(`rejects malformed or empty coupon request ${JSON.stringify(raw)}`, async () => {
    await assertRejected(validCoupon, { raw })
  })
}

test('returns a generic 400 for coupon request stream errors', async () => {
  const response = await assertRejected(validCoupon, { streamError: new Error('private stream detail') })
  assert.deepEqual(response.body, { error: 'Invalid request' })
})

test('returns a generic 413 when readJson rejects an oversized coupon request', async () => {
  const streamError = Object.assign(new Error('private body-size detail'), { statusCode: 413 })
  const response = await assertRejected(validCoupon, { streamError }, 413)
  assert.deepEqual(response.body, { error: 'Request body too large' })
})

test('oversized streamed coupon JSON returns 413 before database access', async () => {
  const raw = JSON.stringify(validCoupon) + ' '.repeat(70 * 1024)
  const response = await assertRejected(validCoupon, { raw }, 413)
  assert.deepEqual(response.body, { error: 'Request body too large' })
})

test('rejects non-POST coupon requests before database access', async () => {
  const response = await assertRejected(validCoupon, { method: 'GET' }, 405)
  assert.equal(response.headers.allow, 'POST')
})
