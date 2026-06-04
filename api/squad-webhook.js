import { getEnv, json, verifyWebhookSignature } from './_lib/squad.js'
import { getSupabase } from './_lib/supabase.js'
import { sendMail } from './_lib/mailer.js'

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

async function sendOrderEmail(event) {

  const body = event?.Body || {}
  const meta = body.meta_data || body.metadata || {}
  const customer = meta.customer || {}
  const delivery = meta.delivery || {}
  const order = meta.order || {}
  const ref = body.transaction_ref || event?.TransactionRef || '—'
  const amountKobo = body.amount || 0
  const amountNaira = (amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })

  const items = (order.items || [])
    .map((item) => `  • ${item.name} × ${item.qty} — ₦${Number(item.unitPrice || 0).toLocaleString()}`)
    .join('\n')

  const text = `
New paid order on Bloomfield Flowers!

Reference: ${ref}
Amount: ${amountNaira}
Payment channel: ${body.transaction_type || '—'}

CUSTOMER
Name: ${customer.fullName || '—'}
Email: ${customer.email || body.email || '—'}
Phone: ${customer.phone || '—'}

DELIVERY
City: ${delivery.city || '—'}
Area: ${delivery.area || '—'}
Address: ${delivery.address || '—'}
${delivery.notes ? `Notes: ${delivery.notes}` : ''}

ORDER
${items || '  (details not captured)'}
Subtotal: ₦${Number(order.subtotal || 0).toLocaleString()}
Delivery fee: ₦${Number(order.deliveryFee || 0).toLocaleString()}
Total: ₦${Number(order.total || 0).toLocaleString()}
`.trim()

  const html = `
<h2 style="color:#7a2e5a;font-family:serif">New paid order — Bloomfield Flowers</h2>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin-bottom:16px">
  <tr><td style="padding:3px 14px 3px 0;color:#888">Reference</td><td><strong>${ref}</strong></td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Amount</td><td><strong>${amountNaira}</strong></td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Channel</td><td>${body.transaction_type || '—'}</td></tr>
</table>
<h3 style="font-family:sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#888;margin:16px 0 6px">Customer</h3>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin-bottom:16px">
  <tr><td style="padding:3px 14px 3px 0;color:#888">Name</td><td>${esc(customer.fullName || '—')}</td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Email</td><td>${esc(customer.email || body.email || '—')}</td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Phone</td><td>${esc(customer.phone || '—')}</td></tr>
</table>
<h3 style="font-family:sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#888;margin:16px 0 6px">Delivery</h3>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin-bottom:16px">
  <tr><td style="padding:3px 14px 3px 0;color:#888">City</td><td>${esc(delivery.city || '—')}</td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Area</td><td>${esc(delivery.area || '—')}</td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Address</td><td>${esc(delivery.address || '—')}</td></tr>
  ${delivery.notes ? `<tr><td style="padding:3px 14px 3px 0;color:#888">Notes</td><td>${esc(delivery.notes)}</td></tr>` : ''}
</table>
<h3 style="font-family:sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#888;margin:16px 0 6px">Order</h3>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  ${(order.items || []).map((item) => `<tr><td style="padding:3px 14px 3px 0">${esc(item.name)} × ${Number(item.qty)}</td><td>₦${Number(item.unitPrice || 0).toLocaleString()}</td></tr>`).join('')}
  <tr><td colspan="2" style="padding-top:8px;border-top:1px solid #eee"></td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Subtotal</td><td>₦${Number(order.subtotal || 0).toLocaleString()}</td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Delivery</td><td>₦${Number(order.deliveryFee || 0).toLocaleString()}</td></tr>
  <tr><td style="padding:3px 14px 3px 0;font-weight:700">Total</td><td style="font-weight:700">₦${Number(order.total || 0).toLocaleString()}</td></tr>
</table>
`

  await sendMail({ to: 'houseofbloomfield@gmail.com', subject: `New order ${ref} — Bloomfield Flowers`, text, html })
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { error: 'Method not allowed' })
  }

  let rawBody = ''
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => { rawBody += chunk })
    req.on('end', resolve)
    req.on('error', reject)
  }).catch(() => null)

  try {
    const secretKey = getEnv('SQUAD_SECRET_KEY')
    const signature = req.headers['x-squad-encrypted-body']

    if (!verifyWebhookSignature(rawBody, signature, secretKey)) {
      return json(res, 401, { error: 'Invalid webhook signature' })
    }

    const event = rawBody ? JSON.parse(rawBody) : {}
    const status = event?.Body?.transaction_status

    console.log('Squad webhook received', {
      event: event?.Event,
      reference: event?.TransactionRef || event?.Body?.transaction_ref,
      status,
      type: event?.Body?.transaction_type,
    })

    if (status === 'Success') {
      sendOrderEmail(event).catch((err) => console.error('Order email failed:', err))

      const ref = event?.Body?.transaction_ref || event?.TransactionRef
      if (ref) {
        const supabase = getSupabase()
        if (supabase) {
          supabase.from('orders').update({ status: 'success' })
            .eq('transaction_ref', ref)
            .then(({ error }) => { if (error) console.error('Supabase update failed:', error.message) })
            .catch((err) => console.error('Supabase update error:', err))
        }
      }
    }

    return json(res, 200, { received: true })
  } catch (error) {
    return json(res, 500, { error: error.message || 'Webhook processing failed.' })
  }
}
