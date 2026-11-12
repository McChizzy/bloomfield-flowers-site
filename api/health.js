import { getSupabase, supabaseQuery } from './_lib/supabase.js'
import { authorizeGet } from './_lib/access.js'

export default async function handler(req, res) {
  if (!authorizeGet(req, res, 'HEALTHCHECK_SECRET')) return

  let ok = false
  try {
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabaseQuery(() =>
        supabase.from('orders').select('id').limit(1)
      )
      ok = !error
    }
  } catch {
    ok = false
  }

  res.statusCode = ok ? 200 : 503
  res.end(JSON.stringify({ ok, message: ok ? 'Supabase ping OK' : 'Database unavailable' }))
}
