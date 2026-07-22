import { randomBytes, randomUUID } from 'node:crypto'

import type { FastifyInstance, FastifyRequest } from 'fastify'

// Sprint: v1 | Feature: NFR-006/NFR-008 | Task Group: 03B Runtime composition
// Contract: ARCH-COMP-007, PR-006/008 | Pack: v1.7.21-oidc-session-error-contracts
export type TelemetryRecord = {
  timestamp: string
  level: 'info' | 'error'
  service: string
  environment: string
  trace_id: string
  request_id: string
  user_id: string | null
  operation: string
  message: string
  duration_ms: number
  http_status: number
  error_code: string | null
  error_message: string | null
}

export interface TelemetryExporter { export(record: TelemetryRecord): Promise<void> }
export interface Telemetry {
  emit(record: TelemetryRecord): Promise<void>
  readonly dropped: number
  readonly buffered: number
}

export class IsolatedTelemetry implements Telemetry {
  private readonly queue: TelemetryRecord[] = []
  private dropCount = 0

  constructor(
    private readonly exporter: TelemetryExporter,
    private readonly capacity = 100,
  ) {}

  get dropped() { return this.dropCount }
  get buffered() { return this.queue.length }

  async emit(record: TelemetryRecord): Promise<void> {
    const redacted = redactTelemetryRecord(record)
    try {
      await this.flush()
      await this.exporter.export(redacted)
    } catch {
      if (this.queue.length >= this.capacity) this.dropCount += 1
      else this.queue.push(redacted)
    }
  }

  private async flush(): Promise<void> {
    while (this.queue.length > 0) {
      const next = this.queue[0]!
      await this.exporter.export(next)
      this.queue.shift()
    }
  }
}

declare module 'fastify' {
  interface FastifyRequest { traceId: string; telemetryStartedAt: bigint }
}

export function boundedRequestId(value: unknown, fallback: () => string = uuidV7): string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : fallback()
}

function uuidV7(): string {
  const bytes = randomBytes(16)
  bytes.writeUIntBE(Date.now(), 0, 6)
  bytes[6] = (bytes[6]! & 0x0f) | 0x70
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function registerObservability(
  app: FastifyInstance,
  telemetry: Telemetry,
  options: { service: string; environment: string },
): void {
  app.decorateRequest('traceId', '')
  app.decorateRequest('telemetryStartedAt', 0n)
  app.addHook('onRequest', async (request, reply) => {
    request.traceId = randomUUID().replaceAll('-', '')
    request.telemetryStartedAt = process.hrtime.bigint()
    reply.header('X-Request-ID', request.id)
    reply.header('X-Trace-ID', request.traceId)
  })
  app.addHook('onResponse', async (request, reply) => {
    const elapsed = Number(process.hrtime.bigint() - request.telemetryStartedAt) / 1_000_000
    await telemetry.emit({
      timestamp: new Date().toISOString(),
      level: reply.statusCode >= 500 ? 'error' : 'info',
      service: options.service,
      environment: options.environment,
      trace_id: request.traceId,
      request_id: request.id,
      user_id: request.authActor?.id ?? null,
      operation: `${request.method} ${request.routeOptions.url}`,
      message: 'request_completed',
      duration_ms: elapsed,
      http_status: reply.statusCode,
      error_code: request.identityErrorCode ?? null,
      error_message: null,
    })
  })
}

function redactTelemetryRecord(record: TelemetryRecord): TelemetryRecord {
  return {
    ...record,
    user_id: record.user_id ? mask(record.user_id) : null,
    error_message: record.error_message ? sanitize(record.error_message) : null,
    message: sanitize(record.message),
  }
}

function mask(value: string): string { return `masked:${value.slice(0, 2)}***` }
function sanitize(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]')
    .replace(/(token|password|credential|secret)=([^\s&]+)/gi, '$1=[REDACTED]')
}
