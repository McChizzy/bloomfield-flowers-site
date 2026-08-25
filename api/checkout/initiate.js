import { buildSiteUrl, generateTransactionRef, getEnv, json, readJson, squadRequest, summarizeOrder } from '../_lib/squad.js'
import { lookupDeliveryFee } from '../../src/delivery-zones.js'
import { getSupabase, supabaseQuery } from '../_lib/supabase.js'

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

  const { customer = {}, delivery = {}, items = [], discountCode } = payload || {}

  // Validate field lengths to prevent oversized payloads
  const fields = { fullName: customer.fullName, email: customer.email, phone: customer.phone, address: delivery.address, area: delivery.area, cardMessage: delivery.cardMessage, deliveryNotes: delivery.deliveryNotes }
  for (const [key, val] of Object.entries(fields)) {
    if (val && String(val).length > 500) return json(res, 400, { error: `Field '${key}' is too long.` })
  }

  const isPickup = delivery.method === 'pickup'
  const { fee: zoneDeliveryFee } = isPickup ? { fee: 0 } : lookupDeliveryFee(delivery.city, delivery.area)
  const order = summarizeOrder(items, zoneDeliveryFee ?? 0, delivery.city)

  if (!customer.email || !customer.fullName || !customer.phone) {
    return json(res, 400, { error: 'Name, email, and phone are required.' })
  }

  if (!delivery.city) {
    return json(res, 400, { error: 'Please select your city.' })
  }

  if (!isPickup && (!delivery.address || !delivery.area)) {
    return json(res, 400, { error: 'Delivery address and area are required.' })
  }

  if (!isPickup && zoneDeliveryFee === null) {
    return json(res, 400, { error: 'Delivery fee for this area needs to be confirmed before payment.' })
  }

  if (!order.lineItems.length || order.total <= 0) {
    return json(res, 400, { error: 'Your cart is empty.' })
  }

  let discountAmount = 0
  let freeDelivery = false
  let validatedCode = null

  if (discountCode) {
    const supabase = getSupabase()
    if (!supabase) return json(res, 503, { error: 'Discount service temporarily unavailable.' })

    const { data: codeRow, error } = await supabaseQuery(() =>
      supabase
        .from('discount_codes')
        .select('*')
        .eq('code', String(discountCode).toUpperCase().trim())
        .eq('active', true)
        .single()
    )

    if (
      error ||
      !codeRow ||
      (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) ||
      (codeRow.max_uses !== null && codeRow.uses >= codeRow.max_uses) ||
      order.subtotal < (codeRow.min_order || 0)
    ) {
      return json(res, 400, { error: 'Discount code could not be applied.' })
    }

    validatedCode = codeRow.code
    if (codeRow.type === 'percent') discountAmount = Math.round(order.subtotal * codeRow.value / 100)
    else if (codeRow.type === 'fixed') discountAmount = Math.min(codeRow.value, order.subtotal)
    freeDelivery = codeRow.free_delivery_threshold !== null && order.subtotal >= codeRow.free_delivery_threshold
  }

  const effectiveDeliveryFee = freeDelivery ? 0 : order.deliveryFee
  const effectiveTotal = Math.max(0, order.subtotal - discountAmount + effectiveDeliveryFee)

  try {
    const secretKey = getEnv('SQUAD_SECRET_KEY')
    const callbackBase = process.env.SQUAD_REDIRECT_URL || `${buildSiteUrl(req)}/checkout-complete`
    const transactionRef = generateTransactionRef()

    const squadPayload = {
      amount: effectiveTotal * 100,
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
          deliveryFee: effectiveDeliveryFee,
          discountCode: validatedCode,
          discountAmount,
          total: effectiveTotal,
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

    const confirmedRef = squad.data?.data?.transaction_ref || transactionRef

    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabaseQuery(() =>
        supabase.from('orders').upsert({
          transaction_ref: confirmedRef,
          status: 'initiated',
          customer_name: customer.fullName,
          customer_email: customer.email,
          customer_phone: customer.phone,
          recipient_name: customer.recipientName || null,
          recipient_phone: customer.recipientPhone || null,
          delivery_city: delivery.city,
          delivery_area: isPickup ? 'pickup' : delivery.area,
          delivery_address: isPickup ? 'PICKUP' : delivery.address,
          delivery_date: delivery.deliveryDate || null,
          delivery_time: delivery.deliveryTime || null,
          card_message: delivery.cardMessage || null,
          delivery_notes: delivery.deliveryNotes || null,
          subtotal: order.subtotal,
          delivery_fee: effectiveDeliveryFee,
          discount_code: validatedCode,
          discount_amount: discountAmount,
          total: effectiveTotal,
          items: order.lineItems,
        }, { onConflict: 'transaction_ref' })
      )
      if (error) console.error('Supabase insert failed:', error.message)
    } else {
      console.warn('Supabase not configured — order not persisted to database.')
    }

    return json(res, 200, {
      checkoutUrl: squad.data?.data?.checkout_url,
      transactionRef: confirmedRef,
      amount: effectiveTotal,
      subtotal: order.subtotal,
      deliveryFee: effectiveDeliveryFee,
      discountCode: validatedCode,
      discountAmount,
    })
  } catch (error) {
    return json(res, 500, { error: error.message || 'Checkout initialization failed.' })
  }
}
