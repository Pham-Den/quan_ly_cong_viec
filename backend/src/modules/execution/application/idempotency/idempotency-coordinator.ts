import type { UnitOfWork } from '../../../../shared/unit-of-work/index.js'

// Sprint: v1 | Feature: NFR-003/NFR-004 | Task Group: 01 Shared contracts
// Contract: API-004–007/009/011/021/022 | Project: PR-005/008
// Pack: v1.7.20-canonical-task-group-headings
export const IDEMPOTENCY_TTL_HOURS = 24
export const IDEMPOTENCY_RESPONSE_MAX_BYTES = 65_536

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export type IdempotencyScope = {
  actorId: string
  routeKey: string
  idempotencyKey: string
}

export type IdempotencyRequest = {
  scope: IdempotencyScope
  requestHash: string
}

export type IdempotentMutationResponse = {
  statusCode: number
  body: JsonValue
  resourceId?: string
}

export type StoredIdempotencyRecord = IdempotencyScope & {
  requestHash: string
  resourceId?: string
  responseStatus: number
  responseBodyJson: string
  expiresAt: Date
}

export interface IdempotencyRecordRepository {
  findActive(scope: IdempotencyScope, now: Date, unitOfWork: UnitOfWork): Promise<StoredIdempotencyRecord | null>
  save(record: StoredIdempotencyRecord, unitOfWork: UnitOfWork): Promise<void>
}

export interface Clock {
  now(): Date
}

export interface IdempotencyCoordinator {
  execute(
    request: IdempotencyRequest,
    unitOfWork: UnitOfWork,
    handler: (unitOfWork: UnitOfWork) => Promise<IdempotentMutationResponse>,
  ): Promise<IdempotentMutationResponse>
}

export class IdempotencyKeyReusedError extends Error {
  readonly code = 'IDEMPOTENCY_KEY_REUSED'

  constructor() {
    super('The Idempotency-Key was already used with a different request payload.')
    this.name = 'IdempotencyKeyReusedError'
  }
}

export class IdempotencyResponseTooLargeError extends Error {
  readonly code = 'IDEMPOTENCY_RESPONSE_TOO_LARGE'

  constructor(readonly actualBytes: number) {
    super(`The serialized idempotent response exceeds ${IDEMPOTENCY_RESPONSE_MAX_BYTES} bytes.`)
    this.name = 'IdempotencyResponseTooLargeError'
  }
}

export class StandardIdempotencyCoordinator implements IdempotencyCoordinator {
  constructor(
    private readonly records: IdempotencyRecordRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    request: IdempotencyRequest,
    unitOfWork: UnitOfWork,
    handler: (unitOfWork: UnitOfWork) => Promise<IdempotentMutationResponse>,
  ): Promise<IdempotentMutationResponse> {
    const now = this.clock.now()
    const existing = await this.records.findActive(request.scope, now, unitOfWork)

    if (existing) {
      if (existing.requestHash !== request.requestHash) {
        throw new IdempotencyKeyReusedError()
      }

      return {
        statusCode: existing.responseStatus,
        body: JSON.parse(existing.responseBodyJson) as JsonValue,
        ...(existing.resourceId ? { resourceId: existing.resourceId } : {}),
      }
    }

    const response = await handler(unitOfWork)
    const responseBodyJson = JSON.stringify(response.body)
    const responseBytes = Buffer.byteLength(responseBodyJson, 'utf8')

    if (responseBytes > IDEMPOTENCY_RESPONSE_MAX_BYTES) {
      throw new IdempotencyResponseTooLargeError(responseBytes)
    }

    await this.records.save(
      {
        ...request.scope,
        requestHash: request.requestHash,
        ...(response.resourceId ? { resourceId: response.resourceId } : {}),
        responseStatus: response.statusCode,
        responseBodyJson,
        expiresAt: new Date(now.getTime() + IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1_000),
      },
      unitOfWork,
    )

    return response
  }
}
