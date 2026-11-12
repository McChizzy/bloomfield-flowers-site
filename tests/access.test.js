import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, mock, test } from 'node:test'

let database
let savedSecrets
const secrets = {
  HEALTHCHECK_SECRET: 'test-health-secret',
  CRON_SECRET: 'test-cron-secret',
}

mock.module('../api/_lib/supabase.js', {
  exports: {
    getSupabase() {
      database.clientCalls += 1
      if (database.mode === 'client throws') throw new Error('private client configuration')
      if (database.mode === 'missing client') return null
      return {
        from(table) {
          database.operations.push(['from', table])
          return {
            select(columns) {
              database.operations.push(['select', columns])
              return {
                limit(count) {
                  database.operations.push(['limit', count])
                  if (database.mode === 'query throws') throw new Error('private query failure')
                  return { data: [], error: null }
                },
              }
            },
          }
        },
      }
    },
    async supabaseQuery(callback) {
      database.queryCalls += 1
      if (database.mode === 'wrapper throws') throw new Error('private wrapper failure')
      if (database.mode === 'query error') return { error: new Error('private database failure') }
      return callback()
    },
  },
})

const { default: health } = await import('../api/health.js')
const { default: keepAlive } = await import('../api/keep-alive.js')

beforeEach(() => {
  savedSecrets = Object.fromEntries(Object.keys(secrets).map(name => [name, process.env[name]]))
  Object.assign(process.env, secrets)
  database = { mode: 'healthy', clientCalls: 0, queryCalls: 0, operations: [] }
})

afterEach(() => {
  for (const [name, value] of Object.entries(savedSecrets)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

async function request(handler, overrides = {}) {
  const response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value
    },
    end(body) {
      this.body = JSON.parse(body)
    },
  }
  await handler({ method: 'GET', headers: {}, ...overrides }, response)
  assert.equal(response.headers['cache-control'], 'no-store')
  assert.equal(response.headers['content-type'], 'application/json')
  return response
}

function assertNoDatabase() {
  assert.equal(database.clientCalls, 0)
  assert.equal(database.queryCalls, 0)
  assert.deepEqual(database.operations, [])
}

for (const [name, handler, secretName, otherSecret] of [
  ['health', health, 'HEALTHCHECK_SECRET', 'CRON_SECRET'],
  ['keep-alive', keepAlive, 'CRON_SECRET', 'HEALTHCHECK_SECRET'],
]) {
  describe(name, () => {
    const authorization = `Bearer ${secrets[secretName]}`

    for (const value of [undefined, '']) {
      test(`fails closed with ${value === undefined ? 'unset' : 'empty'} configuration`, async () => {
        if (value === undefined) delete process.env[secretName]
        else process.env[secretName] = value
        const response = await request(handler, { headers: { authorization } })
        assert.equal(response.statusCode, 403)
        assert.deepEqual(response.body, { error: 'Forbidden' })
        assertNoDatabase()
      })
    }

    for (const [label, headers, extra = {}] of [
      ['missing headers', undefined],
      ['missing authorization', {}],
      ['wrong token', { authorization: 'Bearer incorrect-token' }],
      ['other endpoint secret', { authorization: `Bearer ${secrets[otherSecret]}` }],
      ['empty token', { authorization: 'Bearer ' }],
      ['wrong scheme', { authorization: `Basic ${secrets[secretName]}` }],
      ['no scheme', { authorization: secrets[secretName] }],
      ['extra whitespace', { authorization: `Bearer  ${secrets[secretName]}` }],
      ['trailing whitespace', { authorization: `${authorization} ` }],
      ['newline', { authorization: `${authorization}\n` }],
      ['merged duplicates', { authorization: `${authorization}, ${authorization}` }],
      ['array header', { authorization: [authorization, authorization] }],
      ['single-item array', { authorization: [authorization] }],
      ['number header', { authorization: 123 }],
      ['object header', { authorization: { toString: () => authorization } }],
      ['null header', { authorization: null }],
      ['mixed-case duplicates', { authorization, Authorization: authorization }],
      ['raw duplicates', { authorization }, {
        rawHeaders: ['Authorization', authorization, 'AUTHORIZATION', authorization],
      }],
      ['query key only', {}, { query: { key: secrets[secretName] } }],
      ['query token only', {}, { query: { token: secrets[secretName] } }],
      ['query key cannot rescue wrong header', { authorization: 'Bearer incorrect' }, {
        query: { key: secrets[secretName] },
      }],
    ]) {
      test(`rejects ${label} before database access`, async () => {
        const response = await request(handler, { headers, ...extra })
        assert.equal(response.statusCode, 403)
        assert.deepEqual(response.body, { error: 'Forbidden' })
        assertNoDatabase()
      })
    }

    for (const method of ['POST', 'HEAD', 'PUT', 'DELETE', 'OPTIONS']) {
      for (const authenticated of [true, false]) {
        test(`rejects ${method}, ${authenticated ? 'authenticated' : 'unauthenticated'}`, async () => {
          const response = await request(handler, {
            method,
            headers: authenticated ? { authorization } : {},
          })
          assert.equal(response.statusCode, 405)
          assert.equal(response.headers.allow, 'GET')
          assert.deepEqual(response.body, { error: 'Method not allowed' })
          assertNoDatabase()
        })
      }
    }

    for (const headers of [{ authorization }, { Authorization: authorization.toLowerCase() }]) {
      test(`returns healthy GET for ${Object.keys(headers)[0]} header`, async () => {
        const response = await request(handler, {
          headers,
          rawHeaders: ['Authorization', Object.values(headers)[0]],
        })
        assert.equal(response.statusCode, 200)
        assert.deepEqual(response.body, { ok: true, message: 'Supabase ping OK' })
        assert.equal(database.clientCalls, 1)
        assert.equal(database.queryCalls, 1)
        assert.deepEqual(database.operations, [['from', 'orders'], ['select', 'id'], ['limit', 1]])
      })
    }

    for (const mode of ['missing client', 'client throws', 'query error', 'query throws', 'wrapper throws']) {
      test(`returns generic 503 when ${mode}`, async () => {
        database.mode = mode
        const response = await request(handler, { headers: { authorization } })
        assert.equal(response.statusCode, 503)
        assert.deepEqual(response.body, { ok: false, message: 'Database unavailable' })
        assert.equal(database.clientCalls, 1)
        assert.equal(database.queryCalls, ['missing client', 'client throws'].includes(mode) ? 0 : 1)
      })
    }
  })
}
