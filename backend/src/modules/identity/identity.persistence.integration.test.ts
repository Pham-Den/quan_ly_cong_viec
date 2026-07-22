import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import type { PrismaClient } from '@prisma/client'

import {
  OIDC_LOGIN_STATE_TTL_MS,
  OIDC_STATE_KEY_ID_CONFIG,
  SESSION_ACTIVITY_WRITE_MIN_MS,
  SESSION_CSRF_KEY_ID_CONFIG,
  SESSION_IDLE_TIMEOUT_MS,
  IdentityKeyProviderUnavailableError,
  IdentitySessionStoreUnavailableError,
  type AuthSessionRecord,
  type OidcLoginStateRecord,
} from './domain/index.js'
import {
  Aes256GcmIdentityKeyAdapter,
  PrismaAuthSessionRepository,
  PrismaOidcLoginStateRepository,
  sha256,
} from './infrastructure/index.js'

// Sprint: v1 | TC-065/TC-068 | Task Group: 02 Identity persistence
// Pack: v1.7.21-oidc-session-error-contracts
type Row = Record<string, any>

class FakeIdentityPrisma {
  loginRows: Row[] = []
  sessionRows: Row[] = []
  failAfterLoginClaim = false
  failStore = false

  oidcLoginState: any
  authSession: any

  constructor() {
    this.oidcLoginState = {
      create: async ({ data }: Row) => {
        this.ensureStore()
        this.loginRows.push({ ...data, consumedAt: null })
        return data
      },
      updateMany: async ({ where, data }: Row) => {
        this.ensureStore()
        let count = 0
        for (const row of this.loginRows) {
          if (sameBytes(row.stateSha256, where.stateSha256) && row.consumedAt === null && row.expiresAt > where.expiresAt.gt) {
            Object.assign(row, data)
            count += 1
          }
        }
        return { count }
      },
      findUniqueOrThrow: async ({ where }: Row) => {
        this.ensureStore()
        if (this.failAfterLoginClaim) throw new Error('simulated post-claim read failure')
        const row = this.loginRows.find((candidate) => sameBytes(candidate.stateSha256, where.stateSha256))
        if (!row) throw new Error('not found')
        return { ...row }
      },
      findUnique: async ({ where }: Row) => {
        this.ensureStore()
        const row = this.loginRows.find((candidate) => sameBytes(candidate.stateSha256, where.stateSha256))
        return row ? { ...row } : null
      },
    }
    this.authSession = {
      create: async ({ data }: Row) => {
        this.ensureStore()
        this.sessionRows.push({ ...data, invalidatedAt: null, invalidationReason: null })
        return data
      },
      findUnique: async ({ where }: Row) => {
        this.ensureStore()
        const row = this.findSession(where)
        return row ? { ...row } : null
      },
      findUniqueOrThrow: async ({ where }: Row) => {
        this.ensureStore()
        const row = this.findSession(where)
        if (!row) throw new Error('not found')
        return { ...row }
      },
      updateMany: async ({ where, data }: Row) => {
        this.ensureStore()
        let count = 0
        for (const row of this.sessionRows) {
          if (!matchesSession(row, where)) continue
          for (const [key, value] of Object.entries(data)) {
            row[key] = isIncrement(value) ? BigInt(row[key]) + BigInt(value.increment) : value
          }
          count += 1
        }
        return { count }
      },
    }
  }

  async $transaction<T>(handler: (transaction: any) => Promise<T>): Promise<T> {
    this.ensureStore()
    const loginSnapshot = structuredClone(this.loginRows)
    const sessionSnapshot = structuredClone(this.sessionRows)
    try {
      return await handler(this)
    } catch (error) {
      this.loginRows = loginSnapshot
      this.sessionRows = sessionSnapshot
      throw error
    }
  }

  private findSession(where: Row): Row | undefined {
    return this.sessionRows.find((candidate) =>
      where.id !== undefined ? candidate.id === where.id : sameBytes(candidate.sessionTokenSha256, where.sessionTokenSha256),
    )
  }

  private ensureStore(): void {
    if (this.failStore) throw new Error('simulated repository outage')
  }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return Buffer.from(left).equals(Buffer.from(right))
}
function isIncrement(value: unknown): value is { increment: bigint } {
  return value !== null && typeof value === 'object' && 'increment' in value
}
function matchesSession(row: Row, where: Row): boolean {
  if (where.id !== undefined && row.id !== where.id) return false
  if (where.invalidatedAt === null && row.invalidatedAt !== null) return false
  if (where.absoluteExpiresAt?.gt && row.absoluteExpiresAt <= where.absoluteExpiresAt.gt) return false
  if (where.lastActivityAt?.gte && row.lastActivityAt < where.lastActivityAt.gte) return false
  if (where.lastActivityAt?.lte && row.lastActivityAt > where.lastActivityAt.lte) return false
  return true
}
function prisma(fake: FakeIdentityPrisma): PrismaClient {
  return fake as unknown as PrismaClient
}

const fixedKey = Uint8Array.from({ length: 32 }, (_, index) => index + 1)
const deterministicNonce = () => Uint8Array.from({ length: 12 }, (_, index) => index + 11)

test('identity migration has an ordered, repeatable rollback artifact', async () => {
  const rollback = await readFile(
    new URL('../../../prisma/migrations/20260719190000_identity_session/rollback.sql', import.meta.url),
    'utf8',
  )
  assert.match(rollback, /DROP TABLE IF EXISTS `auth_sessions`;/)
  assert.match(rollback, /DROP TABLE IF EXISTS `oidc_login_states`;/)
  assert.ok(rollback.indexOf('auth_sessions') < rollback.indexOf('oidc_login_states'))
})

test('AES-256-GCM round-trips with recoverable key ID and rejects tampering/key failures distinctly', async () => {
  assert.equal(OIDC_STATE_KEY_ID_CONFIG, 'OIDC_STATE_KEY_ID')
  assert.equal(SESSION_CSRF_KEY_ID_CONFIG, 'SESSION_CSRF_KEY_ID')
  const adapter = new Aes256GcmIdentityKeyAdapter({ resolve: async () => fixedKey }, deterministicNonce)
  const plaintext = Buffer.from('synthetic-pkce-value')
  const encrypted = await adapter.encrypt(plaintext, 'oidc-state-key-ref')
  assert.equal(encrypted.nonce.byteLength, 12)
  assert.equal(encrypted.tag.byteLength, 16)
  assert.equal(encrypted.keyId, 'oidc-state-key-ref')
  assert.deepEqual(await adapter.decrypt(encrypted), plaintext)
  assert.equal(Buffer.from(encrypted.ciphertext).includes(plaintext), false)

  const tampered = { ...encrypted, tag: Uint8Array.from(encrypted.tag) }
  tampered.tag[0] ^= 1
  await assert.rejects(adapter.decrypt(tampered), IdentityKeyProviderUnavailableError)
  const unavailable = new Aes256GcmIdentityKeyAdapter({ resolve: async () => { throw new Error('down') } })
  await assert.rejects(unavailable.encrypt(plaintext, 'session-csrf-key-ref'), IdentityKeyProviderUnavailableError)

  const randomAdapter = new Aes256GcmIdentityKeyAdapter({ resolve: async () => fixedKey })
  assert.equal((await randomAdapter.encrypt(plaintext, 'random-nonce-key-ref')).nonce.byteLength, 12)
  await assert.rejects(
    new Aes256GcmIdentityKeyAdapter({ resolve: async () => fixedKey }, () => new Uint8Array(11)).encrypt(plaintext, 'bad-nonce'),
    IdentityKeyProviderUnavailableError,
  )
  await assert.rejects(
    new Aes256GcmIdentityKeyAdapter({ resolve: async () => new Uint8Array(31) }).encrypt(plaintext, 'short-key'),
    IdentityKeyProviderUnavailableError,
  )
  await assert.rejects(adapter.encrypt(plaintext, ''), IdentityKeyProviderUnavailableError)
  await assert.rejects(adapter.decrypt({ ...encrypted, nonce: new Uint8Array(11) }), IdentityKeyProviderUnavailableError)
})

test('ENT-022 enforces exact ten-minute TTL, one consumer and rollback on claim-store failure', async () => {
  const fake = new FakeIdentityPrisma()
  const repository = new PrismaOidcLoginStateRepository(prisma(fake))
  const now = new Date('2026-07-19T10:00:00.000Z')
  const record = loginRecord(now)
  await repository.create(record)
  assert.equal(fake.loginRows[0].expiresAt.getTime() - fake.loginRows[0].createdAt.getTime(), OIDC_LOGIN_STATE_TTL_MS)
  assert.equal(JSON.stringify(fake.loginRows[0]).includes('raw-state-marker'), false)

  const [first, second] = await Promise.all([
    repository.consume(record.stateSha256, new Date(now.getTime() + OIDC_LOGIN_STATE_TTL_MS - 1)),
    repository.consume(record.stateSha256, new Date(now.getTime() + OIDC_LOGIN_STATE_TTL_MS - 1)),
  ])
  assert.equal([first, second].filter((result) => result.status === 'CLAIMED').length, 1)
  assert.equal([first, second].filter((result) => result.status === 'REPLAYED').length, 1)

  const exactBoundaryFake = new FakeIdentityPrisma()
  const exactBoundary = new PrismaOidcLoginStateRepository(prisma(exactBoundaryFake))
  await exactBoundary.create(record)
  assert.equal((await exactBoundary.consume(record.stateSha256, new Date(now.getTime() + OIDC_LOGIN_STATE_TTL_MS))).status, 'EXPIRED')

  const rollbackFake = new FakeIdentityPrisma()
  const rollback = new PrismaOidcLoginStateRepository(prisma(rollbackFake))
  await rollback.create(record)
  rollbackFake.failAfterLoginClaim = true
  await assert.rejects(rollback.consume(record.stateSha256, new Date(now.getTime() + 1)), IdentitySessionStoreUnavailableError)
  assert.equal(rollbackFake.loginRows[0].consumedAt, null)

  await assert.rejects(
    repository.create({ ...record, expiresAt: new Date(record.expiresAt.getTime() + 1) }),
    RangeError,
  )
  const unavailableFake = new FakeIdentityPrisma()
  unavailableFake.failStore = true
  await assert.rejects(
    new PrismaOidcLoginStateRepository(prisma(unavailableFake)).create(record),
    IdentitySessionStoreUnavailableError,
  )
})

test('ENT-023 preserves idle and activity clock boundaries and increments revision once per window', async () => {
  const now = new Date('2026-07-19T11:00:00.000Z')
  for (const [idleAge, expected] of [
    [SESSION_IDLE_TIMEOUT_MS - 1, 'ACTIVE'],
    [SESSION_IDLE_TIMEOUT_MS, 'ACTIVE'],
    [SESSION_IDLE_TIMEOUT_MS + 1, 'IDLE_TIMEOUT'],
  ] as const) {
    const fake = new FakeIdentityPrisma()
    const repository = new PrismaAuthSessionRepository(prisma(fake))
    const record = sessionRecord(now, idleAge)
    await repository.create(record)
    const result = await repository.resolve(record.sessionTokenSha256, now)
    assert.equal(result.status, expected)
    if (expected === 'IDLE_TIMEOUT') assert.equal(fake.sessionRows[0].invalidationReason, 'IDLE_TIMEOUT')
  }

  for (const [activityAge, expectedWrite] of [
    [SESSION_ACTIVITY_WRITE_MIN_MS - 1, false],
    [SESSION_ACTIVITY_WRITE_MIN_MS, true],
    [SESSION_ACTIVITY_WRITE_MIN_MS + 1, true],
  ] as const) {
    const fake = new FakeIdentityPrisma()
    const repository = new PrismaAuthSessionRepository(prisma(fake))
    const record = sessionRecord(now, activityAge)
    await repository.create(record)
    assert.equal((await repository.resolve(record.sessionTokenSha256, now)).status, 'ACTIVE')
    const result = await repository.refreshActivity(record.id, now)
    assert.ok(result)
    assert.equal(result.activityPersisted, expectedWrite)
    assert.equal(result.session.revision, expectedWrite ? 2n : 1n)
    const second = await repository.refreshActivity(record.id, now)
    assert.ok(second)
    assert.equal(second.activityPersisted, false)
  }

  const boundaryRace = new FakeIdentityPrisma()
  const boundaryRepository = new PrismaAuthSessionRepository(prisma(boundaryRace))
  const boundaryRecord = sessionRecord(now, SESSION_IDLE_TIMEOUT_MS - 1)
  await boundaryRepository.create(boundaryRecord)
  assert.equal((await boundaryRepository.resolve(boundaryRecord.sessionTokenSha256, now)).status, 'ACTIVE')
  boundaryRace.sessionRows[0].lastActivityAt = new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS - 1)
  assert.equal(await boundaryRepository.refreshActivity(boundaryRecord.id, now), null)
  assert.equal(boundaryRace.sessionRows[0].invalidationReason, 'IDLE_TIMEOUT')
})

test('ENT-023 absolute expiry and invalidation are fail-closed, monotonic and store failures stay distinct', async () => {
  const fake = new FakeIdentityPrisma()
  const repository = new PrismaAuthSessionRepository(prisma(fake))
  const now = new Date('2026-07-19T12:00:00.000Z')
  const record = sessionRecord(now, 1)
  record.absoluteExpiresAt = now
  await repository.create({ ...record, absoluteExpiresAt: new Date(now.getTime() + 1) })
  fake.sessionRows[0].absoluteExpiresAt = now
  assert.equal((await repository.resolve(record.sessionTokenSha256, now)).status, 'ABSOLUTE_EXPIRY')
  assert.equal(fake.sessionRows[0].invalidationReason, 'ABSOLUTE_EXPIRY')
  assert.equal(await repository.invalidate(record.id, 'LOGOUT', new Date(now.getTime() + 1)), false)
  assert.equal(fake.sessionRows[0].invalidationReason, 'ABSOLUTE_EXPIRY')

  fake.failStore = true
  await assert.rejects(repository.resolve(record.sessionTokenSha256, now), (error: unknown) =>
    error instanceof IdentitySessionStoreUnavailableError && error.code === 'SESSION_STORE_UNAVAILABLE',
  )
  await assert.rejects(repository.refreshActivity(record.id, now), IdentitySessionStoreUnavailableError)
  await assert.rejects(repository.invalidate(record.id, 'LOGOUT', now), IdentitySessionStoreUnavailableError)
})

test('ENT-023 rejects invalid creation and covers not-found, already-invalidated and first invalidation states', async () => {
  const now = new Date('2026-07-19T13:00:00.000Z')
  const fake = new FakeIdentityPrisma()
  const repository = new PrismaAuthSessionRepository(prisma(fake))
  const record = sessionRecord(now, 1)
  await assert.rejects(repository.create({ ...record, absoluteExpiresAt: record.createdAt }), RangeError)
  assert.equal((await repository.resolve(sha256('missing'), now)).status, 'NOT_FOUND')
  await repository.create(record)
  assert.equal(await repository.invalidate(record.id, 'LOGOUT', now), true)
  assert.equal((await repository.resolve(record.sessionTokenSha256, now)).status, 'INVALIDATED')

  const unavailable = new FakeIdentityPrisma()
  unavailable.failStore = true
  await assert.rejects(
    new PrismaAuthSessionRepository(prisma(unavailable)).create(record),
    IdentitySessionStoreUnavailableError,
  )
})

function loginRecord(createdAt: Date): Omit<OidcLoginStateRecord, 'consumedAt'> {
  return {
    id: '00000000-0000-4000-8000-000000000022',
    stateSha256: sha256('raw-state-marker'),
    nonceSha256: sha256('raw-nonce-marker'),
    pkceVerifier: { ciphertext: Uint8Array.of(1, 2, 3), nonce: new Uint8Array(12), tag: new Uint8Array(16), keyId: 'oidc-state-key-ref' },
    returnTo: '/systems/host/api-lab',
    createdAt,
    expiresAt: new Date(createdAt.getTime() + OIDC_LOGIN_STATE_TTL_MS),
  }
}

function sessionRecord(now: Date, activityAge: number): Omit<AuthSessionRecord, 'invalidatedAt' | 'invalidationReason' | 'revision'> {
  const createdAt = new Date(now.getTime() - 20 * 60 * 1_000)
  return {
    id: `00000000-0000-4000-8000-${String(activityAge).padStart(12, '0').slice(-12)}`,
    sessionTokenSha256: sha256(`opaque-session-${activityAge}`),
    subjectId: 'iam-subject-17',
    actorProjection: { id: 'iam-subject-17', displayName: 'Synthetic User' },
    mfaAssurance: { amr: ['mfa'], acr: 'urn:approved' },
    csrfTokenSha256: sha256(`csrf-${activityAge}`),
    csrfToken: { ciphertext: Uint8Array.of(4, 5, 6), nonce: new Uint8Array(12), tag: new Uint8Array(16), keyId: 'session-csrf-key-ref' },
    absoluteExpiresAt: new Date(now.getTime() + 60 * 60 * 1_000),
    lastActivityAt: new Date(now.getTime() - activityAge),
    createdAt,
  }
}
