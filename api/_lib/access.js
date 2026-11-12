import { createHash, timingSafeEqual } from 'node:crypto'

export function authorizeGet(req, res, secretName) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return false
  }

  const expected = process.env[secretName]
  const headers = Object.entries(req.headers || {}).filter(([name]) =>
    name.toLowerCase() === 'authorization'
  )
  const rawCount = (req.rawHeaders || []).filter((value, index) =>
    index % 2 === 0 && typeof value === 'string' && value.toLowerCase() === 'authorization'
  ).length
  const authorization = headers.length === 1 ? headers[0][1] : undefined
  const match = typeof authorization === 'string'
    ? /^Bearer ([A-Za-z0-9._~+/-]+=*)$/i.exec(authorization)
    : null

  if (!expected || rawCount > 1 || !match || !timingSafeEqual(
    createHash('sha256').update(match[1]).digest(),
    createHash('sha256').update(expected).digest()
  )) {
    res.statusCode = 403
    res.end(JSON.stringify({ error: 'Forbidden' }))
    return false
  }

  return true
}
