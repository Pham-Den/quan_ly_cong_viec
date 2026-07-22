// @ts-nocheck -- executed by Node/tsx; excluded from browser runtime behavior.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { AxiosHeaders } from 'axios'

import { latestResponseCorrelation, recordResponseCorrelation } from '../api/client.ts'

import {
  api,
  applyRequestSecurity,
  bindCsrfToken,
  configureAuthLifecycle,
  completeOidcCallback,
  fetchApiSession,
  handleAuthFailureResponse,
  interpretSessionResponse,
  requestOidcLogin,
  retryOidcCallback,
  type ApiSessionResponse,
} from '../../services/api.ts'

// Sprint: v1 | TC-065/TC-068 | Task Group: 02C Browser session cutover
// Contract: API-017–020, DS-COMP-012, PR-001 | Pack: v1.7.21-oidc-session-error-contracts

test('cookie client injects request-local CSRF only on mutations', () => {
  bindCsrfToken('csrf-memory-only')
  const mutation = applyRequestSecurity({ method: 'post', headers: new AxiosHeaders() } as never)
  assert.equal(mutation.headers.get('X-CSRF-Token'), 'csrf-memory-only')
  assert.match(String(mutation.headers.get('X-Request-ID')), /^[0-9a-f-]{36}$/)
  const read = applyRequestSecurity({ method: 'get', headers: new AxiosHeaders() } as never)
  assert.equal(read.headers.has('X-CSRF-Token'), false)
  const existing = applyRequestSecurity({ method: 'head', headers: new AxiosHeaders({ 'X-Request-ID': 'existing-id' }) } as never)
  assert.equal(existing.headers.get('X-Request-ID'), 'existing-id')
  bindCsrfToken(null)
})

test('API-020 interpreter preserves a valid 304 and accepts a complete 200 projection', () => {
  const session: ApiSessionResponse = {
    actor: { id: 'actor-1', displayName: 'Actor One' },
    expiresAt: '2026-07-20T12:00:00.000Z',
    lastActivityAt: '2026-07-20T11:00:00.000Z',
    idleExpiresAt: '2026-07-20T11:15:00.000Z',
    csrfToken: 'csrf-memory-only',
  }
  assert.deepEqual(interpretSessionResponse(200, session, 'W/"2"'), { status: 200, session, etag: 'W/"2"' })
  assert.deepEqual(interpretSessionResponse(304, '', 'W/"2"'), { status: 304, session: null, etag: 'W/"2"' })
  assert.deepEqual(interpretSessionResponse(304, '', 42), { status: 304, session: null, etag: '' })
  assert.throws(() => interpretSessionResponse(204, null, ''))
})

test('API-018 SPA handoff submits code/state through Axios and accepts only a safe return path', async () => {
  const originalPost = api.post
  const calls: unknown[][] = []
  try {
    api.post = (async (...args: unknown[]) => {
      calls.push(args)
      return { status: 200, data: { returnTo: '/systems/host-1/api-lab' }, headers: {} }
    }) as never
    assert.equal(await completeOidcCallback('code-1', 'state-1'), '/systems/host-1/api-lab')
    assert.deepEqual(calls[0], ['/api/v1/auth/callback', { code: 'code-1', state: 'state-1' }])
    assert.equal(await retryOidcCallback('/api/v1/auth/callback?code=code-1&state=state-1'), '/systems/host-1/api-lab')
    assert.deepEqual(calls[1], ['/api/v1/auth/callback', { code: 'code-1', state: 'state-1' }])
    await assert.rejects(retryOidcCallback('https://evil.example/api/v1/auth/callback?code=x&state=y'), /Invalid API-018 retry target/)
    for (const returnTo of ['https://evil.example', '//evil.example', '/safe\\escape', 42]) {
      api.post = (async () => ({ status: 200, data: { returnTo }, headers: {} })) as never
      await assert.rejects(completeOidcCallback('code-1', 'state-1'), /Invalid API-018 return path/)
    }
  } finally {
    api.post = originalPost
  }
})

test('post-claim 503 requires matching retry metadata before exposing restart-login state', async () => {
  const seen: number[] = []
  let invalidContracts = 0
  configureAuthLifecycle({
    onRestartRequired: async (seconds) => { seen.push(seconds) },
    onCallbackRecoveryInvalid: async () => { invalidContracts += 1 },
  })
  assert.equal(await handleAuthFailureResponse({
    status: 503,
    config: { method: 'post', url: '/api/v1/auth/callback', data: { code: 'c', state: 's' } },
    headers: { 'retry-after': '5' },
    data: { error: { details: { retry_after_seconds: 5, recovery_action: 'RESTART_LOGIN' } } },
  }), true)
  assert.deepEqual(seen, [5])
  assert.equal(await handleAuthFailureResponse({
    status: 503,
    config: { method: 'post', url: '/api/v1/auth/callback', data: { code: 'c', state: 's' } },
    headers: { 'retry-after': '4' },
    data: { error: { details: { retry_after_seconds: 5, recovery_action: 'RESTART_LOGIN' } } },
  }), true)
  assert.equal(await handleAuthFailureResponse({ status: 500, data: null }), false)
  assert.equal(await handleAuthFailureResponse({
    status: 503,
    config: { method: 'post', url: '/api/v1/auth/callback', data: { code: 'c', state: 's' } },
    headers: { 'retry-after': '0' },
    data: { error: { details: { retry_after_seconds: 0, recovery_action: 'RESTART_LOGIN' } } },
  }), true)
  assert.equal(await handleAuthFailureResponse({
    status: 503,
    config: { method: 'post', url: '/api/v1/auth/callback', data: { code: 'c', state: 's' } },
    headers: { 'retry-after': '5' },
    data: { error: { details: { retry_after_seconds: 5, recovery_action: 'RETRY_CALLBACK' } } },
  }), true)
  assert.equal(invalidContracts, 3)
  assert.equal(await handleAuthFailureResponse({
    status: 503,
    config: { url: '/api/v1/auth/session' },
    headers: { 'retry-after': '5' },
    data: { error: { details: { retry_after_seconds: 5, recovery_action: 'RESTART_LOGIN' } } },
  }), false)
  assert.deepEqual(seen, [5])
})

test('pre-claim 503 is accepted only for the exact callback endpoint and matching retry metadata', async () => {
  const seen: Array<[number, string]> = []
  configureAuthLifecycle({ onCallbackRetryRequired: async (seconds, callbackUrl) => { seen.push([seconds, callbackUrl]) } })
  assert.equal(await handleAuthFailureResponse({
    status: 503,
    config: { method: 'post', url: '/api/v1/auth/callback', data: { code: 'c', state: 's' } },
    headers: { 'Retry-After': '3' },
    data: { error: { details: { retry_after_seconds: 3 } } },
  }), true)
  assert.deepEqual(seen, [[3, '/api/v1/auth/callback?code=c&state=s']])
  assert.equal(await handleAuthFailureResponse({
    status: 503,
    config: { url: '/api/v1/auth/session' },
    headers: { 'retry-after': '3' },
    data: { error: { details: { retry_after_seconds: 3 } } },
  }), false)
  assert.equal(await handleAuthFailureResponse({
    status: 503,
    config: { method: 'post', url: 'https://untrusted.example/api/v1/auth/callback', data: { code: 'c', state: 's' } },
    headers: { 'retry-after': '3' },
    data: { error: { details: { retry_after_seconds: 3 } } },
  }), false)
  assert.equal(await handleAuthFailureResponse({
    status: 503,
    config: { method: 'post', url: 'http://[' },
    headers: { 'retry-after': '3' },
    data: { error: { details: { retry_after_seconds: 3 } } },
  }), false)
})

test('malformed callback recovery metadata fails closed to a fresh-login state', async () => {
  let invalidContracts = 0
  let callbackRetries = 0
  configureAuthLifecycle({
    onCallbackRecoveryInvalid: async () => { invalidContracts += 1 },
    onCallbackRetryRequired: async () => { callbackRetries += 1 },
  })
  for (const candidate of [
    { headers: {}, details: { retry_after_seconds: 5 } },
    { headers: { 'retry-after': '5' }, details: {} },
    { headers: { 'retry-after': '5' }, details: { retry_after_seconds: 4 } },
    { headers: { 'retry-after': '86401' }, details: { retry_after_seconds: 86_401 } },
  ]) {
    assert.equal(await handleAuthFailureResponse({
      status: 503,
      config: { method: 'post', url: '/api/v1/auth/callback', data: { code: 'c', state: 's' } },
      headers: candidate.headers,
      data: { error: { details: candidate.details } },
    }), true)
  }
  assert.equal(invalidContracts, 4)
  assert.equal(callbackRetries, 0)
})

test('response correlation retains only bounded safe identifiers and returns defensive copies', () => {
  recordResponseCorrelation({ 'x-request-id': 'request_123', 'x-trace-id': 'trace-456' })
  const first = latestResponseCorrelation()
  assert.deepEqual(first, { requestId: 'request_123', traceId: 'trace-456' })
  if (first) first.requestId = 'mutated'
  assert.equal(latestResponseCorrelation()?.requestId, 'request_123')
  recordResponseCorrelation({ 'x-request-id': 'bad value', 'x-trace-id': 'x'.repeat(65) })
  assert.equal(latestResponseCorrelation(), null)
})

test('401 expires the session while API-017 POST uses only the validated return path', async () => {
  let expired = 0
  configureAuthLifecycle({ onSessionExpired: async () => { expired += 1 } })
  assert.equal(await handleAuthFailureResponse({ status: 401 }), true)
  assert.equal(expired, 1)

  const originalPost = api.post
  const bodies: unknown[] = []
  try {
    api.post = (async (_url: string, body: unknown) => {
      bodies.push(body)
      return { status: 200, data: { authorizationUrl: 'https://iam.example/authorize' }, headers: {} }
    }) as never
    assert.equal(await requestOidcLogin('/systems/host-1'), 'https://iam.example/authorize')
    assert.equal(await requestOidcLogin('//untrusted.example'), 'https://iam.example/authorize')
    assert.deepEqual(bodies, [{ returnTo: '/systems/host-1' }, { returnTo: '/' }])
  } finally { api.post = originalPost }
})

test('fetchApiSession sends ETag and accepts the API-020 304 branch', async () => {
  const priorAdapter = api.defaults.adapter
  let seenEtag = ''
  api.defaults.adapter = async (config) => {
    seenEtag = AxiosHeaders.from(config.headers).get('If-None-Match') ?? ''
    return { data: '', status: 304, statusText: 'Not Modified', headers: new AxiosHeaders({ etag: 'W/"7"' }), config }
  }
  try {
    assert.deepEqual(await fetchApiSession('W/"7"'), { status: 304, session: null, etag: 'W/"7"' })
    assert.equal(seenEtag, 'W/"7"')
  } finally {
    api.defaults.adapter = priorAdapter
  }
})

test('response interceptor preserves an unhandled transport failure', async () => {
  const priorAdapter = api.defaults.adapter
  api.defaults.adapter = async (config) => {
    throw new AxiosError('synthetic failure', 'ERR_BAD_RESPONSE', config, undefined, {
      data: null, status: 500, statusText: 'Failure', headers: new AxiosHeaders(), config,
    })
  }
  try { await assert.rejects(api.get('/synthetic-failure')) } finally { api.defaults.adapter = priorAdapter }
})

test('browser source retains no bearer or CSRF token persistence', async () => {
  const [api, session] = await Promise.all([
    readFile(new URL('../../services/api.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../stores/session.ts', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(`${api}\n${session}`, /Authorization[^\n]*Bearer/i)
  assert.doesNotMatch(`${api}\n${session}`, /(?:localStorage|sessionStorage)\.(?:setItem|getItem)\([^\n]*(?:access|refresh|bearer|csrf)[_-]?token/i)
})
