import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

// Sprint: v1 | Feature: NFR-006/NFR-008/NFR-010 | Task Group: 03 Error catalog
// Contract: API-024, PR-008 | Pack: v1.7.21-oidc-session-error-contracts
export type ErrorCategory = 'validation' | 'auth' | 'business' | 'throttling' | 'system'

export type ErrorCatalogEntry = {
  code: string
  http: number
  message_key: string
  retryable: boolean
  retry_after_seconds: number | null
  recovery_actions?: Array<'RESTART_LOGIN'>
  category: ErrorCategory
  condition: string
}

export type ErrorEndpoint = {
  id: string
  auth: 'optional' | 'required'
  decrypts_session_csrf: boolean
  responses: Record<string, string[]>
}

export type ErrorCatalog = {
  version: number
  deprecated_aliases: string[]
  protected_route_inheritance: {
    codes: string[]
    csrf_decrypt_code: string
  }
  errors: ErrorCatalogEntry[]
  endpoints: ErrorEndpoint[]
}

const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/
const MESSAGE_KEY_PATTERN = /^errors\.api_lab\.[a-z0-9_]+$/
const SECRET_MARKER_PATTERN = /(password|bearer\s|private[_ -]?key|api[_ -]?key|client[_ -]?secret)/i
const RETRY_MIN = 1
const RETRY_MAX = 86_400

export function parseErrorCatalog(source: string): ErrorCatalog {
  let value: unknown
  try {
    // JSON is a YAML 1.2 subset. Keeping the committed catalog in this subset makes
    // parsing deterministic without a runtime YAML dependency in TG-03.
    value = JSON.parse(source)
  } catch (error) {
    throw new Error('errors.yml must use the deterministic JSON-compatible YAML subset.', { cause: error })
  }
  validateErrorCatalog(value)
  return value
}

export function validateErrorCatalog(value: unknown): asserts value is ErrorCatalog {
  const catalog = validateCatalogEnvelope(value)
  const deprecated = new Set(catalog.deprecated_aliases)
  const codes = validateCatalogEntries(catalog.errors, deprecated)
  validateInheritedCodes(catalog, codes)
  validateEndpoints(catalog, codes, deprecated)
}

function validateCatalogEnvelope(value: unknown): ErrorCatalog {
  if (!isRecord(value) || value.version !== 1) throw new Error('Catalog version must be 1.')
  if (!Array.isArray(value.deprecated_aliases) || !value.deprecated_aliases.every(isString)) {
    throw new Error('deprecated_aliases must be a string array.')
  }
  if (!isRecord(value.protected_route_inheritance)) throw new Error('protected_route_inheritance is required.')
  const inheritanceCodes = value.protected_route_inheritance.codes
  const csrfDecryptCode = value.protected_route_inheritance.csrf_decrypt_code
  if (!Array.isArray(inheritanceCodes) || !inheritanceCodes.every(isString) || !isString(csrfDecryptCode)) {
    throw new Error('Protected-route inheritance metadata is incomplete.')
  }
  if (!Array.isArray(value.errors) || !Array.isArray(value.endpoints)) {
    throw new Error('Catalog errors and endpoints arrays are required.')
  }
  return value as ErrorCatalog
}

function validateCatalogEntries(entries: unknown[], deprecated: Set<string>): Map<string, ErrorCatalogEntry> {
  const codes = new Map<string, ErrorCatalogEntry>()
  for (const candidate of entries) {
    if (!isErrorEntry(candidate)) throw new Error('Every error requires complete typed metadata.')
    validateErrorIdentity(candidate, codes, deprecated)
    validateRetryMetadata(candidate)
    validateRecoveryActions(candidate)
    if (candidate.category !== categoryForHttp(candidate.http)) {
      throw new Error(`${candidate.code} category conflicts with HTTP ${candidate.http}.`)
    }
    codes.set(candidate.code, candidate)
  }
  return codes
}

function validateErrorIdentity(candidate: ErrorCatalogEntry, codes: Map<string, ErrorCatalogEntry>, deprecated: Set<string>): void {
  if (!CODE_PATTERN.test(candidate.code)) throw new Error(`Invalid error code ${candidate.code}.`)
  if (!MESSAGE_KEY_PATTERN.test(candidate.message_key)) throw new Error(`Invalid message_key for ${candidate.code}.`)
  if (candidate.message_key !== `errors.api_lab.${candidate.code.toLowerCase()}`) {
    throw new Error(`message_key does not match code ${candidate.code}.`)
  }
  if (codes.has(candidate.code)) throw new Error(`Duplicate error code ${candidate.code}.`)
  if (deprecated.has(candidate.code)) throw new Error(`Deprecated alias ${candidate.code} is active.`)
  if (SECRET_MARKER_PATTERN.test(candidate.condition)) {
    throw new Error(`Potential secret marker found in ${candidate.code} metadata.`)
  }
}

function validateRetryMetadata(candidate: ErrorCatalogEntry): void {
  const mustRetry = candidate.http === 429 || candidate.http === 503
  if (mustRetry !== candidate.retryable) {
    throw new Error(`${candidate.code} retryable metadata conflicts with HTTP ${candidate.http}.`)
  }
  if (!mustRetry && candidate.retry_after_seconds !== null) {
    throw new Error(`${candidate.code} must omit retry_after_seconds.`)
  }
  if (mustRetry && (!Number.isInteger(candidate.retry_after_seconds)
    || candidate.retry_after_seconds! < RETRY_MIN
    || candidate.retry_after_seconds! > RETRY_MAX)) {
    throw new Error(`${candidate.code} requires retry_after_seconds in [1,86400].`)
  }
}

function validateRecoveryActions(candidate: ErrorCatalogEntry): void {
  if (candidate.recovery_actions === undefined) return
  if (candidate.http !== 503 || candidate.recovery_actions.length !== 1 || candidate.recovery_actions[0] !== 'RESTART_LOGIN') {
    throw new Error(`${candidate.code} has invalid recovery_actions metadata.`)
  }
}

function validateInheritedCodes(catalog: ErrorCatalog, codes: Map<string, ErrorCatalogEntry>): void {
  const required = [...catalog.protected_route_inheritance.codes, catalog.protected_route_inheritance.csrf_decrypt_code]
  for (const code of required) {
    if (!codes.has(code)) throw new Error(`Inherited code ${code} is missing from the catalog.`)
  }
}

function validateEndpoints(catalog: ErrorCatalog, codes: Map<string, ErrorCatalogEntry>, deprecated: Set<string>): void {
  const endpointIds = new Set<string>()
  for (const candidate of catalog.endpoints) {
    if (!isEndpoint(candidate)) throw new Error('Every endpoint requires complete metadata.')
    if (endpointIds.has(candidate.id)) throw new Error(`Duplicate endpoint ${candidate.id}.`)
    endpointIds.add(candidate.id)
    validateEndpointResponses(candidate, resolveEndpointCodes(candidate, catalog), catalog, codes, deprecated)
  }
}

function validateEndpointResponses(
  endpoint: ErrorEndpoint,
  resolved: Record<string, string[]>,
  catalog: ErrorCatalog,
  codes: Map<string, ErrorCatalogEntry>,
  deprecated: Set<string>,
): void {
  for (const [status, endpointCodes] of Object.entries(resolved)) {
    const http = Number(status)
    if (!Number.isInteger(http)) throw new Error(`${endpoint.id} has invalid status ${status}.`)
    for (const code of endpointCodes) validateEndpointCode(endpoint.id, code, http, codes, deprecated)
  }
  if (endpoint.auth !== 'required') return
  const emitted = new Set(Object.values(resolved).flat())
  for (const inherited of catalog.protected_route_inheritance.codes) {
    if (!emitted.has(inherited)) throw new Error(`${endpoint.id} removed inherited code ${inherited}.`)
  }
}

function validateEndpointCode(
  endpointId: string,
  code: string,
  http: number,
  codes: Map<string, ErrorCatalogEntry>,
  deprecated: Set<string>,
): void {
  if (deprecated.has(code)) throw new Error(`${endpointId} emits deprecated alias ${code}.`)
  const metadata = codes.get(code)
  if (!metadata) throw new Error(`${endpointId} references unknown code ${code}.`)
  if (metadata.http !== http) throw new Error(`${endpointId} maps ${code} to wrong HTTP ${http}.`)
}

export function resolveEndpointCodes(endpoint: ErrorEndpoint, catalog: ErrorCatalog): Record<string, string[]> {
  const result: Record<string, string[]> = Object.fromEntries(
    Object.entries(endpoint.responses).map(([status, codes]) => [status, [...codes]]),
  )
  if (endpoint.auth === 'required') {
    for (const code of catalog.protected_route_inheritance.codes) addCode(result, catalog, code)
  }
  if (endpoint.decrypts_session_csrf) {
    addCode(result, catalog, catalog.protected_route_inheritance.csrf_decrypt_code)
  }
  for (const codes of Object.values(result)) codes.sort()
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => Number(left) - Number(right)))
}

export function renderGeneratedTypeScript(catalog: ErrorCatalog): string {
  const resolvedEndpoints = Object.fromEntries(
    catalog.endpoints.map((endpoint) => [endpoint.id, resolveEndpointCodes(endpoint, catalog)]),
  )
  return `// Generated from backend/errors.yml. Do not edit.\n` +
    `export const ERROR_METADATA = ${JSON.stringify(Object.fromEntries(catalog.errors.map((entry) => [entry.code, entry])), null, 2)} as const\n\n` +
    `export type ErrorCode = keyof typeof ERROR_METADATA\n\n` +
    `export const ENDPOINT_ERROR_CODES = ${JSON.stringify(resolvedEndpoints, null, 2)} as const\n`
}

export function renderGeneratedOpenApi(catalog: ErrorCatalog): string {
  const schemas = Object.fromEntries(catalog.errors.map((entry) => [entry.code, {
    description: entry.condition,
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message', 'request_id', 'trace_id', ...(entry.retry_after_seconds === null ? [] : ['details'])],
        properties: {
          code: { const: entry.code },
          message: { type: 'string' },
          request_id: { type: 'string' },
          trace_id: { type: 'string' },
          ...(entry.retry_after_seconds === null ? {} : {
            details: {
              type: 'object',
              required: ['retry_after_seconds'],
              properties: {
                retry_after_seconds: { type: 'integer', minimum: 1, maximum: 86_400 },
                ...(entry.recovery_actions === undefined ? {} : {
                  recovery_action: { type: 'string', enum: entry.recovery_actions },
                }),
              },
            },
          }),
        },
      },
    },
  }]))
  const endpoints = Object.fromEntries(catalog.endpoints.map((endpoint) => [
    endpoint.id,
    Object.fromEntries(Object.entries(resolveEndpointCodes(endpoint, catalog)).map(([status, codes]) => [status, {
      oneOf: codes.map((code) => ({ $ref: `#/components/schemas/${code}` })),
      ...(status === '429' || status === '503' ? {
        headers: { 'Retry-After': { schema: { type: 'integer', minimum: 1, maximum: 86_400 } } },
      } : {}),
    }])),
  ]))
  return `${JSON.stringify({ components: { schemas }, 'x-api-lab-endpoint-errors': endpoints }, null, 2)}\n`
}

export async function generateErrorCatalogFiles(options: {
  catalogPath: string
  typescriptPath: string
  openApiPath: string
  check: boolean
}): Promise<void> {
  const catalog = parseErrorCatalog(await readFile(options.catalogPath, 'utf8'))
  const outputs = [
    [options.typescriptPath, renderGeneratedTypeScript(catalog)],
    [options.openApiPath, renderGeneratedOpenApi(catalog)],
  ] as const
  if (options.check) {
    for (const [path, expected] of outputs) {
      let actual: string
      try { actual = await readFile(path, 'utf8') } catch { throw new Error(`Generated output is missing: ${path}`) }
      if (actual !== expected) throw new Error(`Generated output is stale: ${path}`)
    }
    return
  }

  const temporaryPaths: string[] = []
  try {
    for (const [path, contents] of outputs) {
      await mkdir(dirname(path), { recursive: true })
      const temporary = `${path}.tmp-${process.pid}`
      temporaryPaths.push(temporary)
      await writeFile(temporary, contents, { encoding: 'utf8', flag: 'wx' })
    }
    await commitGeneratedOutputs(
      outputs.map(([path]) => path),
      temporaryPaths,
    )
  } finally {
    await Promise.all(temporaryPaths.map((path) => rm(path, { force: true })))
  }
}

type MoveFile = (source: string, target: string) => Promise<void>

export async function commitGeneratedOutputs(
  outputPaths: readonly string[],
  temporaryPaths: readonly string[],
  move: MoveFile = rename,
): Promise<void> {
  if (outputPaths.length !== temporaryPaths.length) throw new Error('Generated output transaction is incomplete.')
  const transaction = `${process.pid}-${Date.now()}`
  const backups = new Map<string, string>()
  const committed: string[] = []
  try {
    for (let index = 0; index < outputPaths.length; index += 1) {
      const output = outputPaths[index]!
      if (!(await pathExists(output))) continue
      const backup = `${output}.backup-${transaction}-${index}`
      await move(output, backup)
      backups.set(output, backup)
    }
    for (let index = 0; index < outputPaths.length; index += 1) {
      await move(temporaryPaths[index]!, outputPaths[index]!)
      committed.push(outputPaths[index]!)
    }
  } catch (error) {
    await Promise.allSettled(committed.map((path) => rm(path, { force: true })))
    for (const [output, backup] of [...backups.entries()].reverse()) {
      if (await pathExists(backup)) await rename(backup, output)
    }
    throw error
  }
  await Promise.all([...backups.values()].map((path) => rm(path, { force: true })))
}

async function pathExists(path: string): Promise<boolean> {
  try { await access(path); return true } catch { return false }
}

function addCode(target: Record<string, string[]>, catalog: ErrorCatalog, code: string): void {
  const entry = catalog.errors.find((candidate) => candidate.code === code)
  if (!entry) throw new Error(`Unknown inherited code ${code}.`)
  const bucket = target[String(entry.http)] ??= []
  if (!bucket.includes(code)) bucket.push(code)
}

function categoryForHttp(http: number): ErrorCategory {
  if (http === 400 || http === 422) return 'validation'
  if (http === 401 || http === 403) return 'auth'
  if (http === 404 || http === 409) return 'business'
  if (http === 429) return 'throttling'
  return 'system'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function isString(value: unknown): value is string { return typeof value === 'string' }
function isErrorEntry(value: unknown): value is ErrorCatalogEntry {
  return isRecord(value) && isString(value.code) && Number.isInteger(value.http) &&
    isString(value.message_key) && typeof value.retryable === 'boolean' &&
    (value.retry_after_seconds === null || Number.isInteger(value.retry_after_seconds)) &&
    (value.recovery_actions === undefined || (Array.isArray(value.recovery_actions) && value.recovery_actions.every(isString))) &&
    isString(value.category) && isString(value.condition)
}
function isEndpoint(value: unknown): value is ErrorEndpoint {
  return isRecord(value) && isString(value.id) && (value.auth === 'required' || value.auth === 'optional') &&
    typeof value.decrypts_session_csrf === 'boolean' && isRecord(value.responses) &&
    Object.values(value.responses).every((codes) => Array.isArray(codes) && codes.every(isString))
}
