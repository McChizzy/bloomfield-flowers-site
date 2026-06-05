import { getSupabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  // Simple protection — require a secret param to avoid public exposure
  if (req.query?.key !== process.env.SQUAD_SECRET_KEY?.slice(-8)) {
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Forbidden' }))
    return
  }

  const envCheck = {
    SQUAD_SECRET_KEY: !!process.env.SQUAD_SECRET_KEY,
    SQUAD_REDIRECT_URL: !!process.env.SQUAD_REDIRECT_URL,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GMAIL_USER: !!process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
  }

  let supabaseTest = 'not attempted'
  try {
    const supabase = getSupabase()
    if (!supabase) {
      supabaseTest = 'FAILED — client is null (URL or SERVICE_ROLE_KEY missing/wrong name)'
    } else {
      const { error } = await supabase.from('orders').select('id').limit(1)
      supabaseTest = error ? `FAILED — ${error.message}` : 'OK — connected and orders table readable'
    }
  } catch (err) {
    supabaseTest = `ERROR — ${err.message}`
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ envVars: envCheck, supabaseTest }, null, 2))
}
