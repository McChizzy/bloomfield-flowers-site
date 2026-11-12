import crypto from 'node:crypto'
import { products, parsePriceValue, productPriceValue, isProductAvailable } from '../../src/catalog.js'

const TEST_BASE_URL = 'https://sandbox-api-d.squadco.com'
const LIVE_BASE_URL = 'https://api-d.squadco.com'

export function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export const MAX_JSON_BODY_BYTES = 64 * 1024

export async function readJson(req) {
  const tooLarge = () => Object.assign(new Error('Request body is too large.'), { statusCode: 413 })
  const contentLength = req.headers?.['content-length']
  if (contentLength !== undefined && (typeof contentLength !== 'string' || !/^\d+$/.test(contentLength))) {
    throw new Error('Invalid content length.')
  }
  if (contentLength !== undefined && Number(contentLength) > MAX_JSON_BODY_BYTES) throw tooLarge()
  if (req.body !== undefined) {
    const body = typeof req.body === 'string' || Buffer.isBuffer(req.body)
      ? req.body
      : JSON.stringify(req.body)
    if (typeof body !== 'string' && !Buffer.isBuffer(body)) throw new Error('Invalid request body.')
    if (Buffer.byteLength(body) > MAX_JSON_BODY_BYTES) throw tooLarge()
    return body.length ? JSON.parse(body.toString()) : {}
  }
  return new Promise((resolve, reject) => {
    const chunks = []
    let bytes = 0
    let settled = false
    const fail = error => {
      if (settled) return
      settled = true
      chunks.length = 0
      reject(error)
    }
    req.on('data', (chunk) => {
      if (settled) return
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      bytes += buffer.length
      if (bytes > MAX_JSON_BODY_BYTES) return fail(tooLarge())
      chunks.push(buffer)
    })
    req.on('end', () => {
      if (settled) return
      try {
        const body = Buffer.concat(chunks).toString('utf8')
        const payload = body ? JSON.parse(body) : {}
        settled = true
        chunks.length = 0
        resolve(payload)
      } catch (error) {
        fail(error)
      }
    })
    req.on('error', fail)
    req.on('aborted', () => fail(new Error('Request aborted.')))
  })
}

export function getEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error('Payment system configuration error. Please contact us directly to complete your order.')
  }
  return value
}

export function getSquadBaseUrl(secretKey) {
  return secretKey.startsWith('sandbox_') ? TEST_BASE_URL : LIVE_BASE_URL
}

export function buildSiteUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`
}

export function generateTransactionRef() {
  return `BFF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

export function getCartSnapshot(items = [], city = '') {
  return items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id)
      if (!product) return null
      const qty = Math.max(1, Number(item.qty || 0))
      const addOnIds = new Set(Array.isArray(item.addOns) ? item.addOns : [])
      const addOns = (product.addOns || [])
        .filter((addOn) => addOnIds.has(addOn.id))
        .map((addOn) => ({
          id: addOn.id,
          name: addOn.name,
          ...(addOn.group ? { group: addOn.group } : {}),
          unitAmount: parsePriceValue(addOn.price, city),
        }))
      // Required choices (e.g. balloon colour) the customer didn't pick
      const missingOptions = [...new Set((product.addOns || []).filter((addOn) => addOn.group).map((addOn) => addOn.group))]
        .filter((group) => !addOns.some((addOn) => addOn.group === group))
      const addOnsTotal = addOns.reduce((sum, addOn) => sum + addOn.unitAmount, 0)
      const unitAmount = productPriceValue(product, city) + addOnsTotal
      const available = isProductAvailable(product, city || 'Lagos')
      return {
        id: product.id,
        name: product.name,
        qty,
        addOns,
        missingOptions,
        unitAmount,
        subtotal: available ? unitAmount * qty : 0,
        available,
      }
    })
    .filter(Boolean)
}

export function summarizeOrder(items = [], deliveryFee = 0, city = '') {
  const normalizedDeliveryFee = Math.max(0, Number(deliveryFee || 0))
  const lineItems = getCartSnapshot(items, city)
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  const total = subtotal + normalizedDeliveryFee
  return {
    lineItems,
    hasUnavailable: lineItems.some((item) => !item.available),
    subtotal,
    deliveryFee: normalizedDeliveryFee,
    total,
    amountKobo: total * 100,
  }
}

export async function squadRequest(secretKey, path, options = {}) {
  const response = await fetch(`${getSquadBaseUrl(secretKey)}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))
  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}

export function verifyWebhookSignature(rawBody, signature, secretKey) {
  if (typeof secretKey !== 'string' || !secretKey ||
    (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) ||
    typeof signature !== 'string' || !/^[a-fA-F0-9]{128}$/.test(signature)) return false
  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest()
  const supplied = Buffer.from(signature, 'hex')
  return crypto.timingSafeEqual(expected, supplied)
}
