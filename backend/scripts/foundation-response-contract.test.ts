import assert from 'node:assert/strict'
import { test } from 'node:test'

import { assertFoundationErrorResponse } from './foundation-response-contract.js'

// Sprint: v1 | TC-068/TC-073 | Task Group: 03C CODE-10 harness
// Contract: API-024 dependency errors | Pack: v1.7.21-oidc-session-error-contracts
function response(details: Record<string, unknown>, extra: Record<string, unknown> = {}, retryAfter = '5') {
  return new Response(JSON.stringify({
    error: {
      code: 'SERVICE_UNAVAILABLE',
      request_id: 'request-1',
      trace_id: 'trace-1',
      details,
      ...extra,
    },
  }), {
    status: 503,
    headers: { 'x-request-id': 'request-1', 'x-trace-id': 'trace-1', 'retry-after': retryAfter },
  })
}

test('CODE-10 accepts a bounded 503 with equal body/header retry metadata', async () => {
  await assertFoundationErrorResponse(response({ retry_after_seconds: 5 }), 503, 'SERVICE_UNAVAILABLE')
})

test('CODE-10 rejects missing, unequal, out-of-range retry metadata and protected payloads', async () => {
  await assert.rejects(assertFoundationErrorResponse(response({}), 503, 'SERVICE_UNAVAILABLE'))
  await assert.rejects(assertFoundationErrorResponse(response({ retry_after_seconds: 4 }), 503, 'SERVICE_UNAVAILABLE'))
  await assert.rejects(assertFoundationErrorResponse(response({ retry_after_seconds: 86_401 }, {}, '86401'), 503, 'SERVICE_UNAVAILABLE'))
  await assert.rejects(assertFoundationErrorResponse(response({ retry_after_seconds: 5 }, { actor: { id: 'forbidden' } }), 503, 'SERVICE_UNAVAILABLE'))
})

test('CODE-10 validates correlation and code on non-503 errors without requiring retry metadata', async () => {
  const value = new Response(JSON.stringify({ error: { code: 'INVALID_REQUEST', request_id: 'r', trace_id: 't' } }), {
    status: 400,
    headers: { 'x-request-id': 'r', 'x-trace-id': 't' },
  })
  await assertFoundationErrorResponse(value, 400, 'INVALID_REQUEST')
  const wrong = new Response(JSON.stringify({ error: { code: 'OTHER', request_id: 'r', trace_id: 't' } }), {
    status: 400,
    headers: { 'x-request-id': 'r', 'x-trace-id': 't' },
  })
  await assert.rejects(assertFoundationErrorResponse(wrong, 400, 'INVALID_REQUEST'))
})

test('CODE-10 rejects nested protected payload keys', async () => {
  await assert.rejects(assertFoundationErrorResponse(response({ retry_after_seconds: 5, nested: [{ csrfToken: 'forbidden' }] }), 503, 'SERVICE_UNAVAILABLE'))
  assert.ok(true)
})
