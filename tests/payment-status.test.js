import { test } from 'node:test'
import assert from 'node:assert/strict'
import { returnedPaymentState } from '../src/payment-status.js'

const reference = 'BFF-synthetic-payment-reference'

for (const status of ['success', 'SUCCESS', 'failed', 'fail', 'abandoned', 'pending']) {
  test('recognises matching-reference payment state ' + status, () => {
    assert.equal(returnedPaymentState({ transaction_ref: reference, transaction_status: status }, reference), status.toLowerCase())
  })
}

for (const status of [undefined, null, '']) {
  test('absent status ' + String(status) + ' stays pending, not successful', () => {
    assert.equal(returnedPaymentState({ transaction_ref: reference, transaction_status: status }, reference), 'pending')
  })
}

for (const status of [42, {}, [], true, 'paid', 'completed', 'unknown', 'success ']) {
  test('unrecognised status ' + JSON.stringify(status) + ' cannot confirm payment', () => {
    assert.equal(returnedPaymentState({ transaction_ref: reference, transaction_status: status }, reference), 'unknown')
  })
}

for (const result of [null, [], 'success', 42, {}, { transaction_status: 'success' }, { transaction_ref: 'other', transaction_status: 'success' }]) {
  test('malformed or mismatched response ' + JSON.stringify(result) + ' cannot confirm payment', () => {
    assert.equal(returnedPaymentState(result, reference), 'unknown')
  })
}

for (const expectedReference of [null, undefined, '', [], {}]) {
  test('invalid expected reference ' + JSON.stringify(expectedReference) + ' cannot confirm payment', () => {
    assert.equal(returnedPaymentState({ transaction_ref: expectedReference, transaction_status: 'success' }, expectedReference), 'unknown')
  })
}
