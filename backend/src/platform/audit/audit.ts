// Sprint: v1 | Feature: NFR-006 | Task Group: 03B Runtime composition
// Contract: ARCH-COMP-007, PR-006 | Pack: v1.7.21-oidc-session-error-contracts
export type AuditFact = {
  type: string
  occurredAt: Date
  actorId: string | null
  requestId: string
  traceId: string
  metadata: Record<string, unknown>
}

export interface AuditSink {
  append(fact: AuditFact): Promise<void>
}

export class InMemoryAuditSink implements AuditSink {
  readonly facts: AuditFact[] = []

  async append(fact: AuditFact): Promise<void> {
    this.facts.push(fact)
  }
}

export function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    isRestrictedKey(key) ? '[REDACTED]' : redactAuditValue(item),
  ]))
}

export class RedactingAuditSink implements AuditSink {
  constructor(private readonly target: AuditSink) {}

  append(fact: AuditFact): Promise<void> {
    return this.target.append({ ...fact, metadata: redactAuditValue(fact.metadata) as Record<string, unknown> })
  }
}

function isRestrictedKey(key: string): boolean {
  return /(authorization|cookie|token|verifier|password|body|credential|secret)/i.test(key)
}
