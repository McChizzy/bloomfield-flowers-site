import { readJson, json } from './_lib/squad.js'
import { sendMail } from './_lib/mailer.js'

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { error: 'Method not allowed' })
  }

  let body
  try {
    body = await readJson(req)
  } catch {
    return json(res, 400, { error: 'Invalid request body' })
  }

  const { formType, name, email, message, instagram, phone, occasion, colors, budget } = body || {}

  if (!name?.trim() || !message?.trim()) {
    return json(res, 400, { error: 'Name and message are required.' })
  }

  if (
    name.length > 200 || message.length > 4000 ||
    (email && email.length > 200) || (instagram && instagram.length > 100) ||
    (phone && phone.length > 30) || (occasion && occasion.length > 200) ||
    (colors && colors.length > 200) || (budget && budget.length > 100)
  ) {
    return json(res, 400, { error: 'One or more fields exceed the maximum allowed length.' })
  }

  const igHandle = instagram?.trim() ? `@${instagram.trim().replace(/^@/, '')}` : 'Not provided'

  const isCustomOrder = formType === 'custom-order'
  const subject = isCustomOrder
    ? `Custom Order Request — ${name.trim()}`
    : `Contact Form — ${name.trim()}`

  const extraFields = isCustomOrder
    ? `Occasion: ${occasion || '—'}
Preferred Colors: ${colors || '—'}
Budget: ${budget || '—'}
Phone: ${phone || '—'}`
    : ''

  const text = `
New ${isCustomOrder ? 'custom order request' : 'contact message'} from the Bloomfield Flowers website.

Name: ${name.trim()}
Email: ${email?.trim() || 'Not provided'}
Instagram: ${igHandle}
${extraFields}

Message:
${message.trim()}
`.trim()

  const html = `
<p><strong>New ${isCustomOrder ? 'custom order request' : 'contact message'}</strong> from the Bloomfield Flowers website.</p>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td style="padding:4px 12px 4px 0;color:#888">Name</td><td>${esc(name.trim())}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Email</td><td>${esc(email?.trim() || '—')}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Instagram</td><td>${esc(igHandle)}</td></tr>
  ${isCustomOrder ? `
  <tr><td style="padding:4px 12px 4px 0;color:#888">Phone</td><td>${esc(phone || '—')}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Occasion</td><td>${esc(occasion || '—')}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Colors</td><td>${esc(colors || '—')}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Budget</td><td>${esc(budget || '—')}</td></tr>
  ` : ''}
</table>
<p style="margin-top:16px"><strong>Message:</strong></p>
<p style="background:#f9f0f4;padding:12px 16px;border-radius:8px;white-space:pre-wrap">${esc(message.trim())}</p>
`

  try {
    await sendMail({ to: 'ikechex@gmail.com', subject, text, html })
    return json(res, 200, { ok: true })
  } catch (err) {
    console.error('Mail error:', err)
    return json(res, 500, { error: 'Failed to send message. Please try again or contact us directly on Instagram.' })
  }
}
