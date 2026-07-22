import http from 'node:http'
import { generateKeyPairSync, sign } from 'node:crypto'

// Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 03C CODE-10 harness
// Contract: ADR-006, API-017–020, CODE-10 | Pack: v1.7.21-oidc-session-error-contracts

let mode = 'active'
let nonce = ''
const issuer = 'http://iam-fake:4101'
const keyId = 'foundation-signing-key'
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: keyId, alg: 'RS256', use: 'sig' }

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://iam-fake')
  if (url.pathname === '/health') return json(response, 200, { ok: true })
  if (url.pathname === '/.well-known/openid-configuration') {
    return json(response, 200, {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      jwks_uri: `${issuer}/jwks`,
    })
  }
  if (url.pathname === '/jwks') return json(response, 200, { keys: [publicJwk] })
  if (url.pathname === '/control') {
    mode = url.searchParams.get('mode') ?? 'active'
    return json(response, 200, { mode })
  }
  if (url.pathname === '/authorize') {
    nonce = url.searchParams.get('nonce') ?? ''
    return json(response, 200, { ok: true })
  }
  if (url.pathname === '/token' && request.method === 'POST') {
    const form = new URLSearchParams(await readBody(request))
    if (mode === 'uncertain') return json(response, 503, { error: 'iam unavailable' })
    if (form.get('grant_type') !== 'authorization_code' || !form.get('code_verifier')) {
      return json(response, 400, { error: 'invalid token request' })
    }
    const now = Math.floor(Date.now() / 1000)
    return json(response, 200, { id_token: jwt({
      iss: issuer,
      aud: 'api-lab-local',
      sub: 'actor-foundation',
      name: 'Foundation Actor',
      amr: ['pwd', 'mfa'],
      acr: 'urn:example:aal2',
      nonce,
      iat: now,
      exp: now + 8 * 60 * 60,
    }) })
  }
  if (url.pathname.startsWith('/status/')) {
    if (mode === 'uncertain') return json(response, 503, { error: 'iam unavailable' })
    return json(response, 200, { status: mode === 'inactive' ? 'INACTIVE' : 'ACTIVE' })
  }
  return json(response, 404, { error: 'not found' })
})

server.listen(4101, '0.0.0.0')

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}
function readBody(request) {
  return new Promise((resolve) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => { body += chunk })
    request.resume()
    request.on('end', () => resolve(body))
  })
}
function jwt(payload) {
  const header = encode({ alg: 'RS256', typ: 'JWT', kid: keyId })
  const body = encode(payload)
  const signature = sign('RSA-SHA256', Buffer.from(`${header}.${body}`), privateKey).toString('base64url')
  return `${header}.${body}.${signature}`
}
function encode(value) { return Buffer.from(JSON.stringify(value)).toString('base64url') }
