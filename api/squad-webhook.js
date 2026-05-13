import { getEnv, json, verifyWebhookSignature } from './_lib/squad.js'

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
    req.on('data', (chunk) => {
      rawBody += chunk
    })
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

    console.log('Squad webhook received', {
      event: event?.Event,
      reference: event?.TransactionRef || event?.Body?.transaction_ref,
      status: event?.Body?.transaction_status,
      type: event?.Body?.transaction_type,
    })

    return json(res, 200, { received: true })
  } catch (error) {
    return json(res, 500, { error: error.message || 'Webhook processing failed.' })
  }
}
