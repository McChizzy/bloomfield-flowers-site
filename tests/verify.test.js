import { afterEach, beforeEach, mock, test } from 'node:test'
import assert from 'node:assert/strict'

const secretName = 'SQUAD_SECRET_KEY'
const originalSecret = process.env[secretName]
const reference = 'BFF-1794413734427-D22D84A3'
let databaseClient
let upstream
let requestedUrls
let logs
let infoLogs

mock.module('../api/_lib/supabase.js', {
  exports: { getSupabase: () => databaseClient },
})
const { default: handler } = await import('../api/checkout/verify.js')

beforeEach(() => {
  process.env[secretName] = 'sandbox_unit_test_only'
  databaseClient = null
  requestedUrls = []
  upstream = { ok: true, status: 200, body: { data: { transaction_ref: reference, transaction_status: 'success' } } }
  logs = mock.method(console, 'error', () => {})
  infoLogs = mock.method(console, 'log', () => {})
  mock.method(globalThis, 'fetch', async url => {
    requestedUrls.push(url)
    if (upstream.failure) throw new Error('SYNTHETIC_PRIVATE_GATEWAY_DETAIL')
    assert.equal(url, 'https://sandbox-api-d.squadco.com/transaction/verify/' + reference)
    return { ok: upstream.ok, status: upstream.status, json: async () => upstream.body }
  })
})

afterEach(() => {
  mock.restoreAll()
  if (originalSecret === undefined) delete process.env[secretName]
  else process.env[secretName] = originalSecret
})

async function invoke(query = { transaction_ref: reference }, method = 'GET') {
  const response = {
    headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value },
    end(body) { this.body = JSON.parse(body) },
  }
  await handler({ method, query }, response)
  assert.equal(response.headers['cache-control'], 'no-store')
  return response
}

test('verification preserves the frontend contract without customer or payment metadata', async () => {
  upstream.body.data.customer_email = 'synthetic-private@example.invalid'
  upstream.body.data.metadata = { card: 'SYNTHETIC_PRIVATE_GATEWAY_DETAIL' }
  upstream.body.data.transaction_amount = 12345
  upstream.body.data.currency = 'NGN'
  const response = await invoke()
  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body, { transaction_ref: reference, transaction_status: 'success' })
  assert.equal(requestedUrls.length, 1)
})

test('legacy reference query parameter continues to work', async () => {
  const response = await invoke({ reference })
  assert.equal(response.statusCode, 200)
})

test('verification does not add a mandatory order lookup or new database requirement', async () => {
  const updates = []
  databaseClient = {
    from(table) {
      assert.equal(table, 'orders')
      return { update(value) {
        updates.push(value)
        return { async eq(key, value) {
          assert.equal(key, 'transaction_ref')
          assert.equal(value, reference)
          return { error: null }
        } }
      } }
    },
  }
  const response = await invoke()
  assert.equal(response.statusCode, 200)
  assert.deepEqual(updates, [{ status: 'success' }])
})

for (const mode of ['error-result', 'throw']) {
  test('optional database ' + mode + ' does not reject a valid gateway confirmation or expose errors', async () => {
    databaseClient = { from() {
      if (mode === 'throw') throw new Error('SYNTHETIC_PRIVATE_GATEWAY_DETAIL')
      return { update: () => ({ eq: async () => ({ error: { message: 'SYNTHETIC_PRIVATE_GATEWAY_DETAIL' } }) }) }
    } }
    const response = await invoke()
    assert.equal(response.statusCode, 200)
    assert(!JSON.stringify(logs.mock.calls).includes('SYNTHETIC_PRIVATE_GATEWAY_DETAIL'))
  })
}

for (const status of ['pending', 'failed', 'abandoned', 'SUCCESS']) {
  test('existing ' + status + ' transaction status remains compatible', async () => {
    upstream.body.data.transaction_status = status
    const response = await invoke()
    assert.equal(response.statusCode, 200)
    assert.equal(response.body.transaction_status, status)
  })
}

test('absent or malformed transaction status is not echoed as arbitrary nested data', async () => {
  upstream.body.data.transaction_status = { private: 'SYNTHETIC_PRIVATE_GATEWAY_DETAIL' }
  const response = await invoke()
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.transaction_status, null)
  assert(!JSON.stringify(infoLogs.mock.calls).includes('SYNTHETIC_PRIVATE_GATEWAY_DETAIL'))
})

test('unexpected scalar status cannot expose gateway details in logs or responses', async () => {
  upstream.body.data.transaction_status = 'SYNTHETIC_PRIVATE_GATEWAY_DETAIL'
  const response = await invoke()
  assert.equal(response.body.transaction_status, null)
  assert(!JSON.stringify(infoLogs.mock.calls).includes('SYNTHETIC_PRIVATE_GATEWAY_DETAIL'))
})

test('mismatched gateway reference is rejected before any order update', async () => {
  databaseClient = { from() { throw new Error('Unexpected database write') } }
  upstream.body.data.transaction_ref = 'BFF-other-reference'
  const response = await invoke()
  assert.equal(response.statusCode, 502)
  assert.deepEqual(response.body, { error: 'Unable to verify transaction.' })
})

for (const data of [null, [], 'private', 42]) {
  test('malformed gateway payload ' + JSON.stringify(data) + ' is rejected', async () => {
    upstream.body = { data }
    const response = await invoke()
    assert.equal(response.statusCode, 502)
  })
}

test('gateway failure details are not returned to the browser', async () => {
  upstream = { ok: false, status: 429, body: { message: 'SYNTHETIC_PRIVATE_GATEWAY_DETAIL', data: { private: true } } }
  const response = await invoke()
  assert.equal(response.statusCode, 429)
  assert.deepEqual(response.body, { error: 'Unable to verify transaction.' })
})

test('gateway exception details are not logged or returned', async () => {
  upstream.failure = true
  const response = await invoke()
  assert.equal(response.statusCode, 500)
  assert.deepEqual(response.body, { error: 'Transaction verification failed.' })
  assert(!JSON.stringify(logs.mock.calls).includes('SYNTHETIC_PRIVATE_GATEWAY_DETAIL'))
})

test('missing gateway configuration fails without making an outbound request', async () => {
  delete process.env[secretName]
  const response = await invoke()
  assert.equal(response.statusCode, 500)
  assert.equal(requestedUrls.length, 0)
})

test('unsupported methods do not call the gateway', async () => {
  const response = await invoke({ transaction_ref: reference }, 'POST')
  assert.equal(response.statusCode, 405)
  assert.equal(response.headers.allow, 'GET')
  assert.equal(requestedUrls.length, 0)
})

for (const value of [undefined, '', ['duplicate'], {}, '../escape', 'contains space', 'x'.repeat(129)]) {
  test('invalid reference ' + JSON.stringify(value) + ' is rejected without outbound calls', async () => {
    const response = await invoke({ transaction_ref: value })
    assert.equal(response.statusCode, 400)
    assert.equal(requestedUrls.length, 0)
  })
}
