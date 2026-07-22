import assert from 'node:assert/strict'

// Sprint: v1 | Feature: NFR-004/NFR-006/NFR-010 | Task Group: 03C CODE-10 harness
// Contract: API-024 dependency errors | Pack: v1.7.21-oidc-session-error-contracts
const PROTECTED_FIELDS = ['actor', 'csrfToken', 'sessionSelector', 'state', 'pkceVerifier']

export async function assertFoundationErrorResponse(response: Response, status: number, code: string): Promise<void> {
  assert.equal(response.status, status)
  const body = record(await response.json())
  const error = record(body.error)
  assert.equal(error.code, code)
  assert.equal(error.request_id, response.headers.get('x-request-id'))
  assert.equal(error.trace_id, response.headers.get('x-trace-id'))
  for (const field of PROTECTED_FIELDS) assert.equal(containsKey(body, field), false, `Protected field leaked: ${field}`)
  if (status === 503) {
    const details = record(error.details)
    const bodyRetry = details.retry_after_seconds
    const headerRetry = Number(response.headers.get('retry-after'))
    assert.equal(Number.isInteger(bodyRetry), true)
    assert.equal(bodyRetry, headerRetry)
    assert.ok(headerRetry >= 1 && headerRetry <= 86_400)
  }
}

function containsKey(value: unknown, target: string): boolean {
  if (Array.isArray(value)) return value.some((item) => containsKey(item, target))
  if (!value || typeof value !== 'object') return false
  const entries = Object.entries(value as Record<string, unknown>)
  return entries.some(([key, nested]) => key === target || containsKey(nested, target))
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}
