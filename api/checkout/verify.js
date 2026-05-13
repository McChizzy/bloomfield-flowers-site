import { getEnv, json, squadRequest } from '../_lib/squad.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { error: 'Method not allowed' })
  }

  const transactionRef = req.query?.transaction_ref || req.query?.reference
  if (!transactionRef) {
    return json(res, 400, { error: 'transaction_ref is required' })
  }

  try {
    const secretKey = getEnv('SQUAD_SECRET_KEY')
    const squad = await squadRequest(secretKey, `/transaction/verify/${encodeURIComponent(transactionRef)}`, {
      method: 'GET',
    })

    if (!squad.ok) {
      return json(res, squad.status || 502, {
        error: squad.data?.message || 'Unable to verify transaction.',
        details: squad.data?.data || null,
      })
    }

    return json(res, 200, squad.data?.data || {})
  } catch (error) {
    return json(res, 500, { error: error.message || 'Transaction verification failed.' })
  }
}
