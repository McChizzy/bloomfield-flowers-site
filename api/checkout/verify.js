import { getEnv, json, squadRequest } from '../_lib/squad.js'
import { getSupabase } from '../_lib/supabase.js'
import { sendMail } from '../_lib/mailer.js'

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

    console.log('Squad verify result', {
      ref: transactionRef,
      ok: squad.ok,
      status: squad.status,
      transaction_status: squad.data?.data?.transaction_status,
      raw: JSON.stringify(squad.data).slice(0, 500),
    })

    if (!squad.ok) {
      return json(res, squad.status || 502, {
        error: squad.data?.message || 'Unable to verify transaction.',
        details: squad.data?.data || null,
      })
    }

    const data = squad.data?.data || {}
    const txStatus = String(data.transaction_status || '').toLowerCase()

    if (txStatus === 'success') {
      const supabase = getSupabase()
      if (supabase) {
        try {
          const { error } = await supabase.from('orders').update({ status: 'success' })
            .eq('transaction_ref', transactionRef)
          if (error) console.error('Supabase verify update failed:', error.message)
        } catch (err) {
          console.error('Supabase verify update error:', err.message)
        }
      }

      const amountNaira = data.amount
        ? (data.amount / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
        : '—'
      const subject = `Payment confirmed — ${transactionRef}`
      const text = `Payment confirmed for order ${transactionRef}.\n\nAmount: ${amountNaira}\nEmail: ${data.email || '—'}\nChannel: ${data.transaction_type || '—'}\n\nCheck the orders table in Supabase for full delivery details.`
      try {
        await sendMail({ to: 'houseofbloomfield@gmail.com', subject, text, html: `<p>${text.replace(/\n/g, '<br>')}</p>` })
      } catch (err) {
        console.error('Verify confirmation email failed:', err.message)
      }
    }

    return json(res, 200, data)
  } catch (error) {
    return json(res, 500, { error: error.message || 'Transaction verification failed.' })
  }
}
