import { getSupabase, supabaseQuery } from './_lib/supabase.js'

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
  const supabase = getSupabase()
  if (!supabase) {
    supabaseTest = 'FAILED — client is null (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set)'
  } else {
    const { error } = await supabaseQuery(() =>
      supabase.from('orders').select('id').limit(1)
    )
    supabaseTest = error
      ? `FAILED — ${error.message}` + (error.message === 'Supabase timeout' ? ' (project may be paused — visit supabase.com to unpause)' : '')
      : 'OK — connected and orders table readable'
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ envVars: envCheck, supabaseTest }, null, 2))
}
