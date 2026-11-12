import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { afterEach, beforeEach, mock, test } from 'node:test'

let mails
let inquiries
let databaseCalls
let databaseAvailable
let networkCalls

mock.module('../api/_lib/mailer.js', {
  exports: {
    async sendMail(mail) { mails.push(mail) },
  },
})
mock.module('../api/_lib/supabase.js', {
  exports: {
    getSupabase() {
      databaseCalls += 1
      if (!databaseAvailable) return null
      return {
        from(table) {
          assert.equal(table, 'inquiries')
          return {
            async insert(inquiry) {
              inquiries.push(inquiry)
              return { error: null }
            },
          }
        },
      }
    },
  },
})

const { default: handler } = await import('../api/contact.js')
const validContact = { name: ' Ada Okafor ', message: ' Please help with a bouquet. ' }
const fieldLimits = {
  name: 200, email: 200, message: 4000, instagram: 100,
  phone: 30, occasion: 200, colors: 200, budget: 100,
}

beforeEach(() => {
  mails = []
  inquiries = []
  databaseCalls = 0
  databaseAvailable = true
  networkCalls = 0
  mock.method(globalThis, 'fetch', () => {
    networkCalls += 1
    throw new Error('Unexpected external call')
  })
})

afterEach(() => {
  assert.equal(networkCalls, 0)
  mock.restoreAll()
})

async function invoke(payload = validContact, options = {}) {
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
  assert.deepEqual(inquiries, [])
  assert.deepEqual(mails, [])
  return response
}

for (const payload of [null, [], [validContact], 'contact', 42, true]) {
  test(`rejects non-object contact root ${JSON.stringify(payload)}`, async () => {
    await assertRejected(payload)
  })
}

for (const field of ['formType', ...Object.keys(fieldLimits)]) {
  for (const value of [null, 42, false, [], {}]) {
    test(`rejects non-string ${field}: ${JSON.stringify(value)} before side effects`, async () => {
      await assertRejected({ ...validContact, [field]: value })
    })
  }
}

for (const field of ['name', 'message']) {
  for (const value of [undefined, '', ' \t ']) {
    test(`requires trimmed ${field}: ${JSON.stringify(value)}`, async () => {
      await assertRejected({ ...validContact, [field]: value })
    })
  }
}

for (const [field, limit] of Object.entries(fieldLimits)) {
  test(`rejects ${field} beyond ${limit} characters`, async () => {
    await assertRejected({ ...validContact, [field]: 'a'.repeat(limit + 1) })
  })

  test(`accepts ${field} at its ${limit}-character boundary`, async () => {
    const value = field === 'email' ? `${'a'.repeat(limit - 12)}@example.com` : 'a'.repeat(limit)
    const response = await invoke({ ...validContact, [field]: value })
    assert.equal(response.statusCode, 200)
    assert.equal(mails.length, 1)
    assert.equal(inquiries.length, 1)
  })
}

for (const formType of ['', 'other', 'CONTACT', ' contact ', 'a'.repeat(21)]) {
  test(`rejects unsupported formType ${JSON.stringify(formType)}`, async () => {
    await assertRejected({ ...validContact, formType })
  })
}

for (const field of ['formType', 'name', 'email', 'instagram', 'phone', 'occasion', 'colors', 'budget']) {
  for (const separator of ['\r', '\n', '\r\n']) {
    test(`rejects ${field} containing ${JSON.stringify(separator)}`, async () => {
      await assertRejected({ ...validContact, [field]: `Ada${separator}Bcc: victim@example.com` })
    })
  }
}

for (const email of ['missing-at.example.com', 'ada@', '@example.com', 'ada@example', 'ada@@example.com', 'ada okafor@example.com']) {
  test(`rejects malformed optional email ${email}`, async () => {
    await assertRejected({ ...validContact, email })
  })
}

test('contact succeeds with omitted email, Instagram and custom-order fields', async () => {
  const response = await invoke()
  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body, { ok: true })
  assert.deepEqual(inquiries, [{
    form_type: 'contact', name: 'Ada Okafor', message: 'Please help with a bouquet.',
    email: null, phone: null, instagram: null, occasion: null, colors: null, budget: null,
  }])
  assert.equal(mails.length, 1)
  assert.match(mails[0].subject, /Contact Form.*Ada Okafor/)
  assert.match(mails[0].text, /Email: Not provided/)
  assert.match(mails[0].text, /Instagram: Not provided/)
})

test('blank optional strings remain compatible with the frontend contact form', async () => {
  const response = await invoke({ ...validContact, formType: 'contact', email: '  ', instagram: '', phone: '  ' })
  assert.equal(response.statusCode, 200)
  assert.equal(inquiries[0].email, null)
  assert.equal(inquiries[0].phone, null)
  assert.equal(inquiries[0].instagram, null)
})

for (const email of ['ada+flowers@example.co.uk', "o'connor@example.com", '用户@例子.公司']) {
  test(`accepts reasonable optional email ${email}`, async () => {
    const response = await invoke({ ...validContact, email: ` ${email} ` })
    assert.equal(response.statusCode, 200)
    assert.equal(inquiries[0].email, email)
  })
}

for (const phone of ['+1 (306) 555-0123', '+44 20 7946 0958', '+234 803 123 4567']) {
  test(`accepts international custom-order phone ${phone} and unicode fields`, async () => {
    const response = await invoke({
      formType: 'custom-order', name: ' Zoë 王 🌷 ', message: ' First line\n第二行 🌹 ',
      phone, instagram: ' @zoë_flowers ', occasion: '生日', colors: '紫色 & pink', budget: '₦50,000',
    })
    assert.equal(response.statusCode, 200)
    assert.equal(inquiries[0].form_type, 'custom-order')
    assert.equal(inquiries[0].name, 'Zoë 王 🌷')
    assert.equal(inquiries[0].message, 'First line\n第二行 🌹')
    assert.equal(inquiries[0].phone, phone)
    assert.equal(inquiries[0].email, null)
    assert.equal(inquiries[0].occasion, '生日')
    assert.equal(inquiries[0].colors, '紫色 & pink')
    assert.equal(inquiries[0].budget, '₦50,000')
    assert.match(mails[0].subject, /Custom Order Request.*Zoë 王 🌷/)
    assert.match(mails[0].text, /Instagram: @zoë_flowers/)
    assert(mails[0].text.includes(`Phone: ${phone}`))
  })
}

test('custom orders also allow all optional fields to be omitted', async () => {
  const response = await invoke({ ...validContact, formType: 'custom-order' })
  assert.equal(response.statusCode, 200)
  assert.equal(inquiries[0].form_type, 'custom-order')
  assert.equal(inquiries[0].email, null)
  assert.equal(inquiries[0].instagram, null)
})

test('escapes every rendered customer field while preserving plain text', async () => {
  const unsafe = '<b>"Rose" & \'Lily\'</b>'
  const response = await invoke({
    formType: 'custom-order', name: unsafe, message: unsafe,
    email: 'rose&lily@example.com', instagram: unsafe, phone: unsafe,
    occasion: unsafe, colors: unsafe, budget: unsafe,
  })
  assert.equal(response.statusCode, 200)
  assert(!mails[0].html.includes(unsafe))
  assert.equal(mails[0].html.match(/&lt;b&gt;&quot;Rose&quot; &amp; &#39;Lily&#39;&lt;\/b&gt;/g).length, 7)
  assert.match(mails[0].html, /rose&amp;lily@example.com/)
  assert(mails[0].text.includes(unsafe))
})

test('mail still succeeds when the optional database is unavailable', async () => {
  databaseAvailable = false
  const response = await invoke()
  assert.equal(response.statusCode, 200)
  assert.equal(mails.length, 1)
  assert.deepEqual(inquiries, [])
})

for (const raw of ['{', '{"name":', '']) {
  test(`rejects malformed or empty request ${JSON.stringify(raw)} without side effects`, async () => {
    await assertRejected(validContact, { raw })
  })
}

test('returns a generic 400 for request stream errors', async () => {
  const response = await assertRejected(validContact, { streamError: new Error('private stream detail') })
  assert.deepEqual(response.body, { error: 'Invalid request body' })
})

test('returns a generic 413 when readJson rejects an oversized request', async () => {
  const streamError = Object.assign(new Error('private body-size detail'), { statusCode: 413 })
  const response = await assertRejected(validContact, { streamError }, 413)
  assert.deepEqual(response.body, { error: 'Request body too large' })
})

test('oversized streamed contact JSON returns 413 before mail or database access', async () => {
  const raw = JSON.stringify(validContact) + ' '.repeat(70 * 1024)
  const response = await assertRejected(validContact, { raw }, 413)
  assert.deepEqual(response.body, { error: 'Request body too large' })
})

test('rejects non-POST requests before any side effects', async () => {
  const response = await assertRejected(validContact, { method: 'GET' }, 405)
  assert.equal(response.headers.allow, 'POST')
})
