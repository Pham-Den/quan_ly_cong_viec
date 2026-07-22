import http from 'node:http'

// Sprint: v1 | Feature: NFR-004 | Task Group: 03C CODE-10 harness
// Contract: API-024 key-provider failure, CODE-10 | Pack: v1.7.21-oidc-session-error-contracts

let mode = 'up'
const keyBase64 = Buffer.alloc(32, 7).toString('base64')

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://key-provider-fake')
  if (url.pathname === '/health') return json(response, 200, { ok: true })
  if (url.pathname === '/control') {
    mode = url.searchParams.get('mode') ?? 'up'
    return json(response, 200, { mode })
  }
  if (url.pathname.startsWith('/keys/')) {
    return mode === 'up'
      ? json(response, 200, { keyBase64 })
      : json(response, 503, { error: 'key provider unavailable' })
  }
  return json(response, 404, { error: 'not found' })
})

server.listen(4102, '0.0.0.0')

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}
