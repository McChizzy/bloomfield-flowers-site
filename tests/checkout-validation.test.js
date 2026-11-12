import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateCheckoutPayload } from '../api/_lib/checkout-validation.js'
import { products, isProductAvailable } from '../src/catalog.js'
import { summarizeOrder } from '../api/_lib/squad.js'

function fixture() {
  return {
    customer: { fullName: 'Chiké Test', email: 'synthetic+flowers@example.invalid', phone: '+2348012345678' },
    delivery: { method: 'delivery', city: 'Lagos', address: '12 Test Street', area: 'Lekki Phase 1', deliveryDate: '2030-11-12', deliveryTime: '10:00' },
    items: [{ id: 'the-seraphina', qty: 1, addOns: [] }],
    discountCode: null,
  }
}

test('current frontend payload, Unicode and absent optional fields remain supported', () => {
  const validated = validateCheckoutPayload(fixture())
  assert.equal(validated.customer.fullName, 'Chiké Test')
  assert.equal(validated.customer.recipientPhone, '')
  assert.equal(validated.discountCode, null)
})

test('pickup does not require area or address', () => {
  const payload = fixture()
  payload.delivery.method = 'pickup'
  delete payload.delivery.area
  delete payload.delivery.address
  assert.equal(validateCheckoutPayload(payload).delivery.method, 'pickup')
})

test('unknown delivery areas retain the pending delivery fee workflow', () => {
  const payload = fixture()
  payload.delivery.area = 'A newly built district'
  assert.equal(validateCheckoutPayload(payload).delivery.area, payload.delivery.area)
})

test('multiline card messages and delivery notes remain supported', () => {
  const payload = fixture()
  payload.delivery.cardMessage = 'Happy birthday 🌷\nLove always'
  payload.delivery.deliveryNotes = 'Call on arrival\r\nUse side gate'
  const validated = validateCheckoutPayload(payload)
  assert.equal(validated.delivery.cardMessage, payload.delivery.cardMessage)
  assert.equal(validated.delivery.deliveryNotes, payload.delivery.deliveryNotes)
})

for (const [input, expected] of [['Lagos', 'Lagos'], [' abuja ', 'Abuja'], ['PH', 'Port Harcourt'], ['port-harcourt', 'Port Harcourt'], ['port   harcourt', 'Port Harcourt']]) {
  test('supported city input ' + input + ' is canonicalised before pricing', () => {
    const payload = fixture()
    payload.delivery.city = input
    assert.equal(validateCheckoutPayload(payload).delivery.city, expected)
  })
}

for (const phone of ['08012345678', '+2348012345678', '+1 (306) 555-0123', '0801 234 5678']) {
  test('plausible formatted or international phone remains accepted: ' + phone, () => {
    const payload = fixture()
    payload.customer.phone = phone
    payload.customer.recipientPhone = phone
    assert.equal(validateCheckoutPayload(payload).customer.phone, phone)
  })
}

for (const root of [null, [], 'bad', 42]) {
  test('reject invalid root ' + JSON.stringify(root), () => {
    assert.throws(() => validateCheckoutPayload(root))
  })
}

const invalidEdits = [
  ['null customer', payload => { payload.customer = null }],
  ['array delivery', payload => { payload.delivery = [] }],
  ['object name', payload => { payload.customer.fullName = {} }],
  ['blank name', payload => { payload.customer.fullName = '   ' }],
  ['header-injected name', payload => { payload.customer.fullName = 'Test\r\nBcc: attacker@example.invalid' }],
  ['long recipient', payload => { payload.customer.recipientName = 'x'.repeat(201) }],
  ['invalid email', payload => { payload.customer.email = 'not-an-email' }],
  ['object email', payload => { payload.customer.email = {} }],
  ['email newline', payload => { payload.customer.email += '\n' }],
  ['invalid phone', payload => { payload.customer.phone = 'phone1234567890' }],
  ['short phone', payload => { payload.customer.phone = '123' }],
  ['object recipient phone', payload => { payload.customer.recipientPhone = {} }],
  ['unsupported city', payload => { payload.delivery.city = 'London' }],
  ['invalid method', payload => { payload.delivery.method = 'teleport' }],
  ['null method', payload => { payload.delivery.method = null }],
  ['missing address', payload => { payload.delivery.address = '' }],
  ['object area', payload => { payload.delivery.area = {} }],
  ['long message', payload => { payload.delivery.cardMessage = 'x'.repeat(501) }],
  ['object delivery notes', payload => { payload.delivery.deliveryNotes = {} }],
  ['control character', payload => { payload.delivery.cardMessage = 'Hello\u0000' }],
  ['missing date', payload => { delete payload.delivery.deliveryDate }],
  ['impossible date', payload => { payload.delivery.deliveryDate = '2030-02-30' }],
  ['date with suffix', payload => { payload.delivery.deliveryDate = '2030-11-12oops' }],
  ['invalid leap day', payload => { payload.delivery.deliveryDate = '2030-02-29' }],
  ['invalid time', payload => { payload.delivery.deliveryTime = '25:00' }],
  ['missing time', payload => { delete payload.delivery.deliveryTime }],
  ['object time', payload => { payload.delivery.deliveryTime = {} }],
  ['string discount', payload => { payload.discountCode = {} }],
  ['long discount', payload => { payload.discountCode = 'x'.repeat(101) }],
  ['object items', payload => { payload.items = {} }],
  ['empty cart', payload => { payload.items = [] }],
  ['too many lines', payload => { payload.items = Array.from({ length: 101 }, () => ({ id: 'the-seraphina', qty: 1 })) }],
  ['null item', payload => { payload.items = [null] }],
  ['unknown product', payload => { payload.items[0].id = 'not-a-product' }],
  ['unknown product among valid items', payload => { payload.items.push({ id: 'not-a-product', qty: 1 }) }],
  ['numeric id', payload => { payload.items[0].id = 4 }],
  ['zero quantity', payload => { payload.items[0].qty = 0 }],
  ['negative quantity', payload => { payload.items[0].qty = -1 }],
  ['fractional quantity', payload => { payload.items[0].qty = 1.5 }],
  ['string quantity', payload => { payload.items[0].qty = '2' }],
  ['missing quantity', payload => { delete payload.items[0].qty }],
  ['huge quantity', payload => { payload.items[0].qty = 101 }],
  ['NaN quantity', payload => { payload.items[0].qty = NaN }],
  ['infinite quantity', payload => { payload.items[0].qty = Infinity }],
  ['object addon', payload => { payload.items[0].addOns = {} }],
  ['null addon', payload => { payload.items[0].addOns = null }],
  ['unknown addon', payload => { payload.items[0].addOns = ['not-an-option'] }],
  ['duplicate addons', payload => { payload.items = [{ id: 'helium-balloons', qty: 1, addOns: ['colour-purple', 'colour-purple'] }] }],
  ['conflicting colours', payload => { payload.items = [{ id: 'helium-balloons', qty: 1, addOns: ['colour-purple', 'colour-red'] }] }],
]
for (const [label, edit] of invalidEdits) {
  test('reject ' + label, () => {
    const payload = fixture()
    edit(payload)
    assert.throws(() => validateCheckoutPayload(payload))
  })
}

test('valid leap-day date is accepted without adding new scheduling policy', () => {
  const payload = fixture()
  payload.delivery.deliveryDate = '2032-02-29'
  assert.equal(validateCheckoutPayload(payload).delivery.deliveryDate, '2032-02-29')
})

test('client pricing and unknown metadata are discarded rather than forwarded', () => {
  const payload = fixture()
  payload.customer.extraPrivate = 'not forwarded'
  payload.delivery.extraPrivate = 'not forwarded'
  payload.items[0].price = 1
  const validated = validateCheckoutPayload(payload)
  assert.equal(validated.customer.extraPrivate, undefined)
  assert.equal(validated.delivery.extraPrivate, undefined)
  assert.equal(validated.items[0].price, undefined)
  assert(summarizeOrder(validated.items, 0, 'Lagos').total > 1)
})

test('separate cart variants of the same product remain supported', () => {
  const payload = fixture()
  payload.items = ['colour-purple', 'colour-red'].map(colour => ({ id: 'helium-balloons', qty: 2, addOns: [colour] }))
  assert.equal(validateCheckoutPayload(payload).items.length, 2)
})

for (const city of ['Lagos', 'Abuja', 'Port Harcourt']) {
  test('all currently available catalogue products and each option survive validation in ' + city, () => {
    for (const product of products.filter(entry => isProductAvailable(entry, city))) {
      const groups = new Map((product.addOns || []).filter(option => option.group).map(option => [option.group, option.id]))
      const selections = [[], ...(product.addOns || []).map(option => [option.id])]
      for (const selected of selections) {
        const options = new Map(groups)
        const extras = []
        for (const id of selected) {
          const option = product.addOns.find(entry => entry.id === id)
          if (option.group) options.set(option.group, id)
          else extras.push(id)
        }
        const payload = fixture()
        payload.delivery.city = city
        payload.items = [{ id: product.id, qty: 2, addOns: [...options.values(), ...extras] }]
        const validated = validateCheckoutPayload(payload)
        const order = summarizeOrder(validated.items, 0, city)
        assert.equal(order.lineItems.length, 1, product.id)
        assert.equal(order.hasUnavailable, false, product.id)
        assert.equal(order.lineItems[0].missingOptions.length, 0, product.id)
        assert(Number.isSafeInteger(order.amountKobo) && order.amountKobo > 0, product.id)
      }
    }
  })
}
