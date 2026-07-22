// Sprint: v1 | Feature: NFR-006 | Task Group: 03B Runtime composition
// Contract: PR-007 bounded redacted frontend envelopes | Pack: v1.7.21-oidc-session-error-contracts
export const FRONTEND_ERROR_QUEUE_MAX = 100
export const FRONTEND_ERROR_QUEUE_TTL_MS = 24 * 60 * 60 * 1_000
export const SENTRY_BREADCRUMB_LIMIT = 10
export const SENTRY_SEND_DEFAULT_PII = false

export type FrontendEnvelope = {
  createdAt: number
  category: 'error' | 'navigation' | 'network' | 'performance'
  message: string
  context: Record<string, unknown>
  breadcrumbs: Array<Record<string, unknown>>
}

export class BoundedFrontendEnvelopeQueue {
  private readonly items: FrontendEnvelope[] = []
  dropped = 0

  enqueue(envelope: FrontendEnvelope, now = Date.now()): void {
    this.expire(now)
    if (this.items.length >= FRONTEND_ERROR_QUEUE_MAX) { this.dropped += 1; return }
    this.items.push({
      ...envelope,
      message: sanitize(envelope.message),
      context: redact(envelope.context) as Record<string, unknown>,
      breadcrumbs: envelope.breadcrumbs.slice(-SENTRY_BREADCRUMB_LIMIT).map((item) => redact(item) as Record<string, unknown>),
    })
  }

  drain(now = Date.now()): FrontendEnvelope[] {
    this.expire(now)
    return this.items.splice(0)
  }

  private expire(now: number): void {
    while (this.items[0] && now - this.items[0].createdAt >= FRONTEND_ERROR_QUEUE_TTL_MS) {
      this.items.shift()
      this.dropped += 1
    }
  }
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    /(email|phone|authorization|cookie|token|body|credential|password|secret)/i.test(key) ? '[REDACTED]' : redact(item),
  ]))
}
function sanitize(value: string): string {
  return value.replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]')
}
