import { buildSiteUrl, generateTransactionRef, getEnv, json, readJson, squadRequest, summarizeOrder } from '../_lib/squad.js'
import { lookupDeliveryFee } from '../../src/delivery-zones.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { error: 'Method not allowed' })
  }

  let payload
  try {
    payload = await readJson(req)
  } catch {
    return json(res, 400, { error: 'Invalid JSON payload' })
  }

  const { customer = {}, delivery = {}, items = [] } = payload || {}

  // Validate field lengths to prevent oversized payloads
  const fields = { fullName: customer.fullName, email: customer.email, phone: customer.phone, address: delivery.address, area: delivery.area, cardMessage: delivery.cardMessage, deliveryNotes: delivery.deliveryNotes }
  for (const [key, val] of Object.entries(fields)) {
    if (val && String(val).length > 500) return json(res, 400, { error: `Field '${key}' is too long.` })
  }

  const { fee: zoneDeliveryFee } = lookupDeliveryFee(delivery.city, delivery.area)
  const order = summarizeOrder(items, zoneDeliveryFee ?? 0, delivery.city)

  if (!customer.email || !customer.fullName || !customer.phone) {
    return json(res, 400, { error: 'Name, email, and phone are required.' })
  }

  if (!delivery.city || !delivery.address || !delivery.area) {
    return json(res, 400, { error: 'Delivery city, area, and address are required.' })
  }

  if (!order.lineItems.length || order.total <= 0) {
    return json(res, 400, { error: 'Your cart is empty.' })
  }

  try {
    const secretKey = getEnv('SQUAD_SECRET_KEY')
    const callbackBase = process.env.SQUAD_REDIRECT_URL || `${buildSiteUrl(req)}/checkout-complete`
    const transactionRef = generateTransactionRef()

    const squadPayload = {
      amount: order.amountKobo,
      email: customer.email,
      currency: 'NGN',
      initiate_type: 'inline',
      transaction_ref: transactionRef,
      callback_url: callbackBase,
      customer_name: customer.fullName,
      payment_channels: ['card', 'bank', 'ussd', 'transfer'],
      metadata: {
        brand: 'Bloomfield Flowers',
        customer,
        delivery,
        order: {
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          items: order.lineItems,
        },
      },
    }

    const squad = await squadRequest(secretKey, '/transaction/initiate', {
      method: 'POST',
      body: JSON.stringify(squadPayload),
    })

    if (!squad.ok) {
      return json(res, 502, {
        error: squad.data?.message || 'Unable to initiate Squad checkout.',
        details: squad.data?.data || null,
      })
    }

    return json(res, 200, {
      checkoutUrl: squad.data?.data?.checkout_url,
      transactionRef: squad.data?.data?.transaction_ref || transactionRef,
      amount: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
    })
  } catch (error) {
    return json(res, 500, { error: error.message || 'Checkout initialization failed.' })
  }
}
