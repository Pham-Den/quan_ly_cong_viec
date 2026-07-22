// Sprint: v1 | Feature: NFR-010 | Task Group: 02B Identity delivery
// Contract: ADR-006, ARCH-COMP-001 | Pack: v1.7.21-oidc-session-error-contracts
export function resolveIdentityRuntimeConfig(env: NodeJS.ProcessEnv) {
  const issuer = env.CENTRAL_IAM_ISSUER ?? env.CENTRAL_IAM_BASE_URL ?? 'http://iam-fake:4101'
  const oidcStateKeyId = keyReference(env.OIDC_STATE_KEY_ID, 'OIDC_STATE_KEY_ID')
  const sessionCsrfKeyId = keyReference(env.SESSION_CSRF_KEY_ID, 'SESSION_CSRF_KEY_ID')
  if (oidcStateKeyId === sessionCsrfKeyId) throw new Error('OIDC_STATE_KEY_ID and SESSION_CSRF_KEY_ID must be distinct.')
  return {
    issuer: issuer.replace(/\/$/, ''),
    clientId: env.OIDC_CLIENT_ID ?? 'api-lab-local',
    redirectUri: env.OIDC_REDIRECT_URI ?? 'http://localhost:5173/auth/callback',
    audience: env.OIDC_AUDIENCE ?? 'api-lab-local',
    oidcLoginStateTtlMs: exactInteger(env.OIDC_LOGIN_STATE_TTL_MINUTES, 10, 'OIDC_LOGIN_STATE_TTL_MINUTES') * 60_000,
    sessionIdleTimeoutMs: exactInteger(env.SESSION_IDLE_TIMEOUT_MINUTES, 15, 'SESSION_IDLE_TIMEOUT_MINUTES') * 60_000,
    sessionActivityWriteMinMs: exactInteger(env.SESSION_ACTIVITY_WRITE_MIN_SECONDS, 60, 'SESSION_ACTIVITY_WRITE_MIN_SECONDS') * 1_000,
    iamLoginTimeoutMs: exactInteger(env.IAM_LOGIN_TIMEOUT_MS, 5_000, 'IAM_LOGIN_TIMEOUT_MS'),
    iamLoginRetryMax: exactInteger(env.IAM_LOGIN_RETRY_MAX, 3, 'IAM_LOGIN_RETRY_MAX'),
    iamStatusTimeoutMs: exactInteger(env.IAM_STATUS_TIMEOUT_MS, 2_000, 'IAM_STATUS_TIMEOUT_MS'),
    iamPositiveStatusCacheSeconds: exactInteger(env.IAM_POSITIVE_STATUS_CACHE_SECONDS, 0, 'IAM_POSITIVE_STATUS_CACHE_SECONDS'),
    oidcStateKeyId,
    sessionCsrfKeyId,
  }
}

function exactInteger(value: string | undefined, expected: number, name: string): number {
  const parsed = value === undefined ? Number.NaN : Number(value)
  if (!Number.isInteger(parsed) || parsed !== expected) throw new Error(`${name} must equal ${expected}.`)
  return parsed
}

function keyReference(value: string | undefined, name: string): string {
  if (!value || !/^secret-ref:\/\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value)) {
    throw new Error(`${name} must be a Secret Manager reference.`)
  }
  return value
}
