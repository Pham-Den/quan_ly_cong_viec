import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import Fastify from 'fastify'

import { buildApplication, HttpIdentityKeyResolver } from '../../app.js'
import { RedactingAuditSink, type AuditFact } from '../../platform/audit/index.js'
import {
  IsolatedTelemetry,
  boundedRequestId,
  registerObservability,
  type TelemetryRecord,
} from '../../platform/observability/index.js'

// Sprint: v1 | TC-061/064/070/073 | Task Group: 03B Runtime composition
// Contract: ARCH-COMP-007, PR-006/008 | Pack: v1.7.21-oidc-session-error-contracts
test('request correlation accepts only one bounded identifier and echoes authoritative IDs', async (t) => {
  const exported: TelemetryRecord[] = []
  const telemetry = new IsolatedTelemetry({ export: async (record) => { exported.push(record) } })
  const app = Fastify({ logger: false, genReqId: (request) => boundedRequestId(request.headers['x-request-id'], () => 'generated-id') })
  t.after(() => app.close())
  registerObservability(app, telemetry, { service: 'test-api', environment: 'test' })
  app.get('/ok', async () => ({ ok: true }))

  const accepted = await app.inject({ method: 'GET', url: '/ok', headers: { 'x-request-id': 'client_123' } })
  assert.equal(accepted.headers['x-request-id'], 'client_123')
  assert.match(String(accepted.headers['x-trace-id']), /^[a-f0-9]{32}$/)
  const replaced = await app.inject({ method: 'GET', url: '/ok', headers: { 'x-request-id': 'invalid value' } })
  assert.equal(replaced.headers['x-request-id'], 'generated-id')
  assert.equal(exported.length, 2)
  assert.deepEqual(Object.keys(exported[0]!).sort(), [
    'duration_ms', 'environment', 'error_code', 'error_message', 'http_status', 'level',
    'message', 'operation', 'request_id', 'service', 'timestamp', 'trace_id', 'user_id',
  ])
})

test('exporter failure buffers at 100, drops the 101st and never rolls back the business response', async (t) => {
  let available = false
  const delivered: TelemetryRecord[] = []
  const telemetry = new IsolatedTelemetry({
    export: async (record) => {
      if (!available) throw new Error('exporter unavailable')
      delivered.push(record)
    },
  })
  const app = Fastify({ logger: false })
  t.after(() => app.close())
  registerObservability(app, telemetry, { service: 'test-api', environment: 'test' })
  let committed = 0
  app.post('/business', async () => { committed += 1; return { committed } })
  const response = await app.inject({ method: 'POST', url: '/business' })
  assert.equal(response.statusCode, 200)
  assert.equal(response.json().committed, 1)
  assert.equal(telemetry.buffered, 1)

  const record = sampleRecord()
  for (let index = 1; index < 101; index += 1) await telemetry.emit(record)
  assert.equal(telemetry.buffered, 100)
  assert.equal(telemetry.dropped, 1)
  available = true
  await telemetry.emit(record)
  assert.equal(telemetry.buffered, 0)
  assert.equal(delivered.length, 101)
})

test('audit and telemetry redact restricted fields before an adapter receives them', async () => {
  const facts: AuditFact[] = []
  const sink = new RedactingAuditSink({ append: async (fact) => { facts.push(fact) } })
  await sink.append({
    type: 'IDENTITY_TEST', occurredAt: new Date(), actorId: 'actor-17', requestId: 'req', traceId: 'trace',
    metadata: { token: 'synthetic-value', nested: { cookie: 'synthetic-cookie', safe: 'visible' }, list: [{ password: 'synthetic-password' }] },
  })
  assert.deepEqual(facts[0]!.metadata, {
    token: '[REDACTED]', nested: { cookie: '[REDACTED]', safe: 'visible' }, list: [{ password: '[REDACTED]' }],
  })

  const records: TelemetryRecord[] = []
  const telemetry = new IsolatedTelemetry({ export: async (record) => { records.push(record) } })
  await telemetry.emit({ ...sampleRecord(), user_id: 'actor-17', message: 'token=synthetic', error_message: 'Bearer synthetic.token.value' })
  assert.equal(records[0]!.user_id, 'masked:ac***')
  assert.equal(records[0]!.message, 'token=[REDACTED]')
  assert.equal(records[0]!.error_message, 'Bearer [REDACTED]')
})

test('[PBT-like] request ID boundary accepts 1/64 and rejects empty/65/invalid characters', () => {
  const fallback = () => 'replacement'
  assert.equal(boundedRequestId('a', fallback), 'a')
  assert.equal(boundedRequestId('A'.repeat(64), fallback), 'A'.repeat(64))
  assert.equal(boundedRequestId('', fallback), 'replacement')
  assert.equal(boundedRequestId('A'.repeat(65), fallback), 'replacement')
  assert.equal(boundedRequestId('bad/value', fallback), 'replacement')
  assert.equal(boundedRequestId(['duplicate'], fallback), 'replacement')
})

test('runtime telemetry attributes canonical error code and composed audit redacts before append', async (t) => {
  const records: TelemetryRecord[] = []
  const telemetry = new IsolatedTelemetry({ export: async (record) => { records.push(record) } })
  const app = Fastify({ logger: false }); t.after(() => app.close())
  registerObservability(app, telemetry, { service: 'test-api', environment: 'test' })
  app.get('/failed', async (request, reply) => {
    request.identityErrorCode = 'SERVICE_UNAVAILABLE'
    return reply.code(503).send({ error: { code: 'SERVICE_UNAVAILABLE' } })
  })
  await app.inject({ method: 'GET', url: '/failed' })
  assert.equal(records[0]!.error_code, 'SERVICE_UNAVAILABLE')

  const facts: AuditFact[] = []
  const audit = new RedactingAuditSink({ append: async (fact) => { facts.push(fact) } })
  await audit.append({
    type: 'IDENTITY_LOGOUT_COMPLETED', occurredAt: new Date('2026-07-20T00:00:00.000Z'),
    actorId: 'actor-1', requestId: 'req', traceId: 'trace', metadata: { outcome: 'invalidated', token: 'synthetic' },
  })
  assert.deepEqual(facts[0]!.metadata, { outcome: 'invalidated', token: '[REDACTED]' })
})

test('live composition exposes health/meta, isolates dormant legacy auth and gates the foundation store', async (t) => {
  const priorFoundationMode = process.env.FOUNDATION_TEST_MODE
  const priorNodeEnv = process.env.NODE_ENV
  process.env.FOUNDATION_TEST_MODE = 'true'
  process.env.NODE_ENV = 'test'
  let disconnected = 0
  const prisma = { $disconnect: async () => { disconnected += 1 } }
  const app = buildApplication({
    host: '127.0.0.1', port: 4000, frontendOrigin: 'http://localhost:5173', databaseUrl: 'mysql://synthetic',
    jwtAccessSecret: 'dormant-not-composed', jwtRefreshSecret: 'dormant-not-composed', accessTokenMinutes: 15, refreshTokenDays: 30,
  }, {
    prisma: prisma as never,
    iam: {
      authorizationUrl: async () => 'https://iam.example.test/authorize',
      exchangeCode: async () => { throw new Error('not used') },
      subjectStatus: async () => 'ACTIVE',
    },
    keyResolver: { resolve: async () => Buffer.alloc(32, 7) },
    secureCookies: false,
    identityRuntimeEnv: identityRuntimeEnv(),
  })
  t.after(async () => {
    await app.close()
    if (priorFoundationMode === undefined) delete process.env.FOUNDATION_TEST_MODE
    else process.env.FOUNDATION_TEST_MODE = priorFoundationMode
    if (priorNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = priorNodeEnv
  })
  await app.ready()

  assert.deepEqual((await app.inject({ method: 'GET', url: '/health' })).json(), { ok: true, service: 'quan-ly-cong-viec-api' })
  assert.equal((await app.inject({ method: 'GET', url: '/api/meta' })).statusCode, 200)
  assert.equal((await app.inject({ method: 'POST', url: '/__test__/foundation/store/invalid' })).statusCode, 400)
  assert.equal((await app.inject({ method: 'POST', url: '/__test__/foundation/store/down' })).statusCode, 200)
  const unavailable = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: {} })
  assert.equal(unavailable.statusCode, 503)
  assert.equal(unavailable.json().error.code, 'SESSION_STORE_UNAVAILABLE')
  assert.equal((await app.inject({ method: 'POST', url: '/__test__/foundation/store/up' })).statusCode, 200)
  assert.equal((await app.inject({ method: 'POST', url: '/api/auth/login' })).statusCode, 404)
  assert.equal(disconnected, 0)
})

test('composition source cannot import quarantined password/JWT route modules', async () => {
  const source = await readFile(new URL('../../app.ts', import.meta.url), 'utf8')
  for (const legacyModule of ['./auth/routes', './auth/password', './auth/tokens']) {
    assert.equal(source.includes(legacyModule), false, `${legacyModule} must remain outside runtime composition`)
  }
})

test('live key resolver decodes bounded dependency output and rejects unavailable/invalid payloads', async () => {
  const priorFetch = globalThis.fetch
  const resolver = new HttpIdentityKeyResolver('https://keys.example.test')
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ keyBase64: Buffer.alloc(32, 9).toString('base64') }), { status: 200 })
    assert.deepEqual(await resolver.resolve('session-key'), Buffer.alloc(32, 9))
    globalThis.fetch = async () => new Response('{}', { status: 503 })
    await assert.rejects(resolver.resolve('session-key'), /HTTP 503/)
    globalThis.fetch = async () => new Response(JSON.stringify({ keyBase64: null }), { status: 200 })
    assert.equal((await resolver.resolve('session-key')).byteLength, 0)
  } finally {
    globalThis.fetch = priorFetch
  }
})

test('production composition selects default IAM/key/cookie adapters without enabling test controls', async () => {
  const priorFoundationMode = process.env.FOUNDATION_TEST_MODE
  const priorNodeEnv = process.env.NODE_ENV
  const configuredIdentityEnv = identityRuntimeEnv()
  const priorIdentityEnv = Object.fromEntries(Object.keys(configuredIdentityEnv).map((name) => [name, process.env[name]]))
  delete process.env.FOUNDATION_TEST_MODE
  process.env.NODE_ENV = 'production'
  Object.assign(process.env, configuredIdentityEnv)
  const app = buildApplication({
    host: '127.0.0.1', port: 4000, frontendOrigin: 'https://app.example.test', databaseUrl: 'mysql://synthetic',
    jwtAccessSecret: 'dormant-not-composed', jwtRefreshSecret: 'dormant-not-composed', accessTokenMinutes: 15, refreshTokenDays: 30,
  }, { prisma: { $disconnect: async () => undefined } as never })
  try {
    await app.ready()
    assert.equal((await app.inject({ method: 'POST', url: '/__test__/foundation/store/down' })).statusCode, 404)
  } finally {
    await app.close()
    if (priorFoundationMode === undefined) delete process.env.FOUNDATION_TEST_MODE
    else process.env.FOUNDATION_TEST_MODE = priorFoundationMode
    if (priorNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = priorNodeEnv
    for (const [name, value] of Object.entries(priorIdentityEnv)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
})

function sampleRecord(): TelemetryRecord {
  return {
    timestamp: '2026-07-20T00:00:00.000Z', level: 'info', service: 'api', environment: 'test',
    trace_id: 'trace', request_id: 'request', user_id: null, operation: 'GET /test', message: 'done',
    duration_ms: 1, http_status: 200, error_code: null, error_message: null,
  }
}

function identityRuntimeEnv(): NodeJS.ProcessEnv {
  return {
    OIDC_LOGIN_STATE_TTL_MINUTES: '10',
    SESSION_IDLE_TIMEOUT_MINUTES: '15',
    SESSION_ACTIVITY_WRITE_MIN_SECONDS: '60',
    IAM_LOGIN_TIMEOUT_MS: '5000',
    IAM_LOGIN_RETRY_MAX: '3',
    IAM_STATUS_TIMEOUT_MS: '2000',
    IAM_POSITIVE_STATUS_CACHE_SECONDS: '0',
    OIDC_STATE_KEY_ID: 'secret-ref://oidc-state',
    SESSION_CSRF_KEY_ID: 'secret-ref://session-csrf',
  }
}
