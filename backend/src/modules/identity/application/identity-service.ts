import { timingSafeEqual } from 'node:crypto'

import type { ErrorCode } from '../../../shared/errors/index.js'
import {
  OIDC_LOGIN_STATE_TTL_MS,
  IdentityKeyProviderUnavailableError,
  IdentitySessionStoreUnavailableError,
  sha256,
  type AuthSessionRecord,
  type AuthSessionRepository,
  type IdentityKeyPort,
  type JsonObject,
  type OidcLoginStateRepository,
} from '../domain/index.js'

// Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 02B Identity delivery
// Contract: API-017–020, PR-001 | Pack: v1.7.21-oidc-session-error-contracts
export type ActorProjection = {
  id: string
  displayName: string
  email?: string
}

export type MfaAssurance = JsonObject

export type VerifiedIdentity = {
  actor: ActorProjection
  mfaAssurance: MfaAssurance
  nonce: string
  absoluteExpiresAt: Date
}

export interface CentralIamPort {
  authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }): Promise<string>
  exchangeCode(input: { code: string; pkceVerifier: string }): Promise<VerifiedIdentity>
  subjectStatus(subjectId: string): Promise<'ACTIVE' | 'INACTIVE' | 'UNCERTAIN'>
}

export interface IdentityClock { now(): Date }
export interface IdentityRandomSource {
  bytes(length: number): Uint8Array
  id(): string
}

export type IdentityServiceConfig = {
  oidcStateKeyId: string
  sessionCsrfKeyId: string
  oidcLoginStateTtlMs?: number
  sessionIdleTimeoutMs?: number
}

export class IdentityApplicationError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly details: Record<string, unknown> = {},
  ) {
    super(code)
    this.name = 'IdentityApplicationError'
  }
}

export class CentralIamUnavailableError extends Error {
  readonly code = 'SERVICE_UNAVAILABLE'
}

export class CentralIamTokenRejectedError extends Error {
  readonly code = 'OIDC_TOKEN_REJECTED'
}

export class IdentityService {
  constructor(
    private readonly loginStates: OidcLoginStateRepository,
    private readonly sessions: AuthSessionRepository,
    private readonly keys: IdentityKeyPort,
    private readonly iam: CentralIamPort,
    private readonly clock: IdentityClock,
    private readonly random: IdentityRandomSource,
    private readonly config: IdentityServiceConfig,
  ) {}

  async beginLogin(returnTo: string): Promise<{ location: string }> {
    if (!isSafeReturnTo(returnTo)) throw new IdentityApplicationError('INVALID_RETURN_URL')
    const now = this.clock.now()
    const state = token(this.random.bytes(32))
    const nonce = token(this.random.bytes(32))
    const verifier = token(this.random.bytes(48))
    const encryptedVerifier = await this.keys.encrypt(Buffer.from(verifier), this.config.oidcStateKeyId)
    await this.loginStates.create({
      id: this.random.id(),
      stateSha256: sha256(state),
      nonceSha256: sha256(nonce),
      pkceVerifier: encryptedVerifier,
      returnTo,
      createdAt: now,
      expiresAt: new Date(now.getTime() + (this.config.oidcLoginStateTtlMs ?? OIDC_LOGIN_STATE_TTL_MS)),
    })
    return {
      location: await this.authorizationUrl({
        state,
        nonce,
        codeChallenge: token(sha256(verifier)),
      }),
    }
  }

  async completeCallback(code: string, state: string): Promise<{
    returnTo: string
    sessionSelector: string
    csrfToken: string
  }> {
    if (!code || !state) throw new IdentityApplicationError('OIDC_CALLBACK_INVALID')
    const claimed = await this.loginStates.consume(sha256(state), this.clock.now())
    if (claimed.status === 'REPLAYED') throw new IdentityApplicationError('CALLBACK_REPLAYED')
    if (claimed.status !== 'CLAIMED') throw new IdentityApplicationError('SESSION_STATE_NOT_FOUND')
    try {
      const verifier = Buffer.from(await this.keys.decrypt(claimed.state.pkceVerifier)).toString('utf8')
      const identity = await this.exchange(code, verifier)
      if (!sameDigest(sha256(identity.nonce), claimed.state.nonceSha256)) {
        throw new IdentityApplicationError('OIDC_TOKEN_REJECTED')
      }
      if (!hasRequiredMfa(identity.mfaAssurance)) {
        throw new IdentityApplicationError('OIDC_TOKEN_REJECTED')
      }
      if (identity.absoluteExpiresAt <= this.clock.now()) {
        throw new IdentityApplicationError('OIDC_TOKEN_REJECTED')
      }

      const sessionSelector = token(this.random.bytes(48))
      const csrfToken = token(this.random.bytes(32))
      const encryptedCsrf = await this.keys.encrypt(Buffer.from(csrfToken), this.config.sessionCsrfKeyId)
      const now = this.clock.now()
      await this.sessions.create({
        id: this.random.id(),
        sessionTokenSha256: sha256(sessionSelector),
        subjectId: identity.actor.id,
        actorProjection: persistedActorProjection(identity.actor),
        mfaAssurance: persistedMfaAssurance(identity.mfaAssurance),
        csrfTokenSha256: sha256(csrfToken),
        csrfToken: encryptedCsrf,
        absoluteExpiresAt: identity.absoluteExpiresAt,
        lastActivityAt: now,
        createdAt: now,
      })
      return { returnTo: claimed.state.returnTo, sessionSelector, csrfToken }
    } catch (error) {
      throw restartLoginAfterClaim(error)
    }
  }

  async requireActor(sessionSelector: string): Promise<{ actor: ActorProjection; session: AuthSessionRecord; activityPersisted: boolean }> {
    if (!sessionSelector) throw new IdentityApplicationError('AUTH_REQUIRED')
    const result = await this.sessions.resolve(sha256(sessionSelector), this.clock.now())
    if (result.status !== 'ACTIVE') {
      throw new IdentityApplicationError('AUTH_REQUIRED', { reason: result.status })
    }
    const actor = readActorProjection(result.session.actorProjection)
    readMfaAssurance(result.session.mfaAssurance)
    const status = await this.subjectStatus(result.session.subjectId)
    if (status === 'UNCERTAIN') throw new IdentityApplicationError('SERVICE_UNAVAILABLE')
    if (status === 'INACTIVE') {
      await this.sessions.invalidate(result.session.id, 'IAM_REVOKED', this.clock.now())
      throw new IdentityApplicationError('AUTH_REQUIRED', { reason: 'IAM_REVOKED' })
    }
    const activity = await this.sessions.refreshActivity(result.session.id, this.clock.now())
    if (!activity) throw new IdentityApplicationError('AUTH_REQUIRED')
    return {
      actor,
      session: activity.session,
      activityPersisted: activity.activityPersisted,
    }
  }

  async requireCsrf(session: AuthSessionRecord, supplied: string): Promise<void> {
    if (!supplied || !sameDigest(sha256(supplied), session.csrfTokenSha256)) {
      throw new IdentityApplicationError('CSRF_INVALID')
    }
  }

  async session(sessionSelector: string, ifNoneMatch?: string): Promise<
    | { status: 304; etag: string }
    | { status: 200; etag: string; actor: ActorProjection; expiresAt: Date; lastActivityAt: Date; idleExpiresAt: Date; csrfToken: string }
  > {
    const authorized = await this.requireActor(sessionSelector)
    const etag = `W/"${authorized.session.revision}"`
    if (!authorized.activityPersisted && ifNoneMatch === etag) return { status: 304, etag }
    const csrfToken = Buffer.from(await this.keys.decrypt(authorized.session.csrfToken)).toString('utf8')
    return {
      status: 200,
      etag,
      actor: authorized.actor,
      expiresAt: authorized.session.absoluteExpiresAt,
      lastActivityAt: authorized.session.lastActivityAt,
      idleExpiresAt: new Date(authorized.session.lastActivityAt.getTime() + (this.config.sessionIdleTimeoutMs ?? 15 * 60 * 1_000)),
      csrfToken,
    }
  }

  async logout(sessionSelector: string, suppliedCsrf: string, allSessions = false): Promise<void> {
    if (allSessions) throw new IdentityApplicationError('GLOBAL_LOGOUT_UNSUPPORTED')
    if (!sessionSelector) throw new IdentityApplicationError('AUTH_REQUIRED')
    const resolved = await this.sessions.resolve(sha256(sessionSelector), this.clock.now())
    if (resolved.status === 'INVALIDATED') {
      if (resolved.session.invalidationReason !== 'LOGOUT') throw new IdentityApplicationError('AUTH_REQUIRED')
      await this.requireCsrf(resolved.session, suppliedCsrf)
      return
    }
    if (resolved.status !== 'ACTIVE') throw new IdentityApplicationError('AUTH_REQUIRED')
    const status = await this.subjectStatus(resolved.session.subjectId)
    if (status === 'UNCERTAIN') throw new IdentityApplicationError('SERVICE_UNAVAILABLE')
    if (status === 'INACTIVE') {
      await this.sessions.invalidate(resolved.session.id, 'IAM_REVOKED', this.clock.now())
      throw new IdentityApplicationError('AUTH_REQUIRED', { reason: 'IAM_REVOKED' })
    }
    await this.requireCsrf(resolved.session, suppliedCsrf)
    await this.sessions.invalidate(resolved.session.id, 'LOGOUT', this.clock.now())
  }

  private async exchange(code: string, verifier: string): Promise<VerifiedIdentity> {
    try { return await this.iam.exchangeCode({ code, pkceVerifier: verifier }) }
    catch (error) {
      if (error instanceof IdentityApplicationError) throw error
      if (error instanceof CentralIamTokenRejectedError) throw new IdentityApplicationError('OIDC_TOKEN_REJECTED')
      throw new IdentityApplicationError('SERVICE_UNAVAILABLE')
    }
  }

  private async authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }): Promise<string> {
    try { return await this.iam.authorizationUrl(input) }
    catch { throw new IdentityApplicationError('SERVICE_UNAVAILABLE') }
  }

  private async subjectStatus(subjectId: string) {
    try { return await this.iam.subjectStatus(subjectId) }
    catch { return 'UNCERTAIN' as const }
  }
}

function token(value: Uint8Array): string { return Buffer.from(value).toString('base64url') }
function sameDigest(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && timingSafeEqual(left, right)
}
function isSafeReturnTo(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !value.includes('\u0000')
}
function hasRequiredMfa(value: MfaAssurance): boolean {
  return Array.isArray(value.amr) && value.amr.includes('mfa') && typeof value.acr === 'string' && value.acr.length > 0
}
function restartLoginAfterClaim(error: unknown): unknown {
  if (error instanceof IdentityApplicationError) {
    if (error.code === 'SERVICE_UNAVAILABLE' || error.code === 'KEY_PROVIDER_UNAVAILABLE' || error.code === 'SESSION_STORE_UNAVAILABLE') {
      return new IdentityApplicationError(error.code, { ...error.details, recovery_action: 'RESTART_LOGIN' })
    }
    return error
  }
  if (error instanceof IdentityKeyProviderUnavailableError) {
    return new IdentityApplicationError('KEY_PROVIDER_UNAVAILABLE', { recovery_action: 'RESTART_LOGIN' })
  }
  if (error instanceof IdentitySessionStoreUnavailableError) {
    return new IdentityApplicationError('SESSION_STORE_UNAVAILABLE', { recovery_action: 'RESTART_LOGIN' })
  }
  return new IdentityApplicationError('INTERNAL_ERROR')
}

function persistedActorProjection(actor: ActorProjection): JsonObject {
  if (!boundedText(actor.id, 191) || !boundedText(actor.displayName, 191) || (actor.email !== undefined && !boundedText(actor.email, 320))) {
    throw new IdentityApplicationError('CLAIM_MAPPING_INVALID')
  }
  return {
    schemaVersion: 1,
    id: actor.id,
    displayName: actor.displayName,
    ...(actor.email === undefined ? {} : { email: actor.email }),
  }
}

function persistedMfaAssurance(value: MfaAssurance): JsonObject {
  const amr = Array.isArray(value.amr) ? value.amr : []
  const acr = value.acr
  if (
    !amr.includes('mfa')
    || amr.length < 1
    || amr.length > 16
    || new Set(amr).size !== amr.length
    || amr.some((entry) => !boundedText(entry, 64))
    || !boundedText(acr, 191)
  ) {
    throw new IdentityApplicationError('OIDC_TOKEN_REJECTED')
  }
  return { schemaVersion: 1, amr: [...amr], acr }
}

function readActorProjection(value: JsonObject): ActorProjection {
  const keys = Object.keys(value).sort()
  const allowed = value.email === undefined
    ? ['displayName', 'id', 'schemaVersion']
    : ['displayName', 'email', 'id', 'schemaVersion']
  if (
    keys.length !== allowed.length
    || keys.some((key, index) => key !== allowed[index])
    || value.schemaVersion !== 1
    || !boundedText(value.id, 191)
    || !boundedText(value.displayName, 191)
    || (value.email !== undefined && !boundedText(value.email, 320))
  ) {
    throw new IdentityApplicationError('SESSION_CLAIMS_INVALID')
  }
  return {
    id: value.id,
    displayName: value.displayName,
    ...(value.email === undefined ? {} : { email: value.email }),
  }
}

function readMfaAssurance(value: JsonObject): MfaAssurance {
  const keys = Object.keys(value).sort()
  const amr = value.amr
  if (
    keys.length !== 3
    || keys[0] !== 'acr'
    || keys[1] !== 'amr'
    || keys[2] !== 'schemaVersion'
    || value.schemaVersion !== 1
    || !Array.isArray(amr)
    || !amr.includes('mfa')
    || amr.length < 1
    || amr.length > 16
    || new Set(amr).size !== amr.length
    || amr.some((entry) => !boundedText(entry, 64))
    || !boundedText(value.acr, 191)
  ) {
    throw new IdentityApplicationError('SESSION_CLAIMS_INVALID')
  }
  return { amr: [...amr], acr: value.acr }
}

function boundedText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= max
}
