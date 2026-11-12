import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { verifyWebhookSignature } from '../api/_lib/squad.js'

const key = 'synthetic-webhook-test-key'
const body = '{"event":"charge.success"}'
const signature = createHmac('sha512', key).update(body).digest('hex')

test('valid lowercase and uppercase signatures remain accepted', () => {
  assert.equal(verifyWebhookSignature(body, signature, key), true)
  assert.equal(verifyWebhookSignature(body, signature.toUpperCase(), key), true)
  assert.equal(verifyWebhookSignature(Buffer.from(body), signature, key), true)
})

test('tampered body, different secret and same-length incorrect signature are rejected', () => {
  assert.equal(verifyWebhookSignature(body + ' ', signature, key), false)
  assert.equal(verifyWebhookSignature(body, signature, 'different-test-key'), false)
  assert.equal(verifyWebhookSignature(body, '0'.repeat(128), key), false)
})

for (const value of [undefined, null, [], {}, '', 'abc', '0'.repeat(127), '0'.repeat(130), 'g'.repeat(128)]) {
  test('malformed signature ' + JSON.stringify(value) + ' fails closed without throwing', () => {
    assert.equal(verifyWebhookSignature(body, value, key), false)
  })
}

test('missing secret or invalid raw-body type fails closed', () => {
  assert.equal(verifyWebhookSignature(body, signature, undefined), false)
  assert.equal(verifyWebhookSignature(body, signature, ''), false)
  assert.equal(verifyWebhookSignature({}, signature, key), false)
})
