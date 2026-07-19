import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  IDEMPOTENCY_RESPONSE_MAX_BYTES,
  IDEMPOTENCY_TTL_HOURS,
  IdempotencyKeyReusedError,
  IdempotencyResponseTooLargeError,
  StandardIdempotencyCoordinator,
  type Clock,
  type ExecutionResponseSchemaReader,
  type IdempotencyRecordRepository,
  type IdempotencyScope,
  type StoredIdempotencyRecord,
} from '../../index.js'
import {
  AddressSetManifestVerificationError,
  type ApprovedAddressSetRegistry,
} from '../../../system-catalog/index.js'
import type { WorkflowImpactService } from '../../../workflow-definition/index.js'
import {
  CallerOwnedUnitOfWork,
  NestedUnitOfWorkError,
  type UnitOfWork,
  type UnitOfWorkAdapter,
} from '../../../../shared/unit-of-work/index.js'

type Store = {
  domainWrites: string[]
  records: StoredIdempotencyRecord[]
}

class MutableClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current)
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds)
  }
}

class MemoryTransactionAdapter implements UnitOfWorkAdapter {
  committed: Store = { domainWrites: [], records: [] }
  private readonly drafts = new Map<string, Store>()
  private sequence = 0

  async execute<T>(handler: (unitOfWork: UnitOfWork) => Promise<T>): Promise<T> {
    const unitOfWork = { transactionId: `tx-${++this.sequence}` }
    const draft = structuredClone(this.committed)
    this.drafts.set(unitOfWork.transactionId, draft)

    try {
      const result = await handler(unitOfWork)
      this.committed = draft
      return result
    } finally {
      this.drafts.delete(unitOfWork.transactionId)
    }
  }

  draft(unitOfWork: UnitOfWork): Store {
    const draft = this.drafts.get(unitOfWork.transactionId)
    assert.ok(draft, 'every write must join the active caller-owned UnitOfWork')
    return draft
  }
}

class MemoryIdempotencyRecords implements IdempotencyRecordRepository {
  readonly observedTransactionIds: string[] = []

  constructor(private readonly transactions: MemoryTransactionAdapter) {}

  async findActive(scope: IdempotencyScope, now: Date, unitOfWork: UnitOfWork) {
    this.observedTransactionIds.push(unitOfWork.transactionId)
    return (
      this.transactions
        .draft(unitOfWork)
        .records.find(
          (record) =>
            record.actorId === scope.actorId &&
            record.routeKey === scope.routeKey &&
            record.idempotencyKey === scope.idempotencyKey &&
            record.expiresAt.getTime() > now.getTime(),
        ) ?? null
    )
  }

  async save(record: StoredIdempotencyRecord, unitOfWork: UnitOfWork): Promise<void> {
    this.observedTransactionIds.push(unitOfWork.transactionId)
    const records = this.transactions.draft(unitOfWork).records
    const index = records.findIndex(
      (candidate) =>
        candidate.actorId === record.actorId &&
        candidate.routeKey === record.routeKey &&
        candidate.idempotencyKey === record.idempotencyKey,
    )

    if (index >= 0) records[index] = record
    else records.push(record)
  }
}

const scope: IdempotencyScope = {
  actorId: 'actor-1',
  routeKey: 'PUT:/api/v1/hosts/:hostId/api-lab/apis/:apiId',
  idempotencyKey: 'idem-1',
}

function setup() {
  const transactions = new MemoryTransactionAdapter()
  const unitOfWork = new CallerOwnedUnitOfWork(transactions)
  const records = new MemoryIdempotencyRecords(transactions)
  const clock = new MutableClock(new Date('2026-07-19T00:00:00.000Z'))
  const coordinator = new StandardIdempotencyCoordinator(records, clock)
  return { transactions, unitOfWork, records, clock, coordinator }
}

// CODE-1: Sprint v1 · TG-01 Shared Contracts · TC-061/067 · NFR-003/004 · PR-002/004/005/008
describe('caller-owned UnitOfWork contract', () => {
  test('rejects a nested transaction and keeps the outer transaction usable', async () => {
    const { unitOfWork } = setup()

    await unitOfWork.execute(async (outer) => {
      assert.equal(unitOfWork.current(), outer)
      await assert.rejects(
        async () => unitOfWork.execute(async () => undefined),
        (error: unknown) => error instanceof NestedUnitOfWorkError && error.code === 'NESTED_UNIT_OF_WORK',
      )
      assert.equal(unitOfWork.current(), outer)
    })

    assert.equal(unitOfWork.current(), undefined)
  })
})

describe('IdempotencyCoordinator contract', () => {
  test('replays the committed original response without invoking the handler again', async () => {
    const { coordinator, unitOfWork, records } = setup()
    let handlerCalls = 0
    const originalResponse = { statusCode: 200, body: { revision: 7, result: 'saved' }, resourceId: 'api-7' }

    const execute = () =>
      unitOfWork.execute((transaction) =>
        coordinator.execute({ scope, requestHash: 'hash-a' }, transaction, async (received) => {
          handlerCalls += 1
          assert.equal(received, transaction)
          return originalResponse
        }),
      )

    assert.deepEqual(await execute(), originalResponse)
    assert.deepEqual(await execute(), originalResponse)
    assert.equal(handlerCalls, 1)
    assert.equal(new Set(records.observedTransactionIds).size, 2)
  })

  test('rejects reuse with a different request hash before invoking the handler', async () => {
    const { coordinator, unitOfWork } = setup()
    let conflictingHandlerCalls = 0

    await unitOfWork.execute((transaction) =>
      coordinator.execute({ scope, requestHash: 'hash-a' }, transaction, async () => ({
        statusCode: 201,
        body: { created: true },
      })),
    )

    await assert.rejects(
      unitOfWork.execute((transaction) =>
        coordinator.execute({ scope, requestHash: 'hash-b' }, transaction, async () => {
          conflictingHandlerCalls += 1
          return { statusCode: 200, body: null }
        }),
      ),
      (error: unknown) =>
        error instanceof IdempotencyKeyReusedError && error.code === 'IDEMPOTENCY_KEY_REUSED',
    )
    assert.equal(conflictingHandlerCalls, 0)
  })

  test('accepts exactly 65536 UTF-8 bytes and rolls back all writes at 65537 bytes', async () => {
    const { coordinator, unitOfWork, transactions } = setup()
    const exactBody = 'x'.repeat(IDEMPOTENCY_RESPONSE_MAX_BYTES - 2)

    await unitOfWork.execute((transaction) =>
      coordinator.execute({ scope, requestHash: 'exact' }, transaction, async (received) => {
        transactions.draft(received).domainWrites.push('exact-domain-write')
        return { statusCode: 200, body: exactBody }
      }),
    )
    assert.equal(Buffer.byteLength(JSON.stringify(exactBody)), IDEMPOTENCY_RESPONSE_MAX_BYTES)
    assert.deepEqual(transactions.committed.domainWrites, ['exact-domain-write'])

    const oversizedScope = { ...scope, idempotencyKey: 'idem-oversized' }
    const oversizedBody = 'x'.repeat(IDEMPOTENCY_RESPONSE_MAX_BYTES - 1)
    await assert.rejects(
      unitOfWork.execute((transaction) =>
        coordinator.execute({ scope: oversizedScope, requestHash: 'oversized' }, transaction, async (received) => {
          transactions.draft(received).domainWrites.push('must-roll-back')
          return { statusCode: 200, body: oversizedBody }
        }),
      ),
      (error: unknown) =>
        error instanceof IdempotencyResponseTooLargeError &&
        error.code === 'IDEMPOTENCY_RESPONSE_TOO_LARGE' &&
        error.actualBytes === IDEMPOTENCY_RESPONSE_MAX_BYTES + 1,
    )
    assert.deepEqual(transactions.committed.domainWrites, ['exact-domain-write'])
    assert.equal(transactions.committed.records.length, 1)
  })

  test('expires a replay record at the exact 24-hour boundary', async () => {
    const { coordinator, unitOfWork, clock } = setup()
    let handlerCalls = 0
    const execute = () =>
      unitOfWork.execute((transaction) =>
        coordinator.execute({ scope, requestHash: 'hash-a' }, transaction, async () => ({
          statusCode: 200,
          body: { call: ++handlerCalls },
        })),
      )

    assert.deepEqual((await execute()).body, { call: 1 })
    clock.advance(IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1_000 - 1)
    assert.deepEqual((await execute()).body, { call: 1 })
    clock.advance(1)
    assert.deepEqual((await execute()).body, { call: 2 })
  })

  test('[PBT] replays a deterministic corpus of JSON values without semantic drift', async () => {
    const { coordinator, unitOfWork } = setup()
    const corpus = Array.from({ length: 40 }, (_, index) => ({
      index,
      active: index % 2 === 0,
      nullable: index % 3 === 0 ? null : `value-${index}-\u0111\u1ecbnh`,
      nested: [index, index / 10, { key: `k-${index}` }],
    }))

    for (const [index, body] of corpus.entries()) {
      const generatedScope = { ...scope, idempotencyKey: `generated-${index}` }
      let handlerCalls = 0
      const execute = () =>
        unitOfWork.execute((transaction) =>
          coordinator.execute(
            { scope: generatedScope, requestHash: `hash-${index}` },
            transaction,
            async () => {
              handlerCalls += 1
              return { statusCode: 200, body }
            },
          ),
        )

      assert.deepEqual((await execute()).body, body)
      assert.deepEqual((await execute()).body, body)
      assert.equal(handlerCalls, 1)
    }
  })
})

describe('module public port contracts', () => {
  test('expose masked response schemas and caller-transaction workflow impact only', async () => {
    const schemas: ExecutionResponseSchemaReader = {
      async latestMaskedSchemas(input) {
        return [
          {
            sourceApiId: input.sourceApiIds[0]!,
            capturedAt: new Date('2026-07-19T00:00:00.000Z'),
            fields: [{ path: '$.token', type: 'string', masked: true }],
          },
        ]
      },
    }
    const observed: UnitOfWork[] = []
    const impacts: WorkflowImpactService = {
      async listByHost() {
        return ['workflow-1']
      },
      async listByApi() {
        return ['workflow-1']
      },
      async disableImpactedWorkflows(_ids, _reason, unitOfWork) {
        observed.push(unitOfWork)
      },
    }
    const unitOfWork = { transactionId: 'caller-tx' }

    const result = await schemas.latestMaskedSchemas({
      sourceApiIds: ['api-1'],
      actorId: 'actor-1',
      hostId: 'host-1',
    })
    await impacts.disableImpactedWorkflows(['workflow-1'], 'API_DELETED', unitOfWork)

    assert.deepEqual(result[0]?.fields, [{ path: '$.token', type: 'string', masked: true }])
    assert.equal(observed[0], unitOfWork)
  })

  test('requires exact signed-manifest evidence and represents fail-closed verification', async () => {
    const registry: ApprovedAddressSetRegistry = {
      async verify(request) {
        if (request.approvalRef !== 'SEC-NET-2026-014') {
          throw new AddressSetManifestVerificationError('MISMATCH')
        }
        return {
          ...request,
          canonicalCidrs: ['192.0.2.0/24'],
          manifestVersion: '2026-07-19.3',
        }
      },
    }
    const request = {
      approvalRef: 'SEC-NET-2026-014',
      hostId: 'host-1',
      environmentKey: 'UAT',
      canonicalCidrHash: 'sha256:approved',
    }

    assert.deepEqual(await registry.verify(request), {
      ...request,
      canonicalCidrs: ['192.0.2.0/24'],
      manifestVersion: '2026-07-19.3',
    })
    await assert.rejects(
      registry.verify({ ...request, approvalRef: 'unapproved' }),
      (error: unknown) =>
        error instanceof AddressSetManifestVerificationError && error.reason === 'MISMATCH',
    )
  })
})
