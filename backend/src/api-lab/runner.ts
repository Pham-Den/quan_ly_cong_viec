import { Buffer } from 'node:buffer'

export const apiResponseBodyLimit = 200_000

type KeyValuePair = {
  key?: unknown
  value?: unknown
  enabled?: unknown
}

type ApiRequestRecord = {
  method: string
  url: string
  queryJson: string
  headersJson: string
  bodyType: string
  bodyText: string | null
  authJson: string
  timeoutMs: number
}

type ApiEnvironmentRecord = {
  baseUrl: string | null
  variables: Array<{
    key: string
    secret: boolean
    variants: Array<{
      name: string
      value: string
      enabled: boolean
    }>
  }>
} | null

type TaskRecord = {
  id: string
  code: string
  title: string
  status: string
  workStatus: string
  priority: string
  type: string
  targetDate: Date | string | null
  doneAt: Date | string | null
} | null

export type ResolvedApiRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body: BodyInit | null
  timeoutMs: number
}

export type ExecuteApiResult = {
  status: 'PASSED' | 'FAILED'
  httpStatus: number | null
  durationMs: number
  headers: Record<string, string>
  bodyPreview: string
  originalSize: number
  truncated: boolean
  errorMessage: string | null
}

function parseJsonArray(json: string): unknown[] {
  try {
    const parsed = JSON.parse(json)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseJsonObject(json: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(json)

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function keyValuePairs(json: string) {
  return parseJsonArray(json)
    .map((item) => (item && typeof item === 'object' ? (item as KeyValuePair) : null))
    .filter((item): item is KeyValuePair => Boolean(item))
    .filter((item) => item.enabled !== false && text(item.key).trim())
    .map((item) => ({
      key: text(item.key).trim(),
      value: text(item.value),
    }))
}

export function recordFromUnknown(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, text(entryValue)]),
  ) as Record<string, string>
}

export function buildVariableContext(
  environment: ApiEnvironmentRecord,
  task: TaskRecord,
  runtimeVariables: Record<string, string>,
  variableVariants: Record<string, string>,
) {
  const values: Record<string, string> = {}
  const secretValues: string[] = []

  if (environment?.baseUrl) {
    values.baseUrl = environment.baseUrl
  }

  for (const variable of environment?.variables ?? []) {
    const variantName = variableVariants[variable.key]
    const selectedVariant =
      (variantName ? variable.variants.find((variant) => variant.name === variantName) : null) ??
      variable.variants.find((variant) => variant.enabled) ??
      variable.variants[0]

    if (!selectedVariant) {
      continue
    }

    values[variable.key] = selectedVariant.value

    if (variable.secret && selectedVariant.value) {
      secretValues.push(selectedVariant.value)
    }
  }

  if (task) {
    values.taskId = task.id
    values.taskCode = task.code
    values.taskTitle = task.title
    values['task.id'] = task.id
    values['task.code'] = task.code
    values['task.title'] = task.title
    values['task.status'] = task.status
    values['task.workStatus'] = task.workStatus
    values['task.priority'] = task.priority
    values['task.type'] = task.type
    values['task.targetDate'] = task.targetDate ? new Date(task.targetDate).toISOString() : ''
    values['task.doneAt'] = task.doneAt ? new Date(task.doneAt).toISOString() : ''
  }

  return {
    values: {
      ...values,
      ...runtimeVariables,
    },
    secretValues,
  }
}

export function resolveTemplate(input: string, variables: Record<string, string>) {
  return input.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) => variables[key.trim()] ?? '')
}

function hasHeader(headers: Record<string, string>, key: string) {
  const lowerKey = key.toLowerCase()

  return Object.keys(headers).some((headerKey) => headerKey.toLowerCase() === lowerKey)
}

function createUrl(rawUrl: string, baseUrl?: string) {
  try {
    return new URL(rawUrl).toString()
  } catch {
    if (!baseUrl) {
      throw new Error('INVALID_URL')
    }

    return new URL(rawUrl, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString()
  }
}

function bodyFromRequest(request: ApiRequestRecord, variables: Record<string, string>, headers: Record<string, string>) {
  const bodyText = request.bodyText ? resolveTemplate(request.bodyText, variables) : ''
  const bodyType = request.bodyType.toUpperCase()

  if (bodyType === 'NONE' || !bodyText) {
    return null
  }

  if (bodyType === 'JSON') {
    if (!hasHeader(headers, 'content-type')) {
      headers['content-type'] = 'application/json'
    }

    return bodyText
  }

  if (bodyType === 'FORM') {
    if (!hasHeader(headers, 'content-type')) {
      headers['content-type'] = 'application/x-www-form-urlencoded'
    }

    const form = new URLSearchParams()

    try {
      const parsed = JSON.parse(bodyText)

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === 'object') {
            const pair = item as KeyValuePair
            const key = text(pair.key).trim()

            if (key && pair.enabled !== false) {
              form.append(key, text(pair.value))
            }
          }
        }
      } else if (parsed && typeof parsed === 'object') {
        for (const [key, value] of Object.entries(parsed)) {
          form.append(key, text(value))
        }
      }
    } catch {
      return bodyText
    }

    return form
  }

  return bodyText
}

function applyAuth(request: ApiRequestRecord, variables: Record<string, string>, headers: Record<string, string>) {
  const auth = parseJsonObject(request.authJson)
  const authType = text(auth.type).toUpperCase()

  if (!authType || authType === 'NONE') {
    return
  }

  if (authType === 'BEARER' && !hasHeader(headers, 'authorization')) {
    const token = resolveTemplate(text(auth.token), variables)

    if (token) {
      headers.authorization = `Bearer ${token}`
    }
  }

  if (authType === 'BASIC' && !hasHeader(headers, 'authorization')) {
    const username = resolveTemplate(text(auth.username), variables)
    const password = resolveTemplate(text(auth.password), variables)

    headers.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  }
}

export function buildResolvedRequest(
  request: ApiRequestRecord,
  variables: Record<string, string>,
  timeoutOverrideMs?: number,
): ResolvedApiRequest {
  const rawUrl = resolveTemplate(request.url, variables)
  const url = new URL(createUrl(rawUrl, variables.baseUrl))

  for (const pair of keyValuePairs(request.queryJson)) {
    url.searchParams.append(resolveTemplate(pair.key, variables), resolveTemplate(pair.value, variables))
  }

  const headers: Record<string, string> = {}

  for (const pair of keyValuePairs(request.headersJson)) {
    headers[resolveTemplate(pair.key, variables)] = resolveTemplate(pair.value, variables)
  }

  applyAuth(request, variables, headers)

  return {
    url: url.toString(),
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? null : bodyFromRequest(request, variables, headers),
    timeoutMs: Math.max(1, timeoutOverrideMs ?? request.timeoutMs),
  }
}

async function readResponsePreview(response: Response, limit: number) {
  if (!response.body) {
    return {
      bodyPreview: '',
      originalSize: 0,
      truncated: false,
    }
  }

  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let originalSize = 0
  let truncated = false

  while (true) {
    const result = await reader.read()

    if (result.done) {
      break
    }

    const chunk = Buffer.from(result.value)
    originalSize += chunk.byteLength

    if (!truncated) {
      const currentSize = chunks.reduce((total, item) => total + item.byteLength, 0)
      const remaining = limit - currentSize

      if (remaining > 0) {
        chunks.push(chunk.subarray(0, remaining))
      }

      if (chunk.byteLength > remaining) {
        truncated = true
        await reader.cancel()
        break
      }
    }
  }

  return {
    bodyPreview: Buffer.concat(chunks).toString('utf8'),
    originalSize,
    truncated,
  }
}

export async function executeResolvedRequest(request: ResolvedApiRequest): Promise<ExecuteApiResult> {
  const startedAt = Date.now()
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), request.timeoutMs)

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: abortController.signal,
    })
    const preview = await readResponsePreview(response, apiResponseBodyLimit)
    const durationMs = Date.now() - startedAt
    const headers = Object.fromEntries(response.headers.entries())

    return {
      status: response.status >= 200 && response.status < 400 ? 'PASSED' : 'FAILED',
      httpStatus: response.status,
      durationMs,
      headers,
      bodyPreview: preview.bodyPreview,
      originalSize: preview.originalSize,
      truncated: preview.truncated,
      errorMessage: null,
    }
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const isAbort = error instanceof Error && error.name === 'AbortError'

    return {
      status: 'FAILED',
      httpStatus: null,
      durationMs,
      headers: {},
      bodyPreview: '',
      originalSize: 0,
      truncated: false,
      errorMessage: isAbort ? 'Request timeout.' : error instanceof Error ? error.message : 'Khong goi duoc API.',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function maskKnownSecrets(value: string, secretValues: string[]) {
  return secretValues
    .filter(Boolean)
    .reduce((nextValue, secret) => nextValue.split(secret).join('********'), value)
}

export function maskHeaders(headers: Record<string, string>, secretValues: string[]) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, maskKnownSecrets(value, secretValues)]),
  )
}
