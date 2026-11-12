import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { MAX_JSON_BODY_BYTES, readJson } from '../api/_lib/squad.js'

function streamed(chunks, headers = {}) {
  const request = new PassThrough()
  request.headers = headers
  const result = readJson(request)
  for (const chunk of chunks) request.write(chunk)
  request.end()
  return result
}

test('empty and ordinary chunked JSON bodies retain their existing contract', async () => {
  assert.deepEqual(await streamed([]), {})
  assert.deepEqual(await streamed(['{"name":', '"Bloomfield"}']), { name: 'Bloomfield' })
})

test('UTF-8 characters survive byte boundaries between chunks', async () => {
  const bytes = Buffer.from('{"message":"Flowers 🌷 for Chiké"}')
  assert.deepEqual(await streamed([...bytes].map(byte => Buffer.from([byte]))), { message: 'Flowers 🌷 for Chiké' })
})

for (const body of ['{"name":"Bloomfield"}', Buffer.from('{"name":"Bloomfield"}'), { name: 'Bloomfield' }]) {
  test('platform-parsed ' + (Buffer.isBuffer(body) ? 'buffer' : typeof body) + ' bodies are supported', async () => {
    assert.deepEqual(await readJson({ body }), { name: 'Bloomfield' })
  })
}

test('a JSON body at the exact byte limit is accepted', async () => {
  const body = '"' + 'x'.repeat(MAX_JSON_BODY_BYTES - 2) + '"'
  assert.equal((await streamed([body])).length, MAX_JSON_BODY_BYTES - 2)
})

for (const headers of [{}, { 'content-length': '1' }]) {
  test('oversized stream is rejected even with missing or misleading content length ' + JSON.stringify(headers), async () => {
    await assert.rejects(streamed(['"', 'x'.repeat(MAX_JSON_BODY_BYTES), '"'], headers), { statusCode: 413 })
  })
}

test('oversized declared content length is rejected before consuming the stream', async () => {
  await assert.rejects(readJson({ headers: { 'content-length': String(MAX_JSON_BODY_BYTES + 1) } }), { statusCode: 413 })
})

for (const body of ['x'.repeat(MAX_JSON_BODY_BYTES + 1), Buffer.alloc(MAX_JSON_BODY_BYTES + 1), { name: 'x'.repeat(MAX_JSON_BODY_BYTES) }]) {
  test('oversized platform body ' + (Buffer.isBuffer(body) ? 'buffer' : typeof body) + ' is rejected', async () => {
    await assert.rejects(readJson({ body }), { statusCode: 413 })
  })
}

test('the cap counts bytes rather than Unicode characters', async () => {
  await assert.rejects(streamed([JSON.stringify({ message: '🌷'.repeat(MAX_JSON_BODY_BYTES / 4) })]), { statusCode: 413 })
})

for (const contentLength of ['abc', '-1', '1.5', ['10', '20']]) {
  test('malformed content length ' + JSON.stringify(contentLength) + ' is rejected', async () => {
    await assert.rejects(readJson({ headers: { 'content-length': contentLength } }), /Invalid content length/)
  })
}

test('malformed JSON rejects cleanly', async () => {
  await assert.rejects(streamed(['{"missing":']), SyntaxError)
})

test('aborted requests reject instead of waiting forever', async () => {
  const request = new PassThrough()
  const result = readJson(request)
  request.emit('aborted')
  await assert.rejects(result, /Request aborted/)
  request.end()
})

test('request stream errors reject cleanly', async () => {
  const request = new PassThrough()
  const result = readJson(request)
  request.destroy(new Error('synthetic stream failure'))
  await assert.rejects(result, /synthetic stream failure/)
})
