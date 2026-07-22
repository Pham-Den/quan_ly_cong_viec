import type { ResponseCorrelation } from './client.types'

let latest: ResponseCorrelation | null = null

// Sprint: v1 | Feature: NFR-006 | Task Group: 03B Runtime composition
// Contract: PR-007/008 correlation boundary | Pack: v1.7.21-oidc-session-error-contracts
export type { ResponseCorrelation } from './client.types'

export function requestId(): string {
  return crypto.randomUUID()
}

export function recordResponseCorrelation(headers: Record<string, unknown>): void {
  const requestIdValue = bounded(headers['x-request-id'])
  const traceIdValue = bounded(headers['x-trace-id'])
  latest = requestIdValue || traceIdValue ? { requestId: requestIdValue, traceId: traceIdValue } : null
}

export function latestResponseCorrelation(): ResponseCorrelation | null {
  return latest ? { ...latest } : null
}

function bounded(value: unknown): string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : ''
}
