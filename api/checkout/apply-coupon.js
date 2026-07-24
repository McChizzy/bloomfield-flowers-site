import { json, readJson } from '../_lib/squad.js'
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
    return json(res, 400, { error: 'Invalid request' })
  }

  const { code, subtotal } = payload || {}
  if (!code || typeof subtotal !== 'number' || subtotal < 0) {
    return json(res, 400, { error: 'code and subtotal are required' })
  }

  const supabase = getSupabase()
  if (!supabase) return json(res, 503, { error: 'Discount service temporarily unavailable' })

  const { data, error } = await supabaseQuery(() =>
    supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('active', true)
      .single()
  )

  if (error || !data) {
    return json(res, 404, { valid: false, error: 'Invalid or expired discount code' })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return json(res, 400, { valid: false, error: 'This discount code has expired' })
  }

  if (data.max_uses !== null && data.uses >= data.max_uses) {
    return json(res, 400, { valid: false, error: 'This discount code has reached its usage limit' })
  }

  if (subtotal < (data.min_order || 0)) {
    return json(res, 400, {
      valid: false,
      error: `Minimum order of ₦${(data.min_order).toLocaleString('en-NG')} required for this code`,
    })
  }

  let discountAmount = 0
  if (data.type === 'percent') {
    discountAmount = Math.round(subtotal * data.value / 100)
  } else if (data.type === 'fixed') {
    discountAmount = Math.min(data.value, subtotal)
  }

  const freeDelivery = data.free_delivery_threshold !== null && subtotal >= data.free_delivery_threshold

  const parts = [`${data.value}${data.type === 'percent' ? '%' : '₦'} off applied`]
  if (freeDelivery) parts.push('free delivery included')

  return json(res, 200, {
    valid: true,
    code: data.code,
    discountAmount,
    freeDelivery,
    type: data.type,
    value: data.value,
    message: parts.join(' · '),
  })
}
