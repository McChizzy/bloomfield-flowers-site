import nodemailer from 'nodemailer'

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter
  const user = process.env.GMAIL_USER || 'houseofbloomfield@gmail.com'
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!pass) return null
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
  return _transporter
}

export async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter()
  if (!transporter) {
    throw new Error('Email is not configured. Please contact us on Instagram or WhatsApp.')
  }
  await transporter.sendMail({
    from: `"Bloomfield Flowers" <${process.env.GMAIL_USER || 'houseofbloomfield@gmail.com'}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text,
    html,
  })
}
