import assert from 'node:assert/strict'
import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto'
import { test } from 'node:test'

import Fastify from 'fastify'

import { resolveIdentityRuntimeConfig } from './config.js'
import { createAuthGuard, createCsrfGuard } from '../../auth/guard.js'
import {
  CentralIamTokenRejectedError,
  IdentityApplicationError,
  IdentityService,
  type CentralIamPort,
  type IdentityRandomSource,
  type VerifiedIdentity,
} from './application/index.js'
import {
  IdentityKeyProviderUnavailableError,
  IdentitySessionStoreUnavailableError,
  type AuthSessionRecord,
  type AuthSessionRepository,
  type EncryptedIdentityValue,
  type IdentityKeyPort,
  type OidcLoginStateRecord,
  type OidcLoginStateRepository,
  type SessionInvalidationReason,
} from './domain/index.js'
import { SESSION_ACTIVITY_WRITE_MIN_MS, SESSION_IDLE_TIMEOUT_MS } from './domain/index.js'
import { registerIdentityPlugin } from './delivery/index.js'
import { IdentityRateLimiter } from './delivery/index.js'
import { HttpCentralIamAdapter, sha256 } from './infrastructure/index.js'

// Sprint: v1 | TC-065/TC-068 | Task Group: 02B Identity delivery
// Pack: v1.7.21-oidc-session-error-contracts
class MutableClock { constructor(public value = new Date('2026-07-19T14:00:00.000Z')) {} now() { return new Date(this.value) } }
class DeterministicRandom implements IdentityRandomSource {
  private counter = 1
  bytes(length: number) { return Uint8Array.from({ length }, () => this.counter++) }
  id() { return `00000000-0000-4000-8000-${String(this.counter++).padStart(12, '0')}` }
}
class MemoryKeys implements IdentityKeyPort {
  decryptCalls = 0
  fail = false
  async encrypt(plaintext: Uint8Array, keyId: string): Promise<EncryptedIdentityValue> {
    if (this.fail) throw new IdentityKeyProviderUnavailableError()
    return { ciphertext: Uint8Array.from(plaintext), nonce: new Uint8Array(12), tag: new Uint8Array(16), keyId }
  }
  async decrypt(value: EncryptedIdentityValue) {
    this.decryptCalls += 1
    if (this.fail) throw new IdentityKeyProviderUnavailableError()
    return Uint8Array.from(value.ciphertext)
  }
}
class MemoryLoginStates implements OidcLoginStateRepository {
  rows = new Map<string, OidcLoginStateRecord>()
  fail = false
  async create(record: Omit<OidcLoginStateRecord, 'consumedAt'>) {
    if (this.fail) throw new IdentitySessionStoreUnavailableError()
    this.rows.set(hex(record.stateSha256), { ...record, consumedAt: null })
  }
  async consume(digest: Uint8Array, now: Date) {
    if (this.fail) throw new IdentitySessionStoreUnavailableError()
    const row = this.rows.get(hex(digest))
    if (!row) return { status: 'NOT_FOUND' as const }
    if (row.consumedAt) return { status: 'REPLAYED' as const }
    if (row.expiresAt <= now) return { status: 'EXPIRED' as const }
    row.consumedAt = now
    return { status: 'CLAIMED' as const, state: row }
  }
}
class MemorySessions implements AuthSessionRepository {
  rows = new Map<string, AuthSessionRecord>()
  fail = false
  refreshCalls = 0
  async create(record: Omit<AuthSessionRecord, 'invalidatedAt' | 'invalidationReason' | 'revision'>) {
    if (this.fail) throw new IdentitySessionStoreUnavailableError()
    this.rows.set(hex(record.sessionTokenSha256), { ...record, invalidatedAt: null, invalidationReason: null, revision: 1n })
  }
  async resolve(digest: Uint8Array, now: Date) {
    if (this.fail) throw new IdentitySessionStoreUnavailableError()
    const row = this.rows.get(hex(digest))
    if (!row) return { status: 'NOT_FOUND' as const }
    if (row.invalidatedAt) return { status: 'INVALIDATED' as const, session: { ...row } }
    if (row.absoluteExpiresAt <= now) {
      row.invalidatedAt = now; row.invalidationReason = 'ABSOLUTE_EXPIRY'
      return { status: 'ABSOLUTE_EXPIRY' as const }
    }
    if (row.lastActivityAt < new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS)) {
      row.invalidatedAt = now; row.invalidationReason = 'IDLE_TIMEOUT'
      return { status: 'IDLE_TIMEOUT' as const }
    }
    return { status: 'ACTIVE' as const, session: { ...row } }
  }
  async refreshActivity(id: string, now: Date) {
    this.refreshCalls += 1
    if (this.fail) throw new IdentitySessionStoreUnavailableError()
    const row = [...this.rows.values()].find((candidate) => candidate.id === id)
    if (!row || row.invalidatedAt || row.absoluteExpiresAt <= now) return null
    if (row.lastActivityAt < new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS)) {
      row.invalidatedAt = now; row.invalidationReason = 'IDLE_TIMEOUT'
      return null
    }
    const due = row.lastActivityAt <= new Date(now.getTime() - SESSION_ACTIVITY_WRITE_MIN_MS)
    if (due) { row.lastActivityAt = now; row.revision += 1n }
    return { session: { ...row }, activityPersisted: due }
  }
  async invalidate(id: string, reason: SessionInvalidationReason, now: Date) {
    if (this.fail) throw new IdentitySessionStoreUnavailableError()
    const row = [...this.rows.values()].find((candidate) => candidate.id === id)
    if (!row || row.invalidatedAt) return false
    row.invalidatedAt = now; row.invalidationReason = reason
    return true
  }
}
class FakeIam implements CentralIamPort {
  state = ''
  nonce = ''
  status: 'ACTIVE' | 'INACTIVE' | 'UNCERTAIN' = 'ACTIVE'
  failExchange = false
  failAuthorization = false
  failStatus = false
  statusCalls = 0
  exchangeError: unknown = null
  identity: VerifiedIdentity = {
    actor: { id: 'iam-user-17', displayName: 'Synthetic User', email: 'user@example.test' },
    mfaAssurance: { amr: ['mfa'], acr: 'urn:approved' },
    nonce: '',
    absoluteExpiresAt: new Date('2026-07-19T16:00:00.000Z'),
  }
  async authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }) {
    if (this.failAuthorization) throw new Error('discovery unavailable')
    this.state = input.state; this.nonce = input.nonce
    return `https://iam.example.test/authorize?state=${encodeURIComponent(input.state)}&challenge=${input.codeChallenge}`
  }
  async exchangeCode(_input: { code: string; pkceVerifier: string }) {
    if (this.exchangeError) throw this.exchangeError
    if (this.failExchange) throw new Error('IAM unavailable')
    return { ...this.identity, nonce: this.identity.nonce || this.nonce }
  }
  async subjectStatus() {
    this.statusCalls += 1
    if (this.failStatus) throw new Error('status unavailable')
    return this.status
  }
}

function fixture() {
  const clock = new MutableClock()
  const keys = new MemoryKeys()
  const states = new MemoryLoginStates()
  const sessions = new MemorySessions()
  const iam = new FakeIam()
  const service = new IdentityService(states, sessions, keys, iam, clock, new DeterministicRandom(), {
    oidcStateKeyId: 'oidc-state-key-ref', sessionCsrfKeyId: 'session-csrf-key-ref',
  })
  return { clock, keys, states, sessions, iam, service }
}

async function appFixture(f = fixture()) {
  const app = Fastify({ logger: false })
  await registerIdentityPlugin(app, {
    service: f.service,
    secureCookies: true,
  })
  return { ...f, app }
}

async function loginAndCallback(f: Awaited<ReturnType<typeof appFixture>>) {
  const login = await f.app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { returnTo: '/systems/1' } })
  assert.equal(login.statusCode, 200)
  assert.equal(login.headers['cache-control'], 'no-store, private')
  assert.equal(login.headers.pragma, 'no-cache')
  const callback = await f.app.inject({ method: 'POST', url: '/api/v1/auth/callback', payload: { code: 'ok', state: f.iam.state } })
  assert.equal(callback.statusCode, 200)
  assert.equal(callback.headers['cache-control'], 'no-store, private')
  assert.equal(callback.headers.pragma, 'no-cache')
  assert.deepEqual(callback.json(), { returnTo: '/systems/1' })
  const setCookie = String(callback.headers['set-cookie'])
  assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Lax/); assert.match(setCookie, /Secure/)
  assert.equal(callback.headers['x-csrf-token'], undefined)
  const cookie = setCookie.split(';')[0]!
  const session = await f.app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie } })
  assert.equal(session.statusCode, 200)
  return { cookie, csrf: session.json().csrfToken }
}

test('API-017/018 validate return path, create opaque cookie and reject callback replay', async (t) => {
  const f = await appFixture(); t.after(() => f.app.close())
  const invalidLogin = await f.app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { returnTo: 'https://evil.test' } })
  assert.equal(invalidLogin.statusCode, 400)
  assert.equal(invalidLogin.headers['cache-control'], 'no-store, private')
  assert.equal(invalidLogin.headers.pragma, 'no-cache')
  const invalidCallback = await f.app.inject({ method: 'POST', url: '/api/v1/auth/callback', payload: {} })
  assert.equal(invalidCallback.statusCode, 400)
  assert.equal(invalidCallback.headers['cache-control'], 'no-store, private')
  assert.equal(invalidCallback.headers.pragma, 'no-cache')
  await loginAndCallback(f)
  const replay = await f.app.inject({ method: 'POST', url: '/api/v1/auth/callback', payload: { code: 'again', state: f.iam.state } })
  assert.equal(replay.statusCode, 409)
  assert.equal(replay.headers['cache-control'], 'no-store, private')
  assert.equal(replay.headers.pragma, 'no-cache')
  assert.equal(replay.json().error.code, 'CALLBACK_REPLAYED')
})

test('API-020 returns 200 then matching 304 without decrypt or activity write', async (t) => {
  const f = await appFixture(); t.after(() => f.app.close())
  const auth = await loginAndCallback(f)
  const first = await f.app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie: auth.cookie } })
  assert.equal(first.statusCode, 200); assert.equal(first.json().csrfToken, auth.csrf)
  const decrypts = f.keys.decryptCalls
  const second = await f.app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie: auth.cookie, 'if-none-match': String(first.headers.etag) } })
  assert.equal(second.statusCode, 304); assert.equal(second.body, ''); assert.equal(f.keys.decryptCalls, decrypts)
})

test('API-019 compares CSRF digest and monotonically logs out', async (t) => {
  const f = await appFixture(); t.after(() => f.app.close())
  const auth = await loginAndCallback(f)
  assert.equal((await f.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: auth.cookie, 'x-csrf-token': 'wrong' } })).statusCode, 403)
  const statusCallsBeforeLogout = f.iam.statusCalls
  const logout = await f.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrf }, payload: { allSessions: false } })
  assert.equal(logout.statusCode, 200); assert.equal(logout.json().loggedOut, true)
  assert.equal(f.iam.statusCalls, statusCallsBeforeLogout + 1)
  const repeated = await f.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrf } })
  assert.equal(repeated.statusCode, 200); assert.equal(repeated.json().loggedOut, true)
  assert.equal(f.iam.statusCalls, statusCallsBeforeLogout + 1)
  assert.equal((await f.app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie: auth.cookie } })).statusCode, 401)
})

test('API-019 rejects global logout and malformed body without invalidating the local session', async (t) => {
  const f = await appFixture(); t.after(() => f.app.close())
  const auth = await loginAndCallback(f)
  const global = await f.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrf }, payload: { allSessions: true } })
  assert.equal(global.statusCode, 422); assert.equal(global.json().error.code, 'GLOBAL_LOGOUT_UNSUPPORTED')
  assert.equal([...f.sessions.rows.values()][0]!.invalidatedAt, null)
  const malformed = await f.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrf }, payload: { allSessions: 'yes' } })
  assert.equal(malformed.statusCode, 400); assert.equal(malformed.json().error.code, 'INVALID_REQUEST')
})

test('API-019 fails closed for inactive or unavailable IAM during logout', async () => {
  const inactive = fixture(); await inactive.service.beginLogin('/'); const createdInactive = await inactive.service.completeCallback('ok', inactive.iam.state)
  const session = [...inactive.sessions.rows.values()][0]!
  inactive.iam.status = 'INACTIVE'
  await assert.rejects(inactive.service.logout(createdInactive.sessionSelector, createdInactive.csrfToken), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'AUTH_REQUIRED')
  assert.equal(session.invalidationReason, 'IAM_REVOKED')

  const uncertain = fixture(); await uncertain.service.beginLogin('/'); const created = await uncertain.service.completeCallback('ok', uncertain.iam.state)
  uncertain.iam.failStatus = true
  await assert.rejects(uncertain.service.logout(created.sessionSelector, created.csrfToken), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'SERVICE_UNAVAILABLE')

  const discovery = fixture(); discovery.iam.failAuthorization = true
  await assert.rejects(discovery.service.beginLogin('/'), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'SERVICE_UNAVAILABLE')
})

test('API-017 and API-020 enforce burst limits with matching Retry-After details', async (t) => {
  const f = fixture()
  const app = Fastify({ logger: false }); t.after(() => app.close())
  await registerIdentityPlugin(app, {
    service: f.service,
    secureCookies: true,
    loginLimiter: new IdentityRateLimiter(30, 5, () => 0),
    sessionLimiter: new IdentityRateLimiter(120, 2, () => 0),
  })
  for (let index = 0; index < 5; index += 1) {
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: {} })).statusCode, 200)
  }
  const limitedLogin = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: {} })
  assert.equal(limitedLogin.statusCode, 429)
  assert.equal(limitedLogin.json().error.details.retry_after_seconds, Number(limitedLogin.headers['retry-after']))

  const active = await appFixture(); t.after(() => active.app.close())
  const auth = await loginAndCallback(active)
  const limiter = new IdentityRateLimiter(120, 2, () => 0)
  const limitedApp = Fastify({ logger: false }); t.after(() => limitedApp.close())
  await registerIdentityPlugin(limitedApp, { service: active.service, secureCookies: true, sessionLimiter: limiter })
  assert.equal((await limitedApp.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie: auth.cookie } })).statusCode, 200)
  assert.equal((await limitedApp.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie: auth.cookie } })).statusCode, 200)
  assert.equal((await limitedApp.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie: auth.cookie } })).statusCode, 429)
})

test('API-024 omits empty details and returns resolved user-facing messages', async (t) => {
  const f = await appFixture(); t.after(() => f.app.close())
  const response = await f.app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { returnTo: 'https://evil.test' } })
  assert.equal(response.statusCode, 400)
  const error = response.json().error
  assert.equal('details' in error, false)
  assert.equal(error.message, 'Đường dẫn quay lại không hợp lệ.')
  assert.equal(error.message.startsWith('errors.'), false)
})

test('protected session keeps IAM uncertainty, inactive authority, key and store failures distinct', async (t) => {
  for (const [kind, expected] of [['iam', 'SERVICE_UNAVAILABLE'], ['key', 'KEY_PROVIDER_UNAVAILABLE'], ['store', 'SESSION_STORE_UNAVAILABLE']] as const) {
    const f = await appFixture(); t.after(() => f.app.close())
    const auth = await loginAndCallback(f)
    if (kind === 'iam') {
      f.clock.value = new Date(f.clock.value.getTime() + SESSION_ACTIVITY_WRITE_MIN_MS)
      f.iam.status = 'UNCERTAIN'
    }
    if (kind === 'key') f.keys.fail = true
    if (kind === 'store') f.sessions.fail = true
    const response = await f.app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie: auth.cookie } })
    const envelope = response.json().error
    assert.equal(envelope.code, expected)
    if (response.statusCode === 503) {
      const retryAfter = Number(response.headers['retry-after'])
      assert.ok(Number.isInteger(retryAfter) && retryAfter >= 1 && retryAfter <= 86_400)
      assert.equal(envelope.details.retry_after_seconds, retryAfter)
    }
    if (kind === 'iam') assert.equal([...f.sessions.rows.values()][0]!.revision, 1n)
  }

  const inactive = await appFixture(); t.after(() => inactive.app.close())
  const auth = await loginAndCallback(inactive); inactive.iam.status = 'INACTIVE'
  const response = await inactive.app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie: auth.cookie } })
  assert.equal(response.statusCode, 401); assert.equal([...inactive.sessions.rows.values()][0]!.invalidationReason, 'IAM_REVOKED')
})

test('application rejects nonce mismatch, expired state and IAM exchange uncertainty before session creation', async () => {
  const nonceMismatch = fixture()
  await nonceMismatch.service.beginLogin('/')
  nonceMismatch.iam.identity.nonce = 'wrong'
  await assert.rejects(nonceMismatch.service.completeCallback('ok', nonceMismatch.iam.state), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'OIDC_TOKEN_REJECTED')
  assert.equal(nonceMismatch.sessions.rows.size, 0)

  const expired = fixture(); await expired.service.beginLogin('/'); expired.clock.value = new Date(expired.clock.value.getTime() + 10 * 60 * 1_000)
  await assert.rejects(expired.service.completeCallback('ok', expired.iam.state), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'SESSION_STATE_NOT_FOUND')

  const uncertain = fixture(); await uncertain.service.beginLogin('/'); uncertain.iam.failExchange = true
  await assert.rejects(uncertain.service.completeCallback('ok', uncertain.iam.state), (error: unknown) =>
    error instanceof IdentityApplicationError
      && error.code === 'SERVICE_UNAVAILABLE'
      && error.details.recovery_action === 'RESTART_LOGIN',
  )

  const identityExpired = fixture(); await identityExpired.service.beginLogin('/')
  identityExpired.iam.identity.absoluteExpiresAt = identityExpired.clock.now()
  await assert.rejects(identityExpired.service.completeCallback('ok', identityExpired.iam.state), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'OIDC_TOKEN_REJECTED')

  const typed = fixture(); await typed.service.beginLogin('/')
  typed.iam.exchangeError = new IdentityApplicationError('CLAIM_MAPPING_INVALID')
  await assert.rejects(typed.service.completeCallback('ok', typed.iam.state), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'CLAIM_MAPPING_INVALID')

  const rejectedToken = fixture(); await rejectedToken.service.beginLogin('/')
  rejectedToken.iam.exchangeError = new CentralIamTokenRejectedError('invalid signature')
  await assert.rejects(rejectedToken.service.completeCallback('ok', rejectedToken.iam.state), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'OIDC_TOKEN_REJECTED')

  const missingMfa = fixture(); await missingMfa.service.beginLogin('/')
  missingMfa.iam.identity.mfaAssurance = { amr: ['pwd'], acr: '' }
  await assert.rejects(missingMfa.service.completeCallback('ok', missingMfa.iam.state), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'OIDC_TOKEN_REJECTED')
  assert.equal(missingMfa.sessions.rows.size, 0)

  const keyFailure = fixture(); await keyFailure.service.beginLogin('/'); keyFailure.keys.fail = true
  await assert.rejects(keyFailure.service.completeCallback('ok', keyFailure.iam.state), (error: unknown) =>
    error instanceof IdentityApplicationError
      && error.code === 'KEY_PROVIDER_UNAVAILABLE'
      && error.details.recovery_action === 'RESTART_LOGIN',
  )

  const storeFailure = fixture(); await storeFailure.service.beginLogin('/'); storeFailure.sessions.fail = true
  await assert.rejects(storeFailure.service.completeCallback('ok', storeFailure.iam.state), (error: unknown) =>
    error instanceof IdentityApplicationError
      && error.code === 'SESSION_STORE_UNAVAILABLE'
      && error.details.recovery_action === 'RESTART_LOGIN',
  )

  const unexpected = fixture(); await unexpected.service.beginLogin('/')
  unexpected.sessions.create = async () => { throw new TypeError('synthetic unexpected failure') }
  await assert.rejects(unexpected.service.completeCallback('ok', unexpected.iam.state), (error: unknown) =>
    error instanceof IdentityApplicationError
      && error.code === 'INTERNAL_ERROR'
      && error.details.recovery_action === undefined,
  )
})

test('ENT-023 persists only exact versioned actor and MFA projections and rejects corrupt actor before IAM or activity', async () => {
  const f = fixture()
  await f.service.beginLogin('/')
  const created = await f.service.completeCallback('ok', f.iam.state)
  const row = [...f.sessions.rows.values()][0]!
  assert.deepEqual(row.actorProjection, {
    schemaVersion: 1, id: 'iam-user-17', displayName: 'Synthetic User', email: 'user@example.test',
  })
  assert.deepEqual(row.mfaAssurance, { schemaVersion: 1, amr: ['mfa'], acr: 'urn:approved' })
  ;(row.actorProjection as Record<string, unknown>).unapprovedClaim = 'must-not-pass'
  await assert.rejects(f.service.requireActor(created.sessionSelector), (error: unknown) =>
    error instanceof IdentityApplicationError && error.code === 'SESSION_CLAIMS_INVALID',
  )
  assert.equal(f.iam.statusCalls, 0)
  assert.equal(f.sessions.refreshCalls, 0)
})

test('ENT-023 rejects corrupt MFA assurance before IAM or activity', async () => {
  const f = fixture()
  await f.service.beginLogin('/')
  const created = await f.service.completeCallback('ok', f.iam.state)
  const row = [...f.sessions.rows.values()][0]!
  row.mfaAssurance = { schemaVersion: 1, amr: ['pwd'], acr: 'urn:approved' }
  await assert.rejects(f.service.requireActor(created.sessionSelector), (error: unknown) =>
    error instanceof IdentityApplicationError && error.code === 'SESSION_CLAIMS_INVALID',
  )
  assert.equal(f.iam.statusCalls, 0)
  assert.equal(f.sessions.refreshCalls, 0)
})

test('API-020 maps corrupt persisted claims to 422 before IAM or activity', async (t) => {
  const f = await appFixture(); t.after(() => f.app.close())
  await f.service.beginLogin('/')
  const created = await f.service.completeCallback('ok', f.iam.state)
  const row = [...f.sessions.rows.values()][0]!
  row.mfaAssurance = { schemaVersion: 1, amr: ['pwd'], acr: 'urn:approved' }
  f.iam.statusCalls = 0
  f.sessions.refreshCalls = 0
  const response = await f.app.inject({
    method: 'GET', url: '/api/v1/auth/session', headers: { cookie: `api_lab_session=${created.sessionSelector}` },
  })
  assert.equal(response.statusCode, 422)
  assert.equal(response.json().error.code, 'SESSION_CLAIMS_INVALID')
  assert.equal(f.iam.statusCalls, 0)
  assert.equal(f.sessions.refreshCalls, 0)
})

test('ENT-023 projection permits the exact optional-email variant and rejects oversized actor claims', async () => {
  const withoutEmail = fixture()
  withoutEmail.iam.identity.actor = { id: 'actor-no-email', displayName: 'No Email' }
  await withoutEmail.service.beginLogin('/')
  await withoutEmail.service.completeCallback('ok', withoutEmail.iam.state)
  assert.deepEqual([...withoutEmail.sessions.rows.values()][0]!.actorProjection, {
    schemaVersion: 1, id: 'actor-no-email', displayName: 'No Email',
  })

  const oversized = fixture()
  oversized.iam.identity.actor = { id: 'x'.repeat(192), displayName: 'Oversized' }
  await oversized.service.beginLogin('/')
  await assert.rejects(oversized.service.completeCallback('ok', oversized.iam.state), (error: unknown) =>
    error instanceof IdentityApplicationError
      && error.code === 'CLAIM_MAPPING_INVALID'
      && error.details.recovery_action === undefined,
  )
})

test('audit degradation never strands a successful login or callback result', async (t) => {
  const f = fixture()
  const app = Fastify({ logger: false }); t.after(() => app.close())
  await registerIdentityPlugin(app, {
    service: f.service,
    secureCookies: false,
    audit: { append: async () => { throw new Error('synthetic audit outage') } },
  })
  const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { returnTo: '/safe' } })
  assert.equal(login.statusCode, 200)
  const callback = await app.inject({ method: 'POST', url: '/api/v1/auth/callback', payload: { code: 'ok', state: f.iam.state } })
  assert.equal(callback.statusCode, 200)
  assert.deepEqual(callback.json(), { returnTo: '/safe' })
})

test('identity audit timestamps use the injected clock', async (t) => {
  const f = fixture()
  const occurredAt: Date[] = []
  const app = Fastify({ logger: false }); t.after(() => app.close())
  await registerIdentityPlugin(app, {
    service: f.service,
    secureCookies: false,
    now: () => f.clock.now(),
    audit: { append: async (fact) => { occurredAt.push(fact.occurredAt) } },
  })
  const expected = f.clock.now().toISOString()
  assert.equal((await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: {} })).statusCode, 200)
  assert.equal(occurredAt[0]?.toISOString(), expected)
})

test('delivery handles missing cookies, default return path and local non-secure cookie', async (t) => {
  const f = fixture()
  const app = Fastify({ logger: false }); t.after(() => app.close())
  await registerIdentityPlugin(app, {
    service: f.service,
    secureCookies: false,
  })
  const missing = await app.inject({ method: 'GET', url: '/api/v1/auth/session' })
  assert.equal(missing.statusCode, 401); assert.equal(missing.json().error.code, 'AUTH_REQUIRED')
  const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: {} })
  assert.equal(login.statusCode, 200)
  const callback = await app.inject({ method: 'POST', url: '/api/v1/auth/callback', payload: { code: 'ok', state: f.iam.state } })
  const cookie = String(callback.headers['set-cookie']).split(';')[0]!
  assert.equal(String(callback.headers['set-cookie']).includes('Secure'), false)
  const session = await app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie } })
  assert.equal(session.statusCode, 200); assert.equal('projects' in session.json(), false)
  await assert.rejects(f.service.requireCsrf([...f.sessions.rows.values()][0]!, ''), (error: unknown) => error instanceof IdentityApplicationError && error.code === 'CSRF_INVALID')
})

test('common protected-route guard inherits actor and CSRF outcomes before a domain handler', async (t) => {
  const f = await appFixture(); t.after(() => f.app.close())
  let mutations = 0
  f.app.get('/protected-read', { preHandler: createAuthGuard() }, async () => ({ ok: true }))
  f.app.post('/protected-write', { preHandler: createAuthGuard() }, async () => { mutations += 1; return { ok: true } })
  f.app.post('/csrf-with-auth', { preHandler: [createAuthGuard(), createCsrfGuard()] }, async () => ({ ok: true }))
  f.app.post('/csrf-without-auth', { preHandler: createCsrfGuard() }, async () => ({ ok: true }))
  const auth = await loginAndCallback(f)
  assert.equal((await f.app.inject({ method: 'GET', url: '/protected-read', headers: { cookie: auth.cookie } })).statusCode, 200)
  assert.equal((await f.app.inject({ method: 'POST', url: '/protected-write', headers: { cookie: auth.cookie } })).statusCode, 403)
  assert.equal(mutations, 0)
  assert.equal((await f.app.inject({ method: 'POST', url: '/protected-write', headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrf } })).statusCode, 200)
  assert.equal(mutations, 1)
  assert.equal((await f.app.inject({ method: 'POST', url: '/csrf-with-auth', headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrf } })).statusCode, 200)
  assert.equal((await f.app.inject({ method: 'POST', url: '/csrf-without-auth', headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrf } })).statusCode, 200)
  assert.equal((await f.app.inject({ method: 'POST', url: '/csrf-without-auth', headers: { cookie: auth.cookie } })).statusCode, 403)
})

test('Central IAM adapter discovers endpoints, emits full PKCE request and verifies RS256 claims', async () => {
  const issuer = 'https://iam.example.test'
  const now = Date.parse('2026-07-20T00:00:00.000Z')
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' }
  let discoveryAttempts = 0
  let tokenBody = ''
  const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    if (url.pathname === '/.well-known/openid-configuration') {
      discoveryAttempts += 1
      if (discoveryAttempts < 3) return new Response('{}', { status: 503 })
      return jsonResponse({ issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks` })
    }
    if (url.pathname === '/jwks') return jsonResponse({ keys: [publicJwk] })
    if (url.pathname === '/token') {
      tokenBody = String(init?.body ?? '')
      return jsonResponse({ id_token: signedJwt(privateKey, {
        iss: issuer, aud: 'api-lab', sub: 'actor-1', name: 'Actor One', nonce: 'nonce-1',
        amr: ['mfa'], acr: 'urn:aal2', exp: now / 1_000 + 3_600,
      }) })
    }
    if (url.pathname === '/status/actor-1') return jsonResponse({ status: 'ACTIVE' })
    return new Response('{}', { status: 404 })
  }
  const waits: number[] = []
  const adapter = new HttpCentralIamAdapter({
    issuer, clientId: 'client-1', redirectUri: 'https://app.example.test/callback', audience: 'api-lab',
    loginTimeoutMs: 5_000, loginRetryMax: 3, statusTimeoutMs: 2_000,
  }, fetcher as typeof fetch, async (ms: number) => { waits.push(ms) }, () => now)
  const authorize = new URL(await adapter.authorizationUrl({ state: 'state-1', nonce: 'nonce-1', codeChallenge: 'challenge-1' }))
  assert.equal(authorize.searchParams.get('response_type'), 'code')
  assert.equal(authorize.searchParams.get('client_id'), 'client-1')
  assert.equal(authorize.searchParams.get('redirect_uri'), 'https://app.example.test/callback')
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256')
  assert.deepEqual(waits, [20, 41]); assert.equal(discoveryAttempts, 3)
  const identity = await adapter.exchangeCode({ code: 'code-1', pkceVerifier: 'verifier-1' })
  assert.equal(identity.actor.id, 'actor-1'); assert.equal(identity.nonce, 'nonce-1')
  const form = new URLSearchParams(tokenBody)
  assert.equal(form.get('grant_type'), 'authorization_code'); assert.equal(form.get('code_verifier'), 'verifier-1')
  assert.equal(await adapter.subjectStatus('actor-1'), 'ACTIVE')
})

test('NFR-010 identity configuration maps exact values and rejects unsafe boundaries', () => {
  assert.throws(() => resolveIdentityRuntimeConfig({}), /OIDC_STATE_KEY_ID/)
  const config = resolveIdentityRuntimeConfig({
    CENTRAL_IAM_ISSUER: 'https://iam.example.test', OIDC_CLIENT_ID: 'client',
    OIDC_REDIRECT_URI: 'https://app.example.test/callback', OIDC_AUDIENCE: 'audience',
    OIDC_LOGIN_STATE_TTL_MINUTES: '10', SESSION_IDLE_TIMEOUT_MINUTES: '15',
    SESSION_ACTIVITY_WRITE_MIN_SECONDS: '60', IAM_LOGIN_TIMEOUT_MS: '5000', IAM_LOGIN_RETRY_MAX: '3', IAM_STATUS_TIMEOUT_MS: '2000',
    IAM_POSITIVE_STATUS_CACHE_SECONDS: '0',
    OIDC_STATE_KEY_ID: 'secret-ref://oidc-state', SESSION_CSRF_KEY_ID: 'secret-ref://session-csrf',
  })
  assert.equal(config.oidcLoginStateTtlMs, 600_000)
  assert.equal(config.sessionIdleTimeoutMs, 900_000)
  assert.equal(config.sessionActivityWriteMinMs, 60_000)
  assert.equal(config.iamLoginTimeoutMs, 5_000)
  assert.equal(config.iamLoginRetryMax, 3)
  assert.equal(config.iamStatusTimeoutMs, 2_000)
  assert.equal(config.iamPositiveStatusCacheSeconds, 0)
  const keys = { OIDC_STATE_KEY_ID: 'secret-ref://oidc-state', SESSION_CSRF_KEY_ID: 'secret-ref://session-csrf' }
  const canonical = {
    ...keys,
    OIDC_LOGIN_STATE_TTL_MINUTES: '10', SESSION_IDLE_TIMEOUT_MINUTES: '15',
    SESSION_ACTIVITY_WRITE_MIN_SECONDS: '60', IAM_LOGIN_TIMEOUT_MS: '5000',
    IAM_LOGIN_RETRY_MAX: '3', IAM_STATUS_TIMEOUT_MS: '2000', IAM_POSITIVE_STATUS_CACHE_SECONDS: '0',
  }
  for (const name of [
    'OIDC_LOGIN_STATE_TTL_MINUTES', 'SESSION_IDLE_TIMEOUT_MINUTES', 'SESSION_ACTIVITY_WRITE_MIN_SECONDS',
    'IAM_LOGIN_TIMEOUT_MS', 'IAM_LOGIN_RETRY_MAX', 'IAM_STATUS_TIMEOUT_MS', 'IAM_POSITIVE_STATUS_CACHE_SECONDS',
  ]) {
    const missing = { ...canonical }; delete missing[name as keyof typeof missing]
    assert.throws(() => resolveIdentityRuntimeConfig(missing), /must equal/)
  }
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, OIDC_LOGIN_STATE_TTL_MINUTES: '0' }), /must equal 10/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, SESSION_IDLE_TIMEOUT_MINUTES: '14' }), /must equal 15/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, SESSION_ACTIVITY_WRITE_MIN_SECONDS: '59' }), /must equal 60/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, IAM_LOGIN_TIMEOUT_MS: '4999' }), /must equal 5000/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, IAM_LOGIN_RETRY_MAX: '4' }), /must equal 3/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, IAM_STATUS_TIMEOUT_MS: '1999' }), /must equal 2000/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, IAM_POSITIVE_STATUS_CACHE_SECONDS: '1' }), /must equal 0/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, IAM_LOGIN_TIMEOUT_MS: 'not-a-number' }), /must equal 5000/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, IAM_LOGIN_TIMEOUT_MS: '5000.5' }), /must equal 5000/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, OIDC_STATE_KEY_ID: '' }), /Secret Manager reference/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, OIDC_STATE_KEY_ID: 'raw-key-material' }), /Secret Manager reference/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, SESSION_CSRF_KEY_ID: undefined }), /SESSION_CSRF_KEY_ID/)
  assert.throws(() => resolveIdentityRuntimeConfig({ ...canonical, SESSION_CSRF_KEY_ID: 'secret-ref://oidc-state' }), /distinct/)
})

test('Central IAM adapter rejects invalid discovery, JWKS and ID-token decision rows', async () => {
  const issuer = 'https://iam.example.test'
  const now = Date.parse('2026-07-20T00:00:00.000Z')
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const goodKey = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' }
  const goodClaims = { iss: issuer, aud: 'api-lab', sub: 'actor-1', name: 'Actor', nonce: 'nonce', amr: ['mfa'], acr: 'aal2', exp: now / 1_000 + 60 }

  const cases: Array<[string, { discovery?: Record<string, unknown>; jwks?: unknown; token?: string }]> = [
    ['issuer mismatch', { discovery: { issuer: 'https://other.test' } }],
    ['invalid jwks', { jwks: { keys: 'bad' } }],
    ['malformed token', { token: 'bad' }],
    ['unsupported algorithm', { token: signedJwt(privateKey, goodClaims, { alg: 'HS256', typ: 'JWT', kid: 'k1' }) }],
    ['missing key id', { token: signedJwt(privateKey, goodClaims, { alg: 'RS256', typ: 'JWT' }) }],
    ['unknown key', { token: signedJwt(privateKey, goodClaims, { alg: 'RS256', typ: 'JWT', kid: 'other' }) }],
    ['issuer claim mismatch', { token: signedJwt(privateKey, { ...goodClaims, iss: 'https://other.test' }) }],
    ['audience mismatch', { token: signedJwt(privateKey, { ...goodClaims, aud: 'other' }) }],
    ['expired', { token: signedJwt(privateKey, { ...goodClaims, exp: now / 1_000 }) }],
    ['missing subject', { token: signedJwt(privateKey, { ...goodClaims, sub: '' }) }],
    ['missing assurance', { token: signedJwt(privateKey, { ...goodClaims, acr: '' }) }],
    ['missing nonce', { token: signedJwt(privateKey, { ...goodClaims, nonce: '' }) }],
  ]
  for (const [name, overrides] of cases) {
    const discovery = {
      issuer,
      authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks`,
      ...overrides.discovery,
    }
    const token = overrides.token ?? signedJwt(privateKey, goodClaims)
    const fetcher = async (input: string | URL | Request) => {
      const path = new URL(String(input)).pathname
      if (path.includes('openid-configuration')) return jsonResponse(discovery)
      if (path === '/jwks') return jsonResponse(overrides.jwks ?? { keys: [goodKey] })
      if (path === '/token') return jsonResponse({ id_token: token })
      return jsonResponse({ status: 'ACTIVE' })
    }
    const adapter = new HttpCentralIamAdapter({ issuer, clientId: 'client', redirectUri: 'https://app.test/cb', audience: 'api-lab', loginTimeoutMs: 5_000, loginRetryMax: 3, statusTimeoutMs: 2_000 }, fetcher as typeof fetch, async () => undefined, () => now)
    if (name === 'issuer mismatch') await assert.rejects(adapter.authorizationUrl({ state: 's', nonce: 'n', codeChallenge: 'c' }))
    else await assert.rejects(adapter.exchangeCode({ code: 'code', pkceVerifier: 'verifier' }), () => true, name)
  }
})

test('Central IAM protected status performs one uncached request per authorization', async () => {
  const issuer = 'https://iam.example.test'
  let now = 1_000
  let statusCalls = 0
  let discoveryCalls = 0
  let status = 'ACTIVE'
  const fetcher = async (input: string | URL | Request) => {
    const path = new URL(String(input)).pathname
    if (path.includes('openid-configuration')) {
      discoveryCalls += 1
      return jsonResponse({ issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks` })
    }
    statusCalls += 1
    return jsonResponse({ status })
  }
  const adapter = new HttpCentralIamAdapter({ issuer, clientId: 'client', redirectUri: 'https://app.test/cb', audience: 'api-lab', loginTimeoutMs: 5_000, loginRetryMax: 3, statusTimeoutMs: 2_000 }, fetcher as typeof fetch, async () => undefined, () => now)
  assert.equal(await adapter.subjectStatus('actor'), 'ACTIVE')
  assert.equal(await adapter.subjectStatus('actor'), 'ACTIVE'); assert.equal(statusCalls, 2)
  now += 10_001; status = 'unexpected'
  assert.equal(await adapter.subjectStatus('actor'), 'UNCERTAIN'); assert.equal(statusCalls, 3)
  assert.equal(discoveryCalls, 0)
})

test('Central IAM adapter covers alternate valid claims and bounded retry exhaustion', async () => {
  const issuer = 'https://iam.example.test'
  const now = Date.parse('2026-07-20T00:00:00.000Z')
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const token = signedJwt(privateKey, {
    iss: issuer, aud: ['other', 'api-lab'], sub: 'actor-2', name: '', email: 'actor@example.test',
    nonce: 'nonce-2', amr: 'not-an-array', acr: 'aal2', exp: now / 1_000 + 60,
  })
  const fetcher = async (input: string | URL | Request) => {
    const path = new URL(String(input)).pathname
    if (path.includes('openid-configuration')) return jsonResponse({ issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks` })
    if (path === '/jwks') return jsonResponse({ keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'k1' }] })
    if (path === '/token') return jsonResponse({ id_token: token })
    return jsonResponse({ status: 'INACTIVE' })
  }
  const adapter = new HttpCentralIamAdapter({ issuer, clientId: 'client', redirectUri: 'https://app.test/cb', audience: 'api-lab', loginTimeoutMs: 5_000, loginRetryMax: 3, statusTimeoutMs: 2_000 }, fetcher as typeof fetch, async () => undefined, () => now)
  const identity = await adapter.exchangeCode({ code: 'code', pkceVerifier: 'verifier' })
  assert.equal(identity.actor.displayName, 'actor-2'); assert.equal(identity.actor.email, 'actor@example.test')
  assert.deepEqual(identity.mfaAssurance.amr, []); assert.equal(await adapter.subjectStatus('actor-2'), 'INACTIVE')

  let attempts = 0
  const waits: number[] = []
  const unavailable = new HttpCentralIamAdapter({ issuer, clientId: 'client', redirectUri: 'https://app.test/cb', audience: 'api-lab', loginTimeoutMs: 5_000, loginRetryMax: 3, statusTimeoutMs: 2_000 }, async () => {
    attempts += 1
    return new Response('{}', { status: 503 })
  }, async (ms: number) => { waits.push(ms) }, () => now)
  await assert.rejects(unavailable.authorizationUrl({ state: 's', nonce: 'n', codeChallenge: 'c' }))
  assert.equal(attempts, 4); assert.deepEqual(waits, [20, 41, 82])

  let budgetNow = 0
  let budgetAttempts = 0
  const budgeted = new HttpCentralIamAdapter({ issuer, clientId: 'client', redirectUri: 'https://app.test/cb', audience: 'api-lab', loginTimeoutMs: 5_000, loginRetryMax: 3, statusTimeoutMs: 2_000 }, async () => {
    budgetAttempts += 1
    budgetNow += 3_000
    return new Response('{}', { status: 503 })
  }, async (ms: number) => { budgetNow += ms }, () => budgetNow)
  await assert.rejects(budgeted.authorizationUrl({ state: 's', nonce: 'n', codeChallenge: 'c' }))
  assert.equal(budgetAttempts, 2)
  assert.ok(budgetNow >= 5_000)
})

function hex(value: Uint8Array) { return Buffer.from(value).toString('hex') }
function jsonResponse(value: unknown) { return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } }) }
function signedJwt(privateKey: KeyObject, payload: Record<string, unknown>, protectedHeader: Record<string, unknown> = { alg: 'RS256', typ: 'JWT', kid: 'k1' }) {
  const header = Buffer.from(JSON.stringify(protectedHeader)).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.${sign('RSA-SHA256', Buffer.from(`${header}.${body}`), privateKey).toString('base64url')}`
}
