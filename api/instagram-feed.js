import { json } from './_lib/squad.js'
import { getSupabase, supabaseQuery } from './_lib/supabase.js'

const GRAPH = 'https://graph.facebook.com/v20.0'
let memCache = { data: null, at: 0 }
const CACHE_TTL = 5 * 60 * 1000

async function gget(path, token) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${GRAPH}${path}${sep}access_token=${token}`)
  return res.json()
}

async function bootstrap(supabase) {
  const shortToken = process.env.INSTAGRAM_TOKEN
  const appId = process.env.INSTAGRAM_APP_ID
  const appSecret = process.env.INSTAGRAM_APP_SECRET
  console.log('[ig:1] env — TOKEN:', !!shortToken, 'APP_ID:', appId || 'MISSING', 'APP_SECRET:', !!appSecret)
  if (!shortToken || !appId || !appSecret) { console.error('[ig] missing env vars — aborting'); return null }

  // Exchange short-lived → long-lived user token (60 days)
  console.log('[ig:2] exchanging token...')
  const lt = await gget(
    `/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`,
    shortToken
  )
  console.log('[ig:3] exchange result:', JSON.stringify(lt).substring(0, 300))
  const longToken = lt.access_token
  if (!longToken) { console.error('[ig] token exchange failed — token may be expired'); return null }

  // Get linked Facebook Pages
  console.log('[ig:4] fetching pages...')
  const pages = await gget('/me/accounts', longToken)
  console.log('[ig:5] pages result:', JSON.stringify(pages).substring(0, 300))
  if (!pages.data?.length) { console.error('[ig] no Facebook Pages found'); return null }

  const page = pages.data[0]
  const pageToken = page.access_token
  const pageId = page.id
  console.log('[ig:6] page found:', pageId, page.name)

  // Get Instagram Business Account linked to this page
  console.log('[ig:7] fetching Instagram account...')
  const igData = await gget(`/${pageId}?fields=instagram_business_account`, pageToken)
  console.log('[ig:8] IG account result:', JSON.stringify(igData).substring(0, 300))
  const igUserId = igData.instagram_business_account?.id
  if (!igUserId) {
    console.error('[ig] no Instagram Business Account linked to this Page — ensure Instagram is set to Business/Creator in app settings and linked to the Facebook Page')
    return null
  }
  console.log('[ig:9] IG user ID:', igUserId)

  // Persist credentials so future calls skip this flow
  await Promise.all([
    supabaseQuery(() => supabase.from('settings').upsert({ key: 'instagram_page_token', value: pageToken })),
    supabaseQuery(() => supabase.from('settings').upsert({ key: 'instagram_ig_user_id', value: igUserId })),
  ])

  console.log('[ig:10] bootstrap complete — credentials stored in Supabase')
  return { pageToken, igUserId }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  // Serve memory cache while fresh
  if (memCache.data && Date.now() - memCache.at < CACHE_TTL) {
    return json(res, 200, memCache.data)
  }

  const supabase = getSupabase()
  if (!supabase) return json(res, 503, { error: 'Service unavailable' })

  try {
    const [{ data: tokenRow }, { data: igRow }] = await Promise.all([
      supabaseQuery(() => supabase.from('settings').select('value').eq('key', 'instagram_page_token').single()),
      supabaseQuery(() => supabase.from('settings').select('value').eq('key', 'instagram_ig_user_id').single()),
    ])

    let pageToken = tokenRow?.value
    let igUserId = igRow?.value

    // First-run: exchange token and discover account
    if (!pageToken || !igUserId) {
      const boot = await bootstrap(supabase)
      if (!boot) return json(res, 503, { error: 'Instagram not configured. Check INSTAGRAM_TOKEN, INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET env vars.' })
      pageToken = boot.pageToken
      igUserId = boot.igUserId
    }

    const media = await gget(
      `/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=9`,
      pageToken
    )

    if (media.error) {
      console.error('Instagram API error:', JSON.stringify(media.error))
      // Serve stale cache rather than showing an error to visitors
      if (memCache.data) return json(res, 200, memCache.data)
      return json(res, 502, { error: 'Instagram temporarily unavailable' })
    }

    const posts = media.data || []
    memCache = { data: { posts }, at: Date.now() }
    return json(res, 200, { posts })
  } catch (err) {
    console.error('Instagram feed error:', err.message)
    if (memCache.data) return json(res, 200, memCache.data)
    return json(res, 500, { error: 'Failed to load Instagram feed' })
  }
}
