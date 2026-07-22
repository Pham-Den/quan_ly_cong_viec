import assert from 'node:assert/strict'

import { assertFoundationErrorResponse } from './foundation-response-contract.js'

// Sprint: v1 | Feature: NFR-004/NFR-006/NFR-010 | Task Group: 03C CODE-10 harness
// Contract: API-017–020/024, CODE-10 | Pack: v1.7.21-oidc-session-error-contracts

const backendUrl = process.env.FOUNDATION_BACKEND_URL ?? 'http://127.0.0.1:4000'
const iamUrl = process.env.FOUNDATION_IAM_URL ?? 'http://127.0.0.1:4101'
const keyProviderUrl = process.env.FOUNDATION_KEY_PROVIDER_URL ?? 'http://127.0.0.1:4102'
const runHappy = process.argv.includes('--happy') || !process.argv.includes('--error-cases')
const errorCases = option('--error-cases')?.split(',').filter(Boolean) ?? []

await resetDependencies()
try {
  if (runHappy) await happyPath()
  if (errorCases.includes('iam')) await iamUncertaintyPath()
  if (errorCases.includes('key')) await keyProviderFailurePath()
  if (errorCases.includes('store')) await sessionStoreFailurePath()
  process.stdout.write(`Foundation self-test passed: happy=${runHappy}; errors=${errorCases.join(',') || 'none'}\n`)
} finally {
  await resetDependencies()
}

async function happyPath() {
  const session = await establishSession('/foundation-ready')
  const projection = await request('/api/v1/auth/session', { headers: { cookie: session.cookie } })
  assert.equal(projection.status, 200)
  const body = await json(projection)
  assert.equal(record(record(body).actor).id, 'actor-foundation')
  assert.ok(text(record(body).csrfToken))
  assertCorrelation(projection)

  const logout = await request('/api/v1/auth/logout', {
    method: 'POST',
    headers: { cookie: session.cookie, 'x-csrf-token': text(record(body).csrfToken) },
  })
  assert.equal(logout.status, 200)
  assertCorrelation(logout)
}

async function iamUncertaintyPath() {
  const session = await establishSession('/iam-error')
  await control(iamUrl, 'uncertain')
  const response = await request('/api/v1/auth/session', { headers: { cookie: session.cookie } })
  await expectError(response, 503, 'SERVICE_UNAVAILABLE')
  await control(iamUrl, 'active')
}

async function keyProviderFailurePath() {
  const session = await establishSession('/key-error')
  await control(keyProviderUrl, 'down')
  const response = await request('/api/v1/auth/session', { headers: { cookie: session.cookie } })
  await expectError(response, 503, 'KEY_PROVIDER_UNAVAILABLE')
  await control(keyProviderUrl, 'up')
}

async function sessionStoreFailurePath() {
  const response = await request('/__test__/foundation/store/down', { method: 'POST' })
  assert.equal(response.status, 200)
  const login = await request('/api/v1/auth/login', jsonPost({ returnTo: '/store-error' }))
  await expectError(login, 503, 'SESSION_STORE_UNAVAILABLE')
  const restored = await request('/__test__/foundation/store/up', { method: 'POST' })
  assert.equal(restored.status, 200)
}

async function establishSession(returnTo: string): Promise<{ cookie: string }> {
  await control(iamUrl, 'active')
  await control(keyProviderUrl, 'up')
  const login = await request('/api/v1/auth/login', jsonPost({ returnTo }))
  assert.equal(login.status, 200)
  const authorizeLocation = String(record(await json(login)).authorizationUrl)
  const internalAuthorize = new URL(authorizeLocation)
  const reachableAuthorize = new URL('/authorize', iamUrl)
  reachableAuthorize.search = internalAuthorize.search
  const authorize = await fetch(reachableAuthorize)
  assert.equal(authorize.status, 200)
  const state = internalAuthorize.searchParams.get('state')
  assert.ok(state)

  const callback = await request('/api/v1/auth/callback', jsonPost({ code: 'synthetic-code', state }))
  assert.equal(callback.status, 200)
  assert.deepEqual(await json(callback), { returnTo })
  assertCorrelation(callback)
  return { cookie: requiredHeader(callback, 'set-cookie').split(';', 1)[0]! }
}

async function expectError(response: Response, status: number, code: string) {
  await assertFoundationErrorResponse(response, status, code)
  assertCorrelation(response)
}

function assertCorrelation(response: Response) {
  assert.match(requiredHeader(response, 'x-request-id'), /^[A-Za-z0-9_-]{1,64}$/)
  assert.match(requiredHeader(response, 'x-trace-id'), /^[a-f0-9]{32}$/)
}
async function resetDependencies() {
  await Promise.allSettled([
    control(iamUrl, 'active'),
    control(keyProviderUrl, 'up'),
    request('/__test__/foundation/store/up', { method: 'POST' }),
  ])
}
async function control(baseUrl: string, mode: string) {
  const response = await fetch(`${baseUrl}/control?mode=${encodeURIComponent(mode)}`)
  assert.equal(response.status, 200)
}
function request(path: string, init: RequestInit = {}) {
  return fetch(`${backendUrl}${path}`, { ...init, redirect: 'manual' })
}
function jsonPost(body: Record<string, unknown>): RequestInit {
  return { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
}
function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}
function requiredHeader(response: Response, name: string): string {
  const value = response.headers.get(name)
  assert.ok(value, `Missing ${name} response header.`)
  return value
}
async function json(response: Response): Promise<unknown> {
  const raw = await response.text()
  return raw ? JSON.parse(raw) : null
}
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}
function text(value: unknown): string { return typeof value === 'string' ? value : '' }
