import { readJson, json } from './_lib/squad.js'

const AGENTMAIL_INBOX = 'odinson@agentmail.to'
const AGENTMAIL_API = 'https://api.agentmail.to/v0'

async function sendEmail({ to, subject, text, html }) {
  const key = process.env.AGENTMAIL_API_KEY
  if (!key) throw new Error('Missing AGENTMAIL_API_KEY')

  const res = await fetch(`${AGENTMAIL_API}/inboxes/${AGENTMAIL_INBOX}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to: [to], subject, text, html }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `AgentMail error ${res.status}`)
  }
  return res.json()
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
  <tr><td style="padding:4px 12px 4px 0;color:#888">Name</td><td>${name.trim()}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Email</td><td>${email?.trim() || '—'}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Instagram</td><td>${igHandle}</td></tr>
  ${isCustomOrder ? `
  <tr><td style="padding:4px 12px 4px 0;color:#888">Phone</td><td>${phone || '—'}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Occasion</td><td>${occasion || '—'}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Colors</td><td>${colors || '—'}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Budget</td><td>${budget || '—'}</td></tr>
  ` : ''}
</table>
<p style="margin-top:16px"><strong>Message:</strong></p>
<p style="background:#f9f0f4;padding:12px 16px;border-radius:8px;white-space:pre-wrap">${message.trim()}</p>
`

  try {
    await sendEmail({ to: 'ikechex@gmail.com', subject, text, html })
    return json(res, 200, { ok: true })
  } catch (err) {
    console.error('AgentMail error:', err)
    return json(res, 500, { error: 'Failed to send message. Please try again or contact us directly on Instagram.' })
  }
}
