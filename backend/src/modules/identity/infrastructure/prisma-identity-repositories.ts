import { Prisma, type AuthSession, type OidcLoginState, type PrismaClient } from '@prisma/client'

import {
  OIDC_LOGIN_STATE_TTL_MS,
  SESSION_ACTIVITY_WRITE_MIN_MS,
  SESSION_IDLE_TIMEOUT_MS,
  IdentitySessionStoreUnavailableError,
  type AuthSessionRecord,
  type AuthSessionRepository,
  type AuthSessionResolution,
  type JsonObject,
  type OidcLoginStateRecord,
  type OidcLoginStateRepository,
  type SessionInvalidationReason,
} from '../domain/index.js'

// Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 02 Identity persistence
// Contract: ENT-022/023 atomic lifecycle | Pack: v1.7.21-oidc-session-error-contracts
function asBytes(value: Uint8Array): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(value)
}

function asJsonObject(value: Prisma.JsonValue, field: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new TypeError(`${field} must be a JSON object.`)
  }
  return value as JsonObject
}

function mapLoginState(row: OidcLoginState): OidcLoginStateRecord {
  return {
    id: row.id,
    stateSha256: row.stateSha256,
    nonceSha256: row.nonceSha256,
    pkceVerifier: {
      ciphertext: row.pkceVerifierCiphertext,
      nonce: row.pkceVerifierNonce,
      tag: row.pkceVerifierTag,
      keyId: row.pkceVerifierKeyId,
    },
    returnTo: row.returnTo,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    consumedAt: row.consumedAt,
  }
}

function mapAuthSession(row: AuthSession): AuthSessionRecord {
  return {
    id: row.id,
    sessionTokenSha256: row.sessionTokenSha256,
    subjectId: row.subjectId,
    actorProjection: asJsonObject(row.actorProjectionJson, 'actorProjectionJson'),
    mfaAssurance: asJsonObject(row.mfaAssuranceJson, 'mfaAssuranceJson'),
    csrfTokenSha256: row.csrfTokenSha256,
    csrfToken: {
      ciphertext: row.csrfTokenCiphertext,
      nonce: row.csrfTokenNonce,
      tag: row.csrfTokenTag,
      keyId: row.csrfTokenKeyId,
    },
    absoluteExpiresAt: row.absoluteExpiresAt,
    lastActivityAt: row.lastActivityAt,
    invalidatedAt: row.invalidatedAt,
    invalidationReason: row.invalidationReason as SessionInvalidationReason | null,
    revision: row.revision,
    createdAt: row.createdAt,
  }
}

export class PrismaOidcLoginStateRepository implements OidcLoginStateRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly stateTtlMs = OIDC_LOGIN_STATE_TTL_MS,
  ) {}

  async create(record: Omit<OidcLoginStateRecord, 'consumedAt'>): Promise<void> {
    if (record.expiresAt.getTime() - record.createdAt.getTime() !== this.stateTtlMs) {
      throw new RangeError('OIDC login state expiry does not match configured lifetime.')
    }
    try {
      await this.prisma.oidcLoginState.create({
        data: {
          id: record.id,
          stateSha256: asBytes(record.stateSha256),
          nonceSha256: asBytes(record.nonceSha256),
          pkceVerifierCiphertext: asBytes(record.pkceVerifier.ciphertext),
          pkceVerifierNonce: asBytes(record.pkceVerifier.nonce),
          pkceVerifierTag: asBytes(record.pkceVerifier.tag),
          pkceVerifierKeyId: record.pkceVerifier.keyId,
          returnTo: record.returnTo,
          createdAt: record.createdAt,
          updatedAt: record.createdAt,
          expiresAt: record.expiresAt,
        },
      })
    } catch (error) {
      throw new IdentitySessionStoreUnavailableError(error)
    }
  }

  async consume(stateSha256: Uint8Array, now: Date) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const claimed = await transaction.oidcLoginState.updateMany({
          where: {
            stateSha256: asBytes(stateSha256),
            consumedAt: null,
            expiresAt: { gt: now },
          },
          data: { consumedAt: now, updatedAt: now },
        })
        if (claimed.count !== 1) {
          const existing = await transaction.oidcLoginState.findUnique({
            where: { stateSha256: asBytes(stateSha256) },
          })
          if (!existing) return { status: 'NOT_FOUND' as const }
          if (existing.consumedAt) return { status: 'REPLAYED' as const }
          return { status: 'EXPIRED' as const }
        }
        const row = await transaction.oidcLoginState.findUniqueOrThrow({
          where: { stateSha256: asBytes(stateSha256) },
        })
        return { status: 'CLAIMED' as const, state: mapLoginState(row) }
      })
    } catch (error) {
      throw new IdentitySessionStoreUnavailableError(error)
    }
  }
}

export class PrismaAuthSessionRepository implements AuthSessionRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly idleTimeoutMs = SESSION_IDLE_TIMEOUT_MS,
    private readonly activityWriteMinMs = SESSION_ACTIVITY_WRITE_MIN_MS,
  ) {}

  async create(
    record: Omit<AuthSessionRecord, 'invalidatedAt' | 'invalidationReason' | 'revision'>,
  ): Promise<void> {
    if (record.absoluteExpiresAt <= record.createdAt) {
      throw new RangeError('Session absolute expiry must be after creation.')
    }
    try {
      await this.prisma.authSession.create({
        data: {
          id: record.id,
          sessionTokenSha256: asBytes(record.sessionTokenSha256),
          subjectId: record.subjectId,
          actorProjectionJson: record.actorProjection as Prisma.InputJsonObject,
          mfaAssuranceJson: record.mfaAssurance as Prisma.InputJsonObject,
          csrfTokenSha256: asBytes(record.csrfTokenSha256),
          csrfTokenCiphertext: asBytes(record.csrfToken.ciphertext),
          csrfTokenNonce: asBytes(record.csrfToken.nonce),
          csrfTokenTag: asBytes(record.csrfToken.tag),
          csrfTokenKeyId: record.csrfToken.keyId,
          absoluteExpiresAt: record.absoluteExpiresAt,
          lastActivityAt: record.lastActivityAt,
          revision: 1n,
          createdAt: record.createdAt,
          updatedAt: record.createdAt,
        },
      })
    } catch (error) {
      throw new IdentitySessionStoreUnavailableError(error)
    }
  }

  async resolve(sessionTokenSha256: Uint8Array, now: Date): Promise<AuthSessionResolution> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const selector = asBytes(sessionTokenSha256)
        let row = await transaction.authSession.findUnique({
          where: { sessionTokenSha256: selector },
        })
        if (!row) return { status: 'NOT_FOUND' }
        if (row.invalidatedAt) return { status: 'INVALIDATED', session: mapAuthSession(row) }

        if (row.absoluteExpiresAt <= now) {
          await this.invalidateInTransaction(transaction, row.id, 'ABSOLUTE_EXPIRY', now)
          return { status: 'ABSOLUTE_EXPIRY' }
        }

        const idleCutoff = new Date(now.getTime() - this.idleTimeoutMs)
        if (row.lastActivityAt < idleCutoff) {
          await this.invalidateInTransaction(transaction, row.id, 'IDLE_TIMEOUT', now)
          return { status: 'IDLE_TIMEOUT' }
        }

        return { status: 'ACTIVE', session: mapAuthSession(row) }
      })
    } catch (error) {
      throw new IdentitySessionStoreUnavailableError(error)
    }
  }

  async refreshActivity(id: string, now: Date) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const idleCutoff = new Date(now.getTime() - this.idleTimeoutMs)
        const current = await transaction.authSession.findUnique({ where: { id } })
        if (!current || current.invalidatedAt || current.absoluteExpiresAt <= now) return null
        if (current.lastActivityAt < idleCutoff) {
          await this.invalidateInTransaction(transaction, id, 'IDLE_TIMEOUT', now)
          return null
        }
        const activityCutoff = new Date(now.getTime() - this.activityWriteMinMs)
        const refreshed = await transaction.authSession.updateMany({
          where: {
            id,
            invalidatedAt: null,
            absoluteExpiresAt: { gt: now },
            lastActivityAt: { gte: idleCutoff, lte: activityCutoff },
          },
          data: { lastActivityAt: now, revision: { increment: 1n }, updatedAt: now },
        })
        const row = await transaction.authSession.findUnique({ where: { id } })
        if (!row || row.invalidatedAt || row.absoluteExpiresAt <= now) return null
        return { session: mapAuthSession(row), activityPersisted: refreshed.count === 1 }
      })
    } catch (error) {
      throw new IdentitySessionStoreUnavailableError(error)
    }
  }

  async invalidate(id: string, reason: SessionInvalidationReason, now: Date): Promise<boolean> {
    try {
      const result = await this.prisma.authSession.updateMany({
        where: { id, invalidatedAt: null },
        data: { invalidatedAt: now, invalidationReason: reason, updatedAt: now },
      })
      return result.count === 1
    } catch (error) {
      throw new IdentitySessionStoreUnavailableError(error)
    }
  }

  private async invalidateInTransaction(
    transaction: Prisma.TransactionClient,
    id: string,
    reason: SessionInvalidationReason,
    now: Date,
  ): Promise<void> {
    await transaction.authSession.updateMany({
      where: { id, invalidatedAt: null },
      data: { invalidatedAt: now, invalidationReason: reason, updatedAt: now },
    })
  }
}
