import { getEnv, json, squadRequest, verifyWebhookSignature } from './_lib/squad.js'
import { getSupabase, supabaseQuery } from './_lib/supabase.js'
import { sendMail } from './_lib/mailer.js'
import { products } from '../src/catalog.js'

const SITE_URL = 'https://bloomfieldflowers.ng'
const INSTAGRAM_URL = 'https://www.instagram.com/bloomfieldflowers_/'
const BRAND_PRIMARY = '#8f4c73'
const BRAND_PRIMARY_DARK = '#6e3556'
const BRAND_SURFACE_SOFT = '#f7efee'
const BRAND_TEXT = '#3d2f35'
const BRAND_MUTED = '#73616a'
const BRAND_LINE = '#eadcdf'

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function formatDeliveryDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDeliveryTime(timeStr) {
  if (!timeStr) return null
  const hour = Number(String(timeStr).split(':')[0])
  if (!Number.isFinite(hour)) return timeStr
  if (hour === 0) return '12:00 AM'
  if (hour < 12) return `${hour}:00 AM`
  if (hour === 12) return '12:00 PM'
  return `${hour - 12}:00 PM`
}

function itemLabel(item) {
  const addOns = Array.isArray(item.addOns) && item.addOns.length
    ? ` + ${item.addOns.map((addOn) => addOn.name).join(', ')}`
    : ''
  return `${item.name}${addOns}`
}

function extractOrderDetails(event, orderRow, verifyData) {
  const body = event?.Body || {}
  const verify = verifyData || {}
  // Squad webhook body rarely echoes metadata; verify endpoint is the reliable source
  const meta = body.meta_data || body.metadata || verify.meta_data || verify.metadata || {}
  const metaCustomer = meta.customer || {}
  const metaDelivery = meta.delivery || {}
  const metaOrder = meta.order || {}
  const ref = body.transaction_ref || event?.TransactionRef || '—'
  const amountKobo = body.amount || verify.amount || 0
  const amountNaira = (amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })

  const row = orderRow || {}

  // body.name / body.email / body.customer_mobile are Squad-guaranteed fields present
  // in every webhook — use them as the last-resort fallback when Supabase is paused
  // and metadata extraction fails.
  const customer = {
    fullName: row.customer_name || metaCustomer.fullName || verify.customer_name || body.name,
    email: row.customer_email || metaCustomer.email || verify.email || body.email,
    phone: row.customer_phone || metaCustomer.phone || body.customer_mobile,
  }

  const recipient = {
    name: row.recipient_name || metaCustomer.recipientName,
    phone: row.recipient_phone || metaCustomer.recipientPhone,
  }

  const delivery = {
    city: row.delivery_city || metaDelivery.city,
    area: row.delivery_area || metaDelivery.area,
    address: row.delivery_address || metaDelivery.address,
    notes: row.delivery_notes || metaDelivery.notes,
    date: row.delivery_date,
    time: row.delivery_time,
    cardMessage: row.card_message,
  }

  const order = {
    items: row.items || metaOrder.items || [],
    subtotal: row.subtotal ?? metaOrder.subtotal,
    deliveryFee: row.delivery_fee ?? metaOrder.deliveryFee,
    total: row.total ?? metaOrder.total,
  }

  const isPickup = delivery.area === 'pickup' || delivery.address === 'PICKUP'
  const hasRecipient = Boolean(recipient.name || recipient.phone)

  return { body, ref, amountNaira, customer, recipient, delivery, order, isPickup, hasRecipient }
}

async function sendOrderEmail(details) {
  const { ref, amountNaira, customer, recipient, delivery, order, isPickup, hasRecipient, body } = details

  const recipientLines = []
  if (recipient.name) recipientLines.push(`Name: ${recipient.name}`)
  if (recipient.phone) recipientLines.push(`Phone: ${recipient.phone}`)

  const recipientRows = []
  if (recipient.name) recipientRows.push(`<tr><td style="padding:3px 14px 3px 0;color:#888">Name</td><td>${esc(recipient.name)}</td></tr>`)
  if (recipient.phone) recipientRows.push(`<tr><td style="padding:3px 14px 3px 0;color:#888">Phone</td><td>${esc(recipient.phone)}</td></tr>`)

  const deliveryLines = [`City: ${delivery.city || '—'}`]
  if (isPickup) {
    deliveryLines.push('Method: Pickup at our studio')
  } else {
    deliveryLines.push(`Area: ${delivery.area || '—'}`)
    deliveryLines.push(`Address: ${delivery.address || '—'}`)
  }
  if (delivery.date) deliveryLines.push(`Date: ${delivery.date}`)
  if (delivery.time) deliveryLines.push(`Time: ${delivery.time}`)
  if (delivery.cardMessage) deliveryLines.push(`Card message: ${delivery.cardMessage}`)
  if (delivery.notes) deliveryLines.push(`Notes: ${delivery.notes}`)

  const deliveryRows = [`<tr><td style="padding:3px 14px 3px 0;color:#888">City</td><td>${esc(delivery.city || '—')}</td></tr>`]
  if (isPickup) {
    deliveryRows.push('<tr><td style="padding:3px 14px 3px 0;color:#888">Method</td><td>Pickup at our studio</td></tr>')
  } else {
    deliveryRows.push(`<tr><td style="padding:3px 14px 3px 0;color:#888">Area</td><td>${esc(delivery.area || '—')}</td></tr>`)
    deliveryRows.push(`<tr><td style="padding:3px 14px 3px 0;color:#888">Address</td><td>${esc(delivery.address || '—')}</td></tr>`)
  }
  if (delivery.date) deliveryRows.push(`<tr><td style="padding:3px 14px 3px 0;color:#888">Date</td><td>${esc(delivery.date)}</td></tr>`)
  if (delivery.time) deliveryRows.push(`<tr><td style="padding:3px 14px 3px 0;color:#888">Time</td><td>${esc(delivery.time)}</td></tr>`)
  if (delivery.cardMessage) deliveryRows.push(`<tr><td style="padding:3px 14px 3px 0;color:#888">Card message</td><td>${esc(delivery.cardMessage)}</td></tr>`)
  if (delivery.notes) deliveryRows.push(`<tr><td style="padding:3px 14px 3px 0;color:#888">Notes</td><td>${esc(delivery.notes)}</td></tr>`)

  const items = (order.items || [])
    .map((item) => `  • ${itemLabel(item)} × ${item.qty} — ₦${Number(item.subtotal || 0).toLocaleString()}`)
    .join('\n')

  const missingData = !customer.fullName || !delivery.address || !order.items?.length
  const squadDashboardUrl = 'https://dashboard.squadco.com/transactions'

  const text = `
New paid order on Bloomfield Flowers!

Reference: ${ref}
Amount: ${amountNaira}
Payment channel: ${body.transaction_type || '—'}

CUSTOMER
Name: ${customer.fullName || '—'}
Email: ${customer.email || body.email || '—'}
Phone: ${customer.phone || '—'}
${hasRecipient ? `\nRECIPIENT\n${recipientLines.join('\n')}\n` : ''}
DELIVERY
${deliveryLines.join('\n')}

ORDER
${items || '  (details not captured)'}
Subtotal: ₦${Number(order.subtotal || 0).toLocaleString()}
Delivery fee: ₦${Number(order.deliveryFee || 0).toLocaleString()}
Total: ₦${Number(order.total || 0).toLocaleString()}
${missingData ? `
---
⚠️  SOME FIELDS ARE MISSING. Squad raw data below — look up the transaction in your dashboard to get full details.
Squad dashboard: ${squadDashboardUrl}

RAW SQUAD FIELDS
Name: ${body.name || '—'}
Email: ${body.email || '—'}
Mobile: ${body.customer_mobile || '—'}
Channel: ${body.transaction_type || '—'}
Amount (kobo): ${body.amount || '—'}
` : ''}`.trim()

  const html = `
${missingData ? `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:12px 16px;margin-bottom:16px;font-family:sans-serif;font-size:13px">
  <strong>⚠️ Some order fields are missing</strong> — Supabase may have been paused when this order was placed.<br>
  Raw Squad fields below. <a href="${squadDashboardUrl}" style="color:#7a2e5a">Look up ref ${esc(ref)} in your Squad dashboard</a> for full details.<br>
  <em>Name: ${esc(body.name || '—')} &nbsp;|&nbsp; Email: ${esc(body.email || '—')} &nbsp;|&nbsp; Mobile: ${esc(body.customer_mobile || '—')}</em>
</div>` : ''}
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
${hasRecipient ? `<h3 style="font-family:sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#888;margin:16px 0 6px">Recipient</h3>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin-bottom:16px">
  ${recipientRows.join('\n  ')}
</table>` : ''}
<h3 style="font-family:sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#888;margin:16px 0 6px">Delivery</h3>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin-bottom:16px">
  ${deliveryRows.join('\n  ')}
</table>
<h3 style="font-family:sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#888;margin:16px 0 6px">Order</h3>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  ${(order.items || []).map((item) => `<tr><td style="padding:3px 14px 3px 0">${esc(itemLabel(item))} × ${Number(item.qty)}</td><td>₦${Number(item.subtotal || 0).toLocaleString()}</td></tr>`).join('')}
  <tr><td colspan="2" style="padding-top:8px;border-top:1px solid #eee"></td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Subtotal</td><td>₦${Number(order.subtotal || 0).toLocaleString()}</td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#888">Delivery</td><td>₦${Number(order.deliveryFee || 0).toLocaleString()}</td></tr>
  <tr><td style="padding:3px 14px 3px 0;font-weight:700">Total</td><td style="font-weight:700">₦${Number(order.total || 0).toLocaleString()}</td></tr>
</table>
`

  const subject = missingData
    ? `⚠️ New order ${ref} — INCOMPLETE DATA — Bloomfield Flowers`
    : `New order ${ref} — Bloomfield Flowers`
  await sendMail({ to: 'houseofbloomfield@gmail.com', subject, text, html })
}

async function sendCustomerOrderEmail(details) {
  const { ref, customer, recipient, delivery, order, isPickup, hasRecipient } = details

  if (!customer.email) return

  const firstName = String(customer.fullName || '').trim().split(/\s+/)[0] || 'there'
  const formattedDate = formatDeliveryDate(delivery.date)
  const formattedTime = formatDeliveryTime(delivery.time)

  const itemRows = (order.items || []).map((item) => {
    const product = products.find((p) => p.id === item.id)
    const imageUrl = product ? `${SITE_URL}${product.image}` : ''
    const imageCell = imageUrl
      ? `<img src="${imageUrl}" alt="${esc(item.name)}" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:10px;object-fit:cover">`
      : ''
    return `<tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BRAND_LINE}">
        <table role="presentation" width="100%" style="border-collapse:collapse">
          <tr>
            <td style="width:64px">${imageCell}</td>
            <td style="padding-left:14px;vertical-align:middle">
              <div style="font-weight:600;color:${BRAND_TEXT};font-size:14px">${esc(itemLabel(item))}</div>
              <div style="color:${BRAND_MUTED};font-size:13px;margin-top:2px">Qty: ${Number(item.qty)}</div>
            </td>
            <td style="text-align:right;vertical-align:middle;white-space:nowrap;font-weight:600;color:${BRAND_TEXT};font-size:14px">
              ₦${Number(item.subtotal || 0).toLocaleString()}
            </td>
          </tr>
        </table>
      </td>
    </tr>`
  }).join('')

  const itemLines = (order.items || [])
    .map((item) => `  • ${itemLabel(item)} × ${item.qty} — ₦${Number(item.subtotal || 0).toLocaleString()}`)
    .join('\n')

  const fulfilmentLines = []
  if (isPickup) {
    fulfilmentLines.push('Method: Pickup at our studio')
    fulfilmentLines.push(`City: ${delivery.city || '—'}`)
  } else {
    fulfilmentLines.push(`Address: ${delivery.address || '—'}`)
    fulfilmentLines.push(`Area: ${delivery.area || '—'}, ${delivery.city || '—'}`)
  }
  if (formattedDate) fulfilmentLines.push(`Date: ${formattedDate}`)
  if (formattedTime) fulfilmentLines.push(`Time: ${formattedTime}`)
  if (hasRecipient) {
    if (recipient.name) fulfilmentLines.push(`Recipient: ${recipient.name}`)
    if (recipient.phone) fulfilmentLines.push(`Recipient phone: ${recipient.phone}`)
  }
  if (delivery.cardMessage) fulfilmentLines.push(`Card message: "${delivery.cardMessage}"`)

  const fulfilmentRows = []
  if (isPickup) {
    fulfilmentRows.push(`<tr><td style="padding:4px 14px 4px 0;color:${BRAND_MUTED}">Method</td><td>Pickup at our studio</td></tr>`)
    fulfilmentRows.push(`<tr><td style="padding:4px 14px 4px 0;color:${BRAND_MUTED}">City</td><td>${esc(delivery.city || '—')}</td></tr>`)
  } else {
    fulfilmentRows.push(`<tr><td style="padding:4px 14px 4px 0;color:${BRAND_MUTED}">Address</td><td>${esc(delivery.address || '—')}</td></tr>`)
    fulfilmentRows.push(`<tr><td style="padding:4px 14px 4px 0;color:${BRAND_MUTED}">Area</td><td>${esc(delivery.area || '—')}, ${esc(delivery.city || '—')}</td></tr>`)
  }
  if (formattedDate) fulfilmentRows.push(`<tr><td style="padding:4px 14px 4px 0;color:${BRAND_MUTED}">Date</td><td>${esc(formattedDate)}</td></tr>`)
  if (formattedTime) fulfilmentRows.push(`<tr><td style="padding:4px 14px 4px 0;color:${BRAND_MUTED}">Time</td><td>${esc(formattedTime)}</td></tr>`)
  if (hasRecipient) {
    if (recipient.name) fulfilmentRows.push(`<tr><td style="padding:4px 14px 4px 0;color:${BRAND_MUTED}">Recipient</td><td>${esc(recipient.name)}</td></tr>`)
    if (recipient.phone) fulfilmentRows.push(`<tr><td style="padding:4px 14px 4px 0;color:${BRAND_MUTED}">Recipient phone</td><td>${esc(recipient.phone)}</td></tr>`)
  }
  if (delivery.cardMessage) fulfilmentRows.push(`<tr><td style="padding:4px 14px 4px 0;color:${BRAND_MUTED}">Card message</td><td>"${esc(delivery.cardMessage)}"</td></tr>`)

  const nextStepsText = isPickup
    ? `We're preparing your bouquet with care for pickup at our studio in ${delivery.city || 'our studio'}. We'll send a message to ${customer.phone || 'your phone'} as soon as it's ready for collection.`
    : `We're preparing your bouquet with care for delivery on ${formattedDate || 'your selected date'}${formattedTime ? ` around ${formattedTime}` : ''}. Our team will reach out to ${customer.phone || 'your phone'} to confirm details before we head out.`

  const text = `
Thank you for your order, ${firstName}!

Your payment has been confirmed and your order is now with our florists.

ORDER REFERENCE: ${ref}

YOUR ORDER
${itemLines || '  (details not captured)'}
Subtotal: ₦${Number(order.subtotal || 0).toLocaleString()}
Delivery fee: ₦${Number(order.deliveryFee || 0).toLocaleString()}
Total: ₦${Number(order.total || 0).toLocaleString()}

${isPickup ? 'PICKUP DETAILS' : 'DELIVERY DETAILS'}
${fulfilmentLines.join('\n')}

WHAT HAPPENS NEXT
${nextStepsText}

Questions about your order? Message us on Instagram: ${INSTAGRAM_URL}

— The Bloomfield Flowers Team
`.trim()

  const html = `
<div style="background:${BRAND_SURFACE_SOFT};padding:32px 16px;font-family:Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${BRAND_LINE}">
    <tr>
      <td style="background:${BRAND_PRIMARY};padding:28px 32px;text-align:center">
        <img src="${SITE_URL}/images/bff-logo.jpeg" alt="Bloomfield Flowers" width="56" height="56" style="display:block;margin:0 auto 10px;border-radius:50%;border:2px solid #ffffff">
        <div style="color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:.04em;font-weight:700">Bloomfield Flowers</div>
      </td>
    </tr>
    <tr>
      <td style="padding:32px">
        <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${BRAND_TEXT}">Thank you, ${esc(firstName)}!</h1>
        <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;line-height:1.6">
          Your payment has been confirmed and your order is now with our florists. Here's a summary of what we're preparing for you.
        </p>
        <table role="presentation" style="border-collapse:collapse;font-size:13px;color:${BRAND_MUTED};margin-bottom:24px">
          <tr><td style="padding:2px 14px 2px 0">Order reference</td><td style="font-weight:700;color:${BRAND_TEXT}">${esc(ref)}</td></tr>
        </table>

        <h2 style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${BRAND_PRIMARY_DARK};border-bottom:1px solid ${BRAND_LINE};padding-bottom:8px">Your order</h2>
        <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:8px">
          ${itemRows}
        </table>
        <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;margin-bottom:24px">
          <tr><td style="padding:3px 0;color:${BRAND_MUTED}">Subtotal</td><td style="text-align:right">₦${Number(order.subtotal || 0).toLocaleString()}</td></tr>
          <tr><td style="padding:3px 0;color:${BRAND_MUTED}">Delivery fee</td><td style="text-align:right">₦${Number(order.deliveryFee || 0).toLocaleString()}</td></tr>
          <tr><td style="padding:6px 0 0;font-weight:700;color:${BRAND_TEXT};border-top:1px solid ${BRAND_LINE}">Total</td><td style="text-align:right;padding-top:6px;font-weight:700;color:${BRAND_TEXT};border-top:1px solid ${BRAND_LINE}">₦${Number(order.total || 0).toLocaleString()}</td></tr>
        </table>

        <h2 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${BRAND_PRIMARY_DARK};border-bottom:1px solid ${BRAND_LINE};padding-bottom:8px">${isPickup ? 'Pickup details' : 'Delivery details'}</h2>
        <table role="presentation" style="border-collapse:collapse;font-size:14px;color:${BRAND_TEXT};margin-bottom:24px">
          ${fulfilmentRows.join('\n          ')}
        </table>

        <h2 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${BRAND_PRIMARY_DARK};border-bottom:1px solid ${BRAND_LINE};padding-bottom:8px">What happens next</h2>
        <p style="margin:0;color:${BRAND_TEXT};font-size:14px;line-height:1.6">${esc(nextStepsText)}</p>
      </td>
    </tr>
    <tr>
      <td style="background:${BRAND_SURFACE_SOFT};padding:20px 32px;text-align:center;font-size:12px;color:${BRAND_MUTED}">
        Questions about your order? Message us on Instagram <a href="${INSTAGRAM_URL}" style="color:${BRAND_PRIMARY_DARK};font-weight:600;text-decoration:none">@bloomfieldflowers_</a><br>
        Bloomfield Flowers · Abuja &amp; Lagos, Nigeria
      </td>
    </tr>
  </table>
</div>
`

  await sendMail({ to: customer.email, subject: `Your Bloomfield Flowers order is confirmed (${ref})`, text, html })
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
      rawBodySnippet: rawBody.slice(0, 800),
    })

    if (status === 'Success') {
      const ref = event?.Body?.transaction_ref || event?.TransactionRef
      let orderRow = null

      const supabase = getSupabase()
      if (supabase && ref) {
        const { data, error } = await supabaseQuery(() =>
          supabase.from('orders').update({ status: 'success' })
            .eq('transaction_ref', ref)
            .select()
            .maybeSingle()
        )
        if (error) console.error('Supabase update failed (may be paused/slow):', error.message)
        else orderRow = data
      } else if (!supabase) {
        console.warn('Supabase not configured — order details will rely on Squad verify endpoint only.')
      }

      // Squad webhook body doesn't include full metadata; call verify to get it
      let verifyData = null
      if (ref) {
        try {
          const verify = await squadRequest(secretKey, `/transaction/verify/${encodeURIComponent(ref)}`, { method: 'GET' })
          if (verify.ok) {
            verifyData = verify.data?.data || null
            console.log('Squad verify data:', JSON.stringify(verifyData).slice(0, 800))
          } else {
            console.warn('Squad verify returned non-OK status:', verify.status)
          }
        } catch (err) {
          console.error('Squad verify call failed in webhook:', err.message)
        }
      }

      const details = extractOrderDetails(event, orderRow, verifyData)

      try {
        await sendOrderEmail(details)
      } catch (err) {
        console.error('Order email failed:', err.message)
      }

      try {
        await sendCustomerOrderEmail(details)
      } catch (err) {
        console.error('Customer order email failed:', err.message)
      }
    }

    return json(res, 200, { received: true })
  } catch (error) {
    return json(res, 500, { error: error.message || 'Webhook processing failed.' })
  }
}
