import { createHash } from 'node:crypto'

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import type { AuditSink } from '../../../platform/audit/index.js'
import { ERROR_METADATA, type ErrorCode } from '../../../shared/errors/index.js'
import {
  IdentityApplicationError,
  type ActorProjection,
  type IdentityService,
} from '../application/index.js'
import {
  IdentityKeyProviderUnavailableError,
  IdentitySessionStoreUnavailableError,
  type AuthSessionRecord,
} from '../domain/index.js'
import { IdentityRateLimiter } from './identity-rate-limiter.js'

// Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 02B Identity delivery
// Contract: API-017–020, ARCH-COMP-001 | Pack: v1.7.21-oidc-session-error-contracts
export const SESSION_COOKIE_NAME = 'api_lab_session'
export const CSRF_HEADER_NAME = 'x-csrf-token'

export type IdentityPluginContext = {
  service: IdentityService
  secureCookies: boolean
  audit?: AuditSink
  loginLimiter?: IdentityRateLimiter
  callbackLimiter?: IdentityRateLimiter
  logoutLimiter?: IdentityRateLimiter
  sessionLimiter?: IdentityRateLimiter
  now?: () => Date
}

declare module 'fastify' {
  interface FastifyInstance {
    identityService: IdentityService
  }
  interface FastifyRequest {
    authActor?: ActorProjection
    authSession?: AuthSessionRecord
    identityErrorCode?: ErrorCode
  }
}

export async function registerIdentityPlugin(app: FastifyInstance, context: IdentityPluginContext) {
  if (!app.hasDecorator('identityService')) app.decorate('identityService', context.service)
  const loginLimiter = context.loginLimiter ?? new IdentityRateLimiter(30, 5)
  const callbackLimiter = context.callbackLimiter ?? new IdentityRateLimiter(30, 5)
  const logoutLimiter = context.logoutLimiter ?? new IdentityRateLimiter(30, 5)
  const sessionLimiter = context.sessionLimiter ?? new IdentityRateLimiter(120, 20)

  app.post('/api/v1/auth/login', async (request, reply) => {
    setOidcNavigationNoStore(reply)
    try {
      enforceRateLimit(loginLimiter, `login:${request.ip}`)
      const body = asRecord(request.body)
      const result = await context.service.beginLogin(text(body.returnTo) || '/')
      await appendAudit(context.audit, request, 'IDENTITY_LOGIN_INITIATED', null, { outcome: 'authorization_url_issued' }, context.now)
      return { authorizationUrl: result.location }
    } catch (error) {
      return sendIdentityError(request, reply, error)
    }
  })

  app.post('/api/v1/auth/callback', async (request, reply) => {
    setOidcNavigationNoStore(reply)
    try {
      const body = asRecord(request.body)
      enforceRateLimit(callbackLimiter, `callback:${request.ip}:${digest(text(body.state))}`)
      const result = await context.service.completeCallback(text(body.code), text(body.state))
      reply.header('Set-Cookie', sessionCookie(result.sessionSelector, context.secureCookies))
      await appendAudit(context.audit, request, 'IDENTITY_CALLBACK_COMPLETED', null, { outcome: 'session_created' }, context.now)
      return { returnTo: result.returnTo }
    } catch (error) {
      return sendIdentityError(request, reply, error)
    }
  })

  app.post('/api/v1/auth/logout', async (request, reply) => {
    try {
      const selector = readSessionCookie(request)
      enforceRateLimit(logoutLimiter, `logout:${digest(selector || request.ip)}`)
      const body = asRecord(request.body)
      if (body.allSessions !== undefined && typeof body.allSessions !== 'boolean') {
        throw new IdentityApplicationError('INVALID_REQUEST')
      }
      await context.service.logout(selector, text(request.headers[CSRF_HEADER_NAME]), body.allSessions === true)
      reply.header('Set-Cookie', clearSessionCookie(context.secureCookies))
      await appendAudit(context.audit, request, 'IDENTITY_LOGOUT_COMPLETED', request.authActor?.id ?? null, { outcome: 'invalidated' }, context.now)
      return { loggedOut: true }
    } catch (error) {
      return sendIdentityError(request, reply, error)
    }
  })

  app.get('/api/v1/auth/session', async (request, reply) => {
    try {
      const selector = readSessionCookie(request)
      enforceRateLimit(sessionLimiter, `session:${digest(selector || request.ip)}`)
      const result = await context.service.session(selector, text(request.headers['if-none-match']))
      reply.header('ETag', result.etag)
      reply.header('Cache-Control', 'private, no-cache')
      if (result.status === 304) return reply.code(304).send()
      return {
        actor: result.actor,
        expiresAt: result.expiresAt.toISOString(),
        lastActivityAt: result.lastActivityAt.toISOString(),
        idleExpiresAt: result.idleExpiresAt.toISOString(),
        csrfToken: result.csrfToken,
      }
    } catch (error) {
      return sendIdentityError(request, reply, error)
    }
  })
}

function setOidcNavigationNoStore(reply: FastifyReply): void {
  // API-017/018 are public pre-session POST operations; every outcome remains
  // non-cacheable because it carries one-time OIDC state or session material.
  reply.header('Cache-Control', 'no-store, private')
  reply.header('Pragma', 'no-cache')
}

export function readSessionCookie(request: FastifyRequest): string {
  const cookie = request.headers.cookie ?? ''
  for (const part of cookie.split(';')) {
    const [name, ...rawValue] = part.trim().split('=')
    if (name === SESSION_COOKIE_NAME) return decodeURIComponent(rawValue.join('='))
  }
  return ''
}

export async function sendIdentityError(request: FastifyRequest, reply: FastifyReply, error: unknown) {
  const code = identityErrorCode(error)
  const metadata = ERROR_METADATA[code]
  request.identityErrorCode = code
  const applicationDetails = error instanceof IdentityApplicationError ? error.details : {}
  const retryAfter = code === 'RATE_LIMIT_EXCEEDED' && typeof applicationDetails.retry_after_seconds === 'number'
    ? applicationDetails.retry_after_seconds
    : metadata.retry_after_seconds
  if (retryAfter !== null) reply.header('Retry-After', String(retryAfter))
  const details = {
    ...applicationDetails,
    ...(retryAfter === null ? {} : { retry_after_seconds: retryAfter }),
  }
  const errorBody: Record<string, unknown> = {
    code,
    message: identityMessage(code),
    request_id: request.id,
    trace_id: request.traceId || request.id,
  }
  if (Object.keys(details).length > 0) errorBody.details = details
  return reply.code(metadata.http).send({
    error: errorBody,
  })
}

function identityErrorCode(error: unknown): ErrorCode {
  if (error instanceof IdentityApplicationError) return error.code
  if (error instanceof IdentityKeyProviderUnavailableError) return 'KEY_PROVIDER_UNAVAILABLE'
  if (error instanceof IdentitySessionStoreUnavailableError) return 'SESSION_STORE_UNAVAILABLE'
  return 'INTERNAL_ERROR'
}

function sessionCookie(value: string, secure: boolean): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
}
function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
}
function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
function digest(value: string): string { return createHash('sha256').update(value).digest('hex') }
function enforceRateLimit(limiter: IdentityRateLimiter, key: string): void {
  const decision = limiter.consume(key)
  if (!decision.allowed) throw new IdentityApplicationError('RATE_LIMIT_EXCEEDED', { retry_after_seconds: decision.retryAfterSeconds })
}
async function appendAudit(
  sink: AuditSink | undefined,
  request: FastifyRequest,
  type: string,
  actorId: string | null,
  metadata: Record<string, unknown>,
  now: (() => Date) | undefined,
): Promise<void> {
  if (!sink) return
  try {
    await sink.append({ type, occurredAt: (now ?? (() => new Date()))(), actorId, requestId: request.id, traceId: request.traceId || request.id, metadata })
  } catch {
    // Audit/exporter degradation is isolated from the already committed identity result (NFR-006).
    request.log.warn({ event: 'IDENTITY_AUDIT_APPEND_FAILED' }, 'Identity audit append failed')
  }
}
function identityMessage(code: ErrorCode): string {
  const messages: Partial<Record<ErrorCode, string>> = {
    INVALID_RETURN_URL: 'Đường dẫn quay lại không hợp lệ.',
    OIDC_CALLBACK_INVALID: 'Phản hồi đăng nhập không hợp lệ.',
    OIDC_TOKEN_REJECTED: 'Thông tin xác thực đã bị từ chối.',
    CALLBACK_REPLAYED: 'Phản hồi đăng nhập đã được sử dụng.',
    SESSION_STATE_NOT_FOUND: 'Không tìm thấy trạng thái đăng nhập hợp lệ.',
    AUTH_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.',
    CSRF_INVALID: 'Mã bảo vệ yêu cầu không hợp lệ.',
    SESSION_NOT_FOUND: 'Không tìm thấy phiên đăng nhập.',
    GLOBAL_LOGOUT_UNSUPPORTED: 'Chưa hỗ trợ đăng xuất khỏi tất cả phiên.',
    RATE_LIMIT_EXCEEDED: 'Có quá nhiều yêu cầu. Vui lòng thử lại sau.',
    SERVICE_UNAVAILABLE: 'Dịch vụ xác thực tạm thời không khả dụng.',
    KEY_PROVIDER_UNAVAILABLE: 'Dịch vụ khóa mã hóa tạm thời không khả dụng.',
    SESSION_STORE_UNAVAILABLE: 'Kho phiên đăng nhập tạm thời không khả dụng.',
    INTERNAL_ERROR: 'Không thể xử lý yêu cầu.',
  }
  return messages[code] ?? 'Không thể xử lý yêu cầu.'
}
