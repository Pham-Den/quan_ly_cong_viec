import { randomBytes, randomUUID } from 'node:crypto'

import cors from '@fastify/cors'
import Fastify from 'fastify'

import { registerApiLabRoutes } from './api-lab/routes.js'
import { registerBranchRoutes } from './branches/routes.js'
import { createPrismaClient, type AppPrismaClient } from './db.js'
import type { AppEnv } from './env.js'
import {
  Aes256GcmIdentityKeyAdapter,
  HttpCentralIamAdapter,
  IdentityService,
  IdentitySessionStoreUnavailableError,
  PrismaAuthSessionRepository,
  PrismaOidcLoginStateRepository,
  registerIdentityPlugin,
  resolveIdentityRuntimeConfig,
  type AuthSessionRepository,
  type CentralIamPort,
  type IdentityKeyResolver,
  type OidcLoginStateRepository,
} from './modules/identity/index.js'
import { registerPlanningRoutes } from './planning/routes.js'
import { InMemoryAuditSink, RedactingAuditSink, type AuditSink } from './platform/audit/index.js'
import { IsolatedTelemetry, boundedRequestId, registerObservability, type Telemetry } from './platform/observability/index.js'
import { registerSystemManagerRoutes } from './system-manager/routes.js'
import { registerTimelineRoutes } from './timeline/routes.js'
import { registerVisibilityRoutes } from './visibility/routes.js'
import { registerWorkspaceRoutes } from './workspace/routes.js'
import { registerWorkflowRoutes } from './workflow/routes.js'

// Sprint: v1 | Feature: NFR-004/NFR-006/NFR-010 | Task Group: 03B Runtime composition
// Contract: ARCH-COMP-001/007, PR-001/006/008 | Pack: v1.7.21-oidc-session-error-contracts
export type ApplicationOverrides = {
  prisma?: AppPrismaClient
  iam?: CentralIamPort
  keyResolver?: IdentityKeyResolver
  telemetry?: Telemetry
  audit?: AuditSink
  storeGate?: { available: boolean }
  secureCookies?: boolean
  identityRuntimeEnv?: NodeJS.ProcessEnv
}

export function buildApplication(env: AppEnv, overrides: ApplicationOverrides = {}) {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    genReqId: (request) => boundedRequestId(request.headers['x-request-id']),
  })
  const identityConfig = resolveIdentityRuntimeConfig(overrides.identityRuntimeEnv ?? process.env)
  const prisma = overrides.prisma ?? createPrismaClient(env.databaseUrl)
  const storeGate = overrides.storeGate ?? { available: true }
  const loginStates = gatedLoginStates(new PrismaOidcLoginStateRepository(prisma, identityConfig.oidcLoginStateTtlMs), storeGate)
  const sessions = gatedSessions(new PrismaAuthSessionRepository(
    prisma,
    identityConfig.sessionIdleTimeoutMs,
    identityConfig.sessionActivityWriteMinMs,
  ), storeGate)
  const iam = overrides.iam ?? new HttpCentralIamAdapter({
    issuer: identityConfig.issuer,
    clientId: identityConfig.clientId,
    redirectUri: identityConfig.redirectUri,
    audience: identityConfig.audience,
    loginTimeoutMs: identityConfig.iamLoginTimeoutMs,
    loginRetryMax: identityConfig.iamLoginRetryMax,
    statusTimeoutMs: identityConfig.iamStatusTimeoutMs,
  })
  const keyResolver = overrides.keyResolver ?? new HttpIdentityKeyResolver(runtimeUrl('KEY_PROVIDER_BASE_URL', 'http://key-provider-fake:4102'))
  const telemetry = overrides.telemetry ?? new IsolatedTelemetry({ export: async () => undefined })
  const audit = new RedactingAuditSink(overrides.audit ?? new InMemoryAuditSink())
  const identity = new IdentityService(
    loginStates,
    sessions,
    new Aes256GcmIdentityKeyAdapter(keyResolver),
    iam,
    { now: () => new Date() },
    { bytes: (length) => randomBytes(length), id: randomUUID },
    {
      oidcStateKeyId: identityConfig.oidcStateKeyId,
      sessionCsrfKeyId: identityConfig.sessionCsrfKeyId,
      oidcLoginStateTtlMs: identityConfig.oidcLoginStateTtlMs,
      sessionIdleTimeoutMs: identityConfig.sessionIdleTimeoutMs,
    },
  )

  registerObservability(app, telemetry, {
    service: 'quan-ly-cong-viec-api',
    environment: process.env.NODE_ENV ?? 'development',
  })
  app.register(cors, {
    origin: env.frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Request-ID', 'If-None-Match'],
    exposedHeaders: ['ETag', 'X-Request-ID', 'X-Trace-ID', 'Retry-After'],
  })

  app.addHook('onClose', async () => { await prisma.$disconnect() })
  app.get('/health', async () => ({ ok: true, service: 'quan-ly-cong-viec-api' }))
  app.get('/api/meta', async () => ({ app: 'quan_ly_cong_viec', apiVersion: '0.1.0' }))

  void registerIdentityPlugin(app, {
    service: identity,
    secureCookies: overrides.secureCookies ?? process.env.NODE_ENV !== 'test',
    audit,
  })

  if (process.env.FOUNDATION_TEST_MODE === 'true') {
    app.post('/__test__/foundation/store/:mode', async (request, reply) => {
      const mode = (request.params as { mode?: string }).mode
      if (mode !== 'up' && mode !== 'down') return reply.code(400).send({ ok: false })
      storeGate.available = mode === 'up'
      return { ok: true, available: storeGate.available }
    })
  }

  registerWorkspaceRoutes(app, { env, prisma })
  registerPlanningRoutes(app, { env, prisma })
  registerBranchRoutes(app, { env, prisma })
  registerTimelineRoutes(app, { env, prisma })
  registerVisibilityRoutes(app, { env, prisma })
  registerWorkflowRoutes(app, { env, prisma })
  registerApiLabRoutes(app, { env, prisma })
  registerSystemManagerRoutes(app, { env, prisma })
  return app
}

export class HttpIdentityKeyResolver implements IdentityKeyResolver {
  constructor(private readonly baseUrl: string) {}
  async resolve(keyId: string): Promise<Uint8Array> {
    const payload = await fetchJson(new URL(`/keys/${encodeURIComponent(keyId)}`, this.baseUrl))
    return Buffer.from(text(payload.keyBase64), 'base64')
  }
}

async function fetchJson(url: URL, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(2_000) })
  if (!response.ok) throw new Error(`Dependency returned HTTP ${response.status}.`)
  return record(await response.json())
}
function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {} }
function text(value: unknown): string { return typeof value === 'string' ? value : '' }
function runtimeUrl(name: string, fallback: string): string { return process.env[name] ?? fallback }

function gatedLoginStates(target: OidcLoginStateRepository, gate: { available: boolean }): OidcLoginStateRepository {
  return {
    create: (value) => gate.available ? target.create(value) : Promise.reject(new IdentitySessionStoreUnavailableError()),
    consume: (digest, now) => gate.available ? target.consume(digest, now) : Promise.reject(new IdentitySessionStoreUnavailableError()),
  }
}
function gatedSessions(target: AuthSessionRepository, gate: { available: boolean }): AuthSessionRepository {
  return {
    create: (value) => gate.available ? target.create(value) : Promise.reject(new IdentitySessionStoreUnavailableError()),
    resolve: (digest, now) => gate.available ? target.resolve(digest, now) : Promise.reject(new IdentitySessionStoreUnavailableError()),
    refreshActivity: (id, now) => gate.available ? target.refreshActivity(id, now) : Promise.reject(new IdentitySessionStoreUnavailableError()),
    invalidate: (id, reason, now) => gate.available ? target.invalidate(id, reason, now) : Promise.reject(new IdentitySessionStoreUnavailableError()),
  }
}
