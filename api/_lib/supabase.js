import { createClient } from '@supabase/supabase-js'

let _client = null

export function getSupabase() {
  if (_client) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // No persistent session needed in serverless; global fetch keeps connections lean
  _client = createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(6000) }) },
  })
  return _client
}

// Wrapper that races a Supabase query against a hard 6-second timeout.
// Returns { data, error } — on timeout, error.message is 'Supabase timeout'.
export async function supabaseQuery(fn) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Supabase timeout')), 6000)
  )
  try {
    return await Promise.race([fn(), timeout])
  } catch (err) {
    return { data: null, error: err }
  }
}
