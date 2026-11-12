import { getEnv, json, squadRequest } from '../_lib/squad.js'
import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { error: 'Method not allowed' })
  }

  const transactionRef = req.query?.transaction_ref || req.query?.reference
  if (typeof transactionRef !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(transactionRef)) {
    return json(res, 400, { error: 'transaction_ref is required' })
  }

  try {
    const secretKey = getEnv('SQUAD_SECRET_KEY')
    const squad = await squadRequest(secretKey, `/transaction/verify/${encodeURIComponent(transactionRef)}`, {
      method: 'GET',
    })
    const reportedStatus = squad.data?.data?.transaction_status
    const txStatus = typeof reportedStatus === 'string' ? reportedStatus.toLowerCase() : ''
    const knownStatus = ['success', 'failed', 'fail', 'abandoned', 'pending'].includes(txStatus)

    console.log('Squad verify result', {
      ref: transactionRef,
      ok: squad.ok,
      status: squad.status,
      transaction_status: knownStatus ? txStatus : 'unknown',
    })

    if (!squad.ok) {
      return json(res, squad.status >= 400 && squad.status <= 599 ? squad.status : 502, {
        error: 'Unable to verify transaction.',
      })
    }

    const data = squad.data?.data
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
      (data.transaction_ref && data.transaction_ref !== transactionRef)) {
      return json(res, 502, { error: 'Unable to verify transaction.' })
    }
    if (txStatus === 'success') {
      const supabase = getSupabase()
      if (supabase) {
        try {
          const { error } = await supabase.from('orders').update({ status: 'success' })
            .eq('transaction_ref', transactionRef)
          if (error) console.error('Supabase verify update failed')
        } catch {
          console.error('Supabase verify update failed')
        }
      }
    }

    return json(res, 200, {
      transaction_ref: transactionRef,
      transaction_status: knownStatus ? reportedStatus : null,
    })
  } catch {
    console.error('Transaction verification failed')
    return json(res, 500, { error: 'Transaction verification failed.' })
  }
}
