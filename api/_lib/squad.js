import crypto from 'node:crypto'
import { products, parsePriceValue, productPriceValue, isProductAvailable } from '../../src/catalog.js'

const TEST_BASE_URL = 'https://sandbox-api-d.squadco.com'
const LIVE_BASE_URL = 'https://api-d.squadco.com'

export function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
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
          unitAmount: parsePriceValue(addOn.price, city),
        }))
      const addOnsTotal = addOns.reduce((sum, addOn) => sum + addOn.unitAmount, 0)
      const unitAmount = productPriceValue(product, city) + addOnsTotal
      const available = isProductAvailable(product, city || 'Lagos')
      return {
        id: product.id,
        name: product.name,
        qty,
        addOns,
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
  const digest = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex').toUpperCase()
  return digest === String(signature || '').toUpperCase()
}
