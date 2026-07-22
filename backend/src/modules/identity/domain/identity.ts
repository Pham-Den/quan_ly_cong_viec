import { createHash } from 'node:crypto'

// Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 02 Identity persistence
// Contract: ENT-022/023, PR-001 | Pack: v1.7.21-oidc-session-error-contracts
export const OIDC_LOGIN_STATE_TTL_MS = 10 * 60 * 1_000
export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1_000
export const SESSION_ACTIVITY_WRITE_MIN_MS = 60 * 1_000
export const OIDC_STATE_KEY_ID_CONFIG = 'OIDC_STATE_KEY_ID'
export const SESSION_CSRF_KEY_ID_CONFIG = 'SESSION_CSRF_KEY_ID'

export function sha256(value: Uint8Array | string): Uint8Array {
  return createHash('sha256').update(value).digest()
}

export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject
export type JsonObject = { [key: string]: JsonValue }

export type EncryptedIdentityValue = {
  ciphertext: Uint8Array
  nonce: Uint8Array
  tag: Uint8Array
  keyId: string
}

export interface IdentityKeyPort {
  encrypt(plaintext: Uint8Array, keyId: string): Promise<EncryptedIdentityValue>
  decrypt(value: EncryptedIdentityValue): Promise<Uint8Array>
}

export type OidcLoginStateRecord = {
  id: string
  stateSha256: Uint8Array
  nonceSha256: Uint8Array
  pkceVerifier: EncryptedIdentityValue
  returnTo: string
  createdAt: Date
  expiresAt: Date
  consumedAt: Date | null
}

export interface OidcLoginStateRepository {
  create(record: Omit<OidcLoginStateRecord, 'consumedAt'>): Promise<void>
  consume(stateSha256: Uint8Array, now: Date): Promise<OidcLoginStateConsumeResult>
}

export type OidcLoginStateConsumeResult =
  | { status: 'CLAIMED'; state: OidcLoginStateRecord }
  | { status: 'NOT_FOUND' | 'EXPIRED' | 'REPLAYED' }

export type SessionInvalidationReason = 'LOGOUT' | 'IDLE_TIMEOUT' | 'ABSOLUTE_EXPIRY' | 'IAM_REVOKED'

export type AuthSessionRecord = {
  id: string
  sessionTokenSha256: Uint8Array
  subjectId: string
  actorProjection: JsonObject
  mfaAssurance: JsonObject
  csrfTokenSha256: Uint8Array
  csrfToken: EncryptedIdentityValue
  absoluteExpiresAt: Date
  lastActivityAt: Date
  invalidatedAt: Date | null
  invalidationReason: SessionInvalidationReason | null
  revision: bigint
  createdAt: Date
}

export type AuthSessionResolution =
  | { status: 'ACTIVE'; session: AuthSessionRecord }
  | { status: 'INVALIDATED'; session: AuthSessionRecord }
  | { status: 'NOT_FOUND' | 'ABSOLUTE_EXPIRY' | 'IDLE_TIMEOUT' }

export type AuthSessionActivityResult = {
  session: AuthSessionRecord
  activityPersisted: boolean
}

export interface AuthSessionRepository {
  create(record: Omit<AuthSessionRecord, 'invalidatedAt' | 'invalidationReason' | 'revision'>): Promise<void>
  resolve(sessionTokenSha256: Uint8Array, now: Date): Promise<AuthSessionResolution>
  refreshActivity(id: string, now: Date): Promise<AuthSessionActivityResult | null>
  invalidate(id: string, reason: SessionInvalidationReason, now: Date): Promise<boolean>
}

export class IdentityKeyProviderUnavailableError extends Error {
  readonly code = 'KEY_PROVIDER_UNAVAILABLE'

  constructor(cause?: unknown) {
    super('Identity encryption key operation is unavailable.', { cause })
    this.name = 'IdentityKeyProviderUnavailableError'
  }
}

export class IdentitySessionStoreUnavailableError extends Error {
  readonly code = 'SESSION_STORE_UNAVAILABLE'

  constructor(cause?: unknown) {
    super('Identity session persistence is unavailable.', { cause })
    this.name = 'IdentitySessionStoreUnavailableError'
  }
}
