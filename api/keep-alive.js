import { getSupabase, supabaseQuery } from './_lib/supabase.js'

// Called by Vercel cron (Mon + Thu 9am UTC) to prevent Supabase free-tier pausing.
export default async function handler(req, res) {
  const supabase = getSupabase()
  let ok = false
  let message = 'Supabase not configured'

  if (supabase) {
    const { error } = await supabaseQuery(() =>
      supabase.from('orders').select('id').limit(1)
    )
    ok = !error
    message = error
      ? `Supabase error: ${error.message}`
      : 'Supabase ping OK'
  }

  console.log('[keep-alive]', message)
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ ok, message, ts: new Date().toISOString() }))
}
