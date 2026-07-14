import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'
import { parseCurlCommand } from './curl.js'
import {
  buildResolvedRequest,
  buildVariableContext,
  executeResolvedRequest,
  maskHeaders,
  maskKnownSecrets,
  recordFromUnknown,
} from './runner.js'

type ApiLabRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

type ApiEnvironmentVariableWriter = Pick<AppPrismaClient, 'apiEnvironmentVariable'>

type Params = {
  environmentId?: string
  requestId?: string
  flowId?: string
  stepId?: string
  runId?: string
}

type VariantInput = {
  name?: unknown
  value?: unknown
  enabled?: unknown
  sortOrder?: unknown
}

type VariableInput = {
  key?: unknown
  value?: unknown
  secret?: unknown
  description?: unknown
  sortOrder?: unknown
  variants?: unknown
}

type EnvironmentBody = {
  projectId?: unknown
  name?: unknown
  environmentType?: unknown
  baseUrl?: unknown
  description?: unknown
  enabled?: unknown
  sortOrder?: unknown
  variables?: unknown
}

type ApiRequestBody = {
  projectId?: unknown
  taskId?: unknown
  collectionName?: unknown
  name?: unknown
  description?: unknown
  method?: unknown
  url?: unknown
  query?: unknown
  headers?: unknown
  bodyType?: unknown
  bodyText?: unknown
  auth?: unknown
  assertionRules?: unknown
  timeoutMs?: unknown
  storeResponseBody?: unknown
  sortOrder?: unknown
}

type ApiFlowBody = {
  projectId?: unknown
  taskId?: unknown
  collectionName?: unknown
  name?: unknown
  description?: unknown
  enabled?: unknown
  storeResponseBody?: unknown
  sortOrder?: unknown
}

type ApiFlowStepBody = {
  requestId?: unknown
  name?: unknown
  sortOrder?: unknown
  override?: unknown
  captureRules?: unknown
  assertionRules?: unknown
  continueOnFailure?: unknown
}

type RunRequestBody = {
  environmentId?: unknown
  variableVariants?: unknown
  runtimeVariables?: unknown
  saveResponseBody?: unknown
  timeoutMs?: unknown
}

type CurlImportBody = {
  curl?: unknown
}

type SaveResponseBody = {
  statusCode?: unknown
  headers?: unknown
  bodyText?: unknown
  contentType?: unknown
  originalSize?: unknown
  truncated?: unknown
}

type AttachRunBody = {
  note?: unknown
}

type CaptureRule = {
  source: 'JSON' | 'HEADER' | 'STATUS' | 'TEXT'
  variableName: string
  path: string
  header: string
  required: boolean
  secret: boolean
}

type AssertionRule = {
  type: 'STATUS_EQUALS' | 'JSON_PATH_EXISTS' | 'JSON_PATH_EQUALS' | 'BODY_CONTAINS' | 'HEADER_EXISTS' | 'DURATION_BELOW'
  label: string
  path: string
  expected: string
  header: string
  maxDurationMs: number
  required: boolean
  enabled: boolean
}

type AssertionSummary = {
  total: number
  passed: number
  failed: number
  requiredFailed: number
  results: Array<{
    label: string
    type: string
    passed: boolean
    required: boolean
    message: string
  }>
}

type StepRequestRecord = {
  method: string
  url: string
  queryJson: string
  headersJson: string
  bodyType: string
  bodyText: string | null
  authJson: string
  assertionRulesJson?: string
  timeoutMs: number
  storeResponseBody: boolean
}

const environmentTypes = new Set(['LOCAL', 'DEV', 'UAT', 'PROD', 'CUSTOM'])
const httpMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
const bodyTypes = new Set(['NONE', 'JSON', 'TEXT', 'FORM', 'FORM_DATA'])

function bodyAs<T>(body: unknown) {
  return body && typeof body === 'object' ? (body as T) : ({} as T)
}

function paramsAs(params: unknown) {
  return bodyAs<Params>(params)
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function nullableText(value: unknown) {
  const nextValue = text(value)

  return nextValue || null
}

function numberValue(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  const parsed = Number(text(value))

  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function dateValue(value: string | null, endOfDay = false) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(23, 59, 59, 999)
  }

  return date
}

function normalizeEnvironmentType(value: unknown, fallback = 'CUSTOM') {
  const nextValue = text(value).toUpperCase()

  return environmentTypes.has(nextValue) ? nextValue : fallback
}

function normalizeMethod(value: unknown, fallback = 'GET') {
  const nextValue = text(value).toUpperCase()

  return httpMethods.has(nextValue) ? nextValue : fallback
}

function normalizeBodyType(value: unknown, fallback = 'NONE') {
  const nextValue = text(value).toUpperCase()

  return bodyTypes.has(nextValue) ? nextValue : fallback
}

function jsonString(value: unknown, fallback: string) {
  if (value === undefined) {
    return fallback
  }

  if (typeof value === 'string') {
    const nextValue = value.trim()

    if (!nextValue) {
      return fallback
    }

    try {
      return JSON.stringify(JSON.parse(nextValue))
    } catch {
      return JSON.stringify(nextValue)
    }
  }

  return JSON.stringify(value ?? JSON.parse(fallback))
}

function jsonArrayString(value: unknown, fallback = '[]') {
  const nextValue = jsonString(value, fallback)

  try {
    return Array.isArray(JSON.parse(nextValue)) ? nextValue : fallback
  } catch {
    return fallback
  }
}

function jsonObjectString(value: unknown, fallback = '{}') {
  const nextValue = jsonString(value, fallback)

  try {
    const parsed = JSON.parse(nextValue)

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? nextValue : fallback
  } catch {
    return fallback
  }
}

function normalizeCollectionName(value: unknown, fallback = 'Mac dinh') {
  return text(value) || fallback
}

function maskSecretValue(value: string, secret: boolean) {
  if (!secret) {
    return value
  }

  return value ? '********' : ''
}

function parseJsonValue(json: string, fallback: unknown) {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

function parseJsonObjectValue(json: string) {
  const parsed = parseJsonValue(json, {})

  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
}

function parseJsonArrayValue(json: string) {
  const parsed = parseJsonValue(json, [])

  return Array.isArray(parsed) ? parsed : []
}

function normalizeCaptureSource(value: unknown) {
  const source = text(value).toUpperCase()

  if (['JSON', 'HEADER', 'STATUS', 'TEXT'].includes(source)) {
    return source as CaptureRule['source']
  }

  if (source === 'BODY' || source === 'RAW') {
    return 'TEXT'
  }

  return 'JSON'
}

function normalizeCaptureRules(value: string) {
  return parseJsonArrayValue(value)
    .map((item) => {
      const rule = bodyAs<{
        source?: unknown
        type?: unknown
        path?: unknown
        header?: unknown
        as?: unknown
        name?: unknown
        variableName?: unknown
        required?: unknown
        secret?: unknown
      }>(item)
      const variableName = text(rule.as) || text(rule.variableName) || text(rule.name)

      if (!variableName) {
        return null
      }

      return {
        source: normalizeCaptureSource(rule.source ?? rule.type),
        variableName,
        path: text(rule.path),
        header: text(rule.header),
        required: booleanValue(rule.required, false),
        secret: booleanValue(rule.secret, false),
      }
    })
    .filter((rule): rule is CaptureRule => Boolean(rule))
}

function jsonPathSegments(path: string) {
  const normalizedPath = path.trim().replace(/^\$\.?/, '')
  const segments: string[] = []
  const segmentPattern = /([^.[\]]+)|\[(\d+|"[^"]+"|'[^']+')\]/g

  for (const match of normalizedPath.matchAll(segmentPattern)) {
    const rawSegment = match[1] ?? match[2] ?? ''
    const segment = rawSegment.replace(/^["']|["']$/g, '')

    if (segment) {
      segments.push(segment)
    }
  }

  return segments
}

function readJsonPath(bodyText: string, path: string) {
  const parsed = parseJsonValue(bodyText, undefined)

  if (parsed === undefined) {
    return null
  }

  if (!path.trim() || path.trim() === '$') {
    return parsed
  }

  let currentValue = parsed

  for (const segment of jsonPathSegments(path)) {
    if (Array.isArray(currentValue)) {
      currentValue = currentValue[Number(segment)]
    } else if (currentValue && typeof currentValue === 'object') {
      currentValue = (currentValue as Record<string, unknown>)[segment]
    } else {
      return null
    }

    if (currentValue === undefined || currentValue === null) {
      return null
    }
  }

  return currentValue
}

function extractedValueToString(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

function headerValue(headers: Record<string, string>, headerName: string) {
  const lowerHeaderName = headerName.toLowerCase()
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === lowerHeaderName)

  return entry?.[1] ?? ''
}

function extractCaptureValue(rule: CaptureRule, result: { httpStatus: number | null; headers: Record<string, string>; bodyPreview: string }) {
  if (rule.source === 'STATUS') {
    return result.httpStatus === null ? '' : String(result.httpStatus)
  }

  if (rule.source === 'HEADER') {
    return headerValue(result.headers, rule.header || rule.path)
  }

  if (rule.source === 'TEXT') {
    return result.bodyPreview
  }

  return extractedValueToString(readJsonPath(result.bodyPreview, rule.path || '$'))
}

function evaluateCaptureRules(
  rules: CaptureRule[],
  result: { httpStatus: number | null; headers: Record<string, string>; bodyPreview: string },
) {
  const values: Record<string, string> = {}
  const publicValues: Record<string, string> = {}
  const secretValues: string[] = []
  const missingRequired = rules
    .map((rule) => {
      const value = extractCaptureValue(rule, result)

      if (!value) {
        return rule.required ? rule.variableName : ''
      }

      values[rule.variableName] = value
      publicValues[rule.variableName] = rule.secret ? '********' : value

      if (rule.secret) {
        secretValues.push(value)
      }

      return ''
    })
    .filter(Boolean)

  return {
    values,
    publicValues,
    secretValues,
    missingRequired,
  }
}

function normalizeAssertionType(value: unknown) {
  const type = text(value).toUpperCase()

  if (['STATUS_EQUALS', 'STATUS'].includes(type)) {
    return 'STATUS_EQUALS'
  }

  if (['JSON_PATH_EXISTS', 'JSON_EXISTS'].includes(type)) {
    return 'JSON_PATH_EXISTS'
  }

  if (['JSON_PATH_EQUALS', 'JSON_EQUALS'].includes(type)) {
    return 'JSON_PATH_EQUALS'
  }

  if (['BODY_CONTAINS', 'TEXT_CONTAINS'].includes(type)) {
    return 'BODY_CONTAINS'
  }

  if (['HEADER_EXISTS', 'HEADER'].includes(type)) {
    return 'HEADER_EXISTS'
  }

  if (['DURATION_BELOW', 'DURATION'].includes(type)) {
    return 'DURATION_BELOW'
  }

  return 'STATUS_EQUALS'
}

function normalizeAssertionRules(value: string) {
  return parseJsonArrayValue(value)
    .map((item) => {
      const rule = bodyAs<{
        type?: unknown
        label?: unknown
        path?: unknown
        expected?: unknown
        header?: unknown
        maxDurationMs?: unknown
        required?: unknown
        enabled?: unknown
      }>(item)
      const assertionType = normalizeAssertionType(rule.type)
      const label = text(rule.label) || assertionType.toLowerCase().replaceAll('_', ' ')

      return {
        type: assertionType,
        label,
        path: text(rule.path),
        expected: text(rule.expected),
        header: text(rule.header),
        maxDurationMs: numberValue(rule.maxDurationMs, 0),
        required: booleanValue(rule.required, true),
        enabled: booleanValue(rule.enabled, true),
      }
    })
    .filter((rule): rule is AssertionRule => Boolean(rule.enabled))
}

function valueMatchesExpected(value: unknown, expected: string) {
  if (value === undefined || value === null) {
    return false
  }

  if (typeof value === 'object') {
    return JSON.stringify(value) === expected
  }

  return String(value) === expected
}

function evaluateAssertion(
  rule: AssertionRule,
  result: { httpStatus: number | null; durationMs: number; headers: Record<string, string>; bodyPreview: string },
) {
  if (rule.type === 'STATUS_EQUALS') {
    const passed = String(result.httpStatus ?? '') === rule.expected

    return {
      passed,
      message: passed ? `Status = ${rule.expected}` : `Status ${result.httpStatus ?? 'none'} khac ${rule.expected}.`,
    }
  }

  if (rule.type === 'JSON_PATH_EXISTS') {
    const value = readJsonPath(result.bodyPreview, rule.path)
    const passed = value !== null && value !== undefined

    return {
      passed,
      message: passed ? `${rule.path} ton tai` : `Khong tim thay ${rule.path}.`,
    }
  }

  if (rule.type === 'JSON_PATH_EQUALS') {
    const value = readJsonPath(result.bodyPreview, rule.path)
    const passed = valueMatchesExpected(value, rule.expected)

    return {
      passed,
      message: passed ? `${rule.path} = ${rule.expected}` : `${rule.path} khong bang ${rule.expected}.`,
    }
  }

  if (rule.type === 'BODY_CONTAINS') {
    const passed = result.bodyPreview.includes(rule.expected)

    return {
      passed,
      message: passed ? `Body co ${rule.expected}` : `Body khong co ${rule.expected}.`,
    }
  }

  if (rule.type === 'HEADER_EXISTS') {
    const passed = Boolean(headerValue(result.headers, rule.header))

    return {
      passed,
      message: passed ? `Header ${rule.header} ton tai` : `Khong tim thay header ${rule.header}.`,
    }
  }

  const passed = rule.maxDurationMs > 0 && result.durationMs < rule.maxDurationMs

  return {
    passed,
    message: passed ? `Duration < ${rule.maxDurationMs}ms` : `Duration ${result.durationMs}ms vuot ${rule.maxDurationMs}ms.`,
  }
}

function evaluateAssertionRules(
  rules: AssertionRule[],
  result: { httpStatus: number | null; durationMs: number; headers: Record<string, string>; bodyPreview: string },
): AssertionSummary {
  const results = rules.map((rule) => {
    const assertionResult = evaluateAssertion(rule, result)

    return {
      label: rule.label,
      type: rule.type,
      passed: assertionResult.passed,
      required: rule.required,
      message: assertionResult.message,
    }
  })
  const passed = results.filter((resultItem) => resultItem.passed).length
  const failed = results.length - passed
  const requiredFailed = results.filter((resultItem) => !resultItem.passed && resultItem.required).length

  return {
    total: results.length,
    passed,
    failed,
    requiredFailed,
    results,
  }
}

function mergeAssertionSummaries(summaries: AssertionSummary[]): AssertionSummary {
  const results = summaries.flatMap((summary) => summary.results)
  const passed = results.filter((resultItem) => resultItem.passed).length
  const failed = results.length - passed
  const requiredFailed = results.filter((resultItem) => !resultItem.passed && resultItem.required).length

  return {
    total: results.length,
    passed,
    failed,
    requiredFailed,
    results,
  }
}

function firstRequiredAssertionFailure(summary: AssertionSummary) {
  return summary.results.find((result) => !result.passed && result.required)?.message ?? null
}

function assertionSummaryFromJson(value: string): AssertionSummary {
  try {
    const parsed = JSON.parse(value) as Partial<AssertionSummary>

    return {
      total: Number(parsed.total || 0),
      passed: Number(parsed.passed || 0),
      failed: Number(parsed.failed || 0),
      requiredFailed: Number(parsed.requiredFailed || 0),
      results: Array.isArray(parsed.results) ? parsed.results as AssertionSummary['results'] : [],
    }
  } catch {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      requiredFailed: 0,
      results: [],
    }
  }
}

function assertionSummaryText(value: string) {
  const summary = assertionSummaryFromJson(value)

  if (!summary.total) {
    return 'Assertions 0'
  }

  return `Assertions ${summary.passed}/${summary.total}`
}

function stepRequestRecord(step: {
  name: string
  overrideJson: string
  request: {
    collectionName: string
    name: string
    description: string | null
    method: string
    url: string
    queryJson: string
    headersJson: string
    bodyType: string
    bodyText: string | null
    authJson: string
    assertionRulesJson: string
    timeoutMs: number
    storeResponseBody: boolean
    sortOrder: number
  } | null
}) {
  const override = parseJsonObjectValue(step.overrideJson)
  const fallback = step.request ?? {
    collectionName: 'Inline',
    name: step.name,
    description: null,
    method: 'GET',
    url: '',
    queryJson: '[]',
    headersJson: '[]',
    bodyType: 'NONE',
    bodyText: null,
    authJson: '{}',
    assertionRulesJson: '[]',
    timeoutMs: 30000,
    storeResponseBody: false,
    sortOrder: 0,
  }
  const payload = requestPayload(override as ApiRequestBody, fallback)

  if (!payload.url) {
    return null
  }

  return payload satisfies StepRequestRecord
}

async function ensureProject(prisma: AppPrismaClient, projectId: string, userId: string, reply: FastifyReply) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { ownerId: null }],
    },
  })

  if (!project) {
    reply.code(404).send({ message: 'Khong tim thay du an.' })
    return null
  }

  return project
}

async function ensureTaskInProject(
  prisma: AppPrismaClient,
  taskId: string | null,
  projectId: string,
  reply: FastifyReply,
) {
  if (!taskId) {
    return null
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
  })

  if (!task) {
    reply.code(400).send({ message: 'Task khong thuoc du an da chon.' })
    return false
  }

  return task
}

async function ensureEnvironment(
  prisma: AppPrismaClient,
  environmentId: string,
  userId: string,
  reply: FastifyReply,
) {
  const environment = await prisma.apiEnvironment.findFirst({
    where: {
      id: environmentId,
      project: {
        OR: [{ ownerId: userId }, { ownerId: null }],
      },
    },
  })

  if (!environment) {
    reply.code(404).send({ message: 'Khong tim thay environment API.' })
    return null
  }

  return environment
}

async function ensureApiRequest(
  prisma: AppPrismaClient,
  requestId: string,
  userId: string,
  reply: FastifyReply,
) {
  const apiRequest = await prisma.apiRequest.findFirst({
    where: {
      id: requestId,
      project: {
        OR: [{ ownerId: userId }, { ownerId: null }],
      },
    },
  })

  if (!apiRequest) {
    reply.code(404).send({ message: 'Khong tim thay API request.' })
    return null
  }

  return apiRequest
}

async function ensureApiFlow(prisma: AppPrismaClient, flowId: string, userId: string, reply: FastifyReply) {
  const flow = await prisma.apiFlow.findFirst({
    where: {
      id: flowId,
      project: {
        OR: [{ ownerId: userId }, { ownerId: null }],
      },
    },
  })

  if (!flow) {
    reply.code(404).send({ message: 'Khong tim thay API flow.' })
    return null
  }

  return flow
}

async function ensureApiFlowStep(
  prisma: AppPrismaClient,
  stepId: string,
  userId: string,
  reply: FastifyReply,
) {
  const step = await prisma.apiFlowStep.findFirst({
    where: {
      id: stepId,
      flow: {
        project: {
          OR: [{ ownerId: userId }, { ownerId: null }],
        },
      },
    },
    include: { flow: true },
  })

  if (!step) {
    reply.code(404).send({ message: 'Khong tim thay API flow step.' })
    return null
  }

  return step
}

async function ensureApiRequestRun(
  prisma: AppPrismaClient,
  runId: string,
  userId: string,
  reply: FastifyReply,
) {
  const run = await prisma.apiRequestRun.findFirst({
    where: {
      id: runId,
      project: {
        OR: [{ ownerId: userId }, { ownerId: null }],
      },
    },
  })

  if (!run) {
    reply.code(404).send({ message: 'Khong tim thay luot chay API.' })
    return null
  }

  return run
}

async function ensureRequestInProject(
  prisma: AppPrismaClient,
  requestId: string | null,
  projectId: string,
  reply: FastifyReply,
) {
  if (!requestId) {
    return null
  }

  const apiRequest = await prisma.apiRequest.findFirst({
    where: {
      id: requestId,
      projectId,
    },
  })

  if (!apiRequest) {
    reply.code(400).send({ message: 'API request khong thuoc du an cua flow.' })
    return false
  }

  return apiRequest
}

async function ensureEnvironmentInProject(
  prisma: AppPrismaClient,
  environmentId: string | null,
  projectId: string,
  reply: FastifyReply,
) {
  if (!environmentId) {
    return null
  }

  const environment = await prisma.apiEnvironment.findFirst({
    where: {
      id: environmentId,
      projectId,
    },
    include: environmentInclude(),
  })

  if (!environment) {
    reply.code(400).send({ message: 'Environment API khong thuoc du an cua request.' })
    return false
  }

  return environment
}

function normalizeVariables(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => {
      const variable = bodyAs<VariableInput>(item)
      const key = text(variable.key)

      if (!key) {
        return null
      }

      const variantsValue = Array.isArray(variable.variants)
        ? variable.variants
        : variable.value !== undefined
          ? [{ name: 'default', value: variable.value }]
          : []

      const variants = variantsValue
        .map((variantItem, variantIndex) => {
          const variant = bodyAs<VariantInput>(variantItem)
          const name = text(variant.name) || 'default'

          return {
            name,
            value: text(variant.value),
            enabled: booleanValue(variant.enabled, true),
            sortOrder: numberValue(variant.sortOrder, variantIndex),
          }
        })
        .filter((variant, variantIndex, list) => list.findIndex((item) => item.name === variant.name) === variantIndex)

      return {
        key,
        secret: booleanValue(variable.secret, false),
        description: nullableText(variable.description),
        sortOrder: numberValue(variable.sortOrder, index),
        variants,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

async function replaceEnvironmentVariables(
  prisma: ApiEnvironmentVariableWriter,
  environmentId: string,
  variablesValue: unknown,
) {
  if (!Array.isArray(variablesValue)) {
    return
  }

  const variables = normalizeVariables(variablesValue)
  const existingVariables = await prisma.apiEnvironmentVariable.findMany({
    where: { environmentId },
    include: { variants: true },
  })

  await prisma.apiEnvironmentVariable.deleteMany({ where: { environmentId } })

  for (const variable of variables) {
    const existingVariable = existingVariables.find((item) => item.key === variable.key)

    await prisma.apiEnvironmentVariable.create({
      data: {
        environmentId,
        key: variable.key,
        secret: variable.secret,
        description: variable.description,
        sortOrder: variable.sortOrder,
        variants: {
          create: variable.variants.map((variant) => {
            const existingVariant = existingVariable?.variants.find((item) => item.name === variant.name)
            const shouldKeepExistingSecret =
              variable.secret && existingVariant && (!variant.value || variant.value === '********')

            return {
              ...variant,
              value: shouldKeepExistingSecret ? existingVariant.value : variant.value,
            }
          }),
        },
      },
    })
  }
}

function publicEnvironment(environment: {
  id: string
  projectId: string
  name: string
  environmentType: string
  baseUrl: string | null
  description: string | null
  enabled: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  variables?: Array<{
    id: string
    key: string
    secret: boolean
    description: string | null
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    variants: Array<{
      id: string
      name: string
      value: string
      enabled: boolean
      sortOrder: number
      createdAt: Date
      updatedAt: Date
    }>
  }>
}) {
  return {
    ...environment,
    variables:
      environment.variables?.map((variable) => ({
        ...variable,
        variants: variable.variants.map((variant) => ({
          ...variant,
          value: maskSecretValue(variant.value, variable.secret),
          hasValue: Boolean(variant.value),
        })),
      })) ?? [],
  }
}

function environmentInclude() {
  return {
    variables: {
      orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
      include: {
        variants: {
          orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
        },
      },
    },
  }
}

function requestPayload(
  body: ApiRequestBody,
  fallback?: {
    collectionName: string
    name: string
    description: string | null
    method: string
    url: string
    queryJson: string
    headersJson: string
    bodyType: string
    bodyText: string | null
    authJson: string
    assertionRulesJson: string
    timeoutMs: number
    storeResponseBody: boolean
    sortOrder: number
  },
) {
  return {
    collectionName:
      body.collectionName === undefined
        ? fallback?.collectionName ?? 'Mac dinh'
        : normalizeCollectionName(body.collectionName),
    name: body.name === undefined ? fallback?.name ?? '' : text(body.name),
    description:
      body.description === undefined ? fallback?.description ?? null : nullableText(body.description),
    method: normalizeMethod(body.method, fallback?.method ?? 'GET'),
    url: body.url === undefined ? fallback?.url ?? '' : text(body.url),
    queryJson: body.query === undefined ? fallback?.queryJson ?? '[]' : jsonArrayString(body.query),
    headersJson:
      body.headers === undefined ? fallback?.headersJson ?? '[]' : jsonArrayString(body.headers),
    bodyType: normalizeBodyType(body.bodyType, fallback?.bodyType ?? 'NONE'),
    bodyText: body.bodyText === undefined ? fallback?.bodyText ?? null : nullableText(body.bodyText),
    authJson: body.auth === undefined ? fallback?.authJson ?? '{}' : jsonObjectString(body.auth),
    assertionRulesJson:
      body.assertionRules === undefined
        ? fallback?.assertionRulesJson ?? '[]'
        : jsonArrayString(body.assertionRules),
    timeoutMs: Math.max(1000, numberValue(body.timeoutMs, fallback?.timeoutMs ?? 30000)),
    storeResponseBody: booleanValue(body.storeResponseBody, fallback?.storeResponseBody ?? false),
    sortOrder: numberValue(body.sortOrder, fallback?.sortOrder ?? 0),
  }
}

function flowPayload(
  body: ApiFlowBody,
  fallback?: {
    collectionName: string
    name: string
    description: string | null
    enabled: boolean
    storeResponseBody: boolean
    sortOrder: number
  },
) {
  return {
    collectionName:
      body.collectionName === undefined
        ? fallback?.collectionName ?? 'Mac dinh'
        : normalizeCollectionName(body.collectionName),
    name: body.name === undefined ? fallback?.name ?? '' : text(body.name),
    description:
      body.description === undefined ? fallback?.description ?? null : nullableText(body.description),
    enabled: booleanValue(body.enabled, fallback?.enabled ?? true),
    storeResponseBody: booleanValue(body.storeResponseBody, fallback?.storeResponseBody ?? false),
    sortOrder: numberValue(body.sortOrder, fallback?.sortOrder ?? 0),
  }
}

function stepPayload(
  body: ApiFlowStepBody,
  fallback?: {
    name: string
    sortOrder: number
    overrideJson: string
    captureRulesJson: string
    assertionRulesJson: string
    continueOnFailure: boolean
  },
) {
  return {
    name: body.name === undefined ? fallback?.name ?? '' : text(body.name),
    sortOrder: numberValue(body.sortOrder, fallback?.sortOrder ?? 0),
    overrideJson:
      body.override === undefined ? fallback?.overrideJson ?? '{}' : jsonObjectString(body.override),
    captureRulesJson:
      body.captureRules === undefined
        ? fallback?.captureRulesJson ?? '[]'
        : jsonArrayString(body.captureRules),
    assertionRulesJson:
      body.assertionRules === undefined
        ? fallback?.assertionRulesJson ?? '[]'
        : jsonArrayString(body.assertionRules),
    continueOnFailure: booleanValue(body.continueOnFailure, fallback?.continueOnFailure ?? false),
  }
}

export function registerApiLabRoutes(app: FastifyInstance, context: ApiLabRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.post('/api/api-lab/import-curl', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<CurlImportBody>(request.body)
    const command = text(body.curl)

    if (!command) {
      return reply.code(400).send({ message: 'Can nhap lenh cURL.' })
    }

    try {
      return parseCurlCommand(command)
    } catch {
      return reply.code(400).send({ message: 'Lenh cURL khong hop le hoac thieu URL.' })
    }
  })

  app.get('/api/api-lab/history', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') ?? ''
    const taskId = url.searchParams.get('taskId')
    const requestId = url.searchParams.get('requestId')
    const flowId = url.searchParams.get('flowId')
    const status = url.searchParams.get('status')
    const dateFrom = dateValue(url.searchParams.get('dateFrom'))
    const dateTo = dateValue(url.searchParams.get('dateTo'), true)
    const project = await ensureProject(context.prisma, projectId, userId, reply)

    if (!project) {
      return
    }

    const createdAt =
      dateFrom || dateTo
        ? {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          }
        : undefined
    const requestRunWhere = {
      projectId: project.id,
      ...(taskId ? { taskId } : {}),
      ...(requestId ? { requestId } : {}),
      ...(status ? { status } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(flowId ? { flowRun: { flowId } } : {}),
    }
    const flowRunWhere = {
      projectId: project.id,
      ...(taskId ? { taskId } : {}),
      ...(flowId ? { flowId } : {}),
      ...(status ? { status } : {}),
      ...(createdAt ? { createdAt } : {}),
    }
    const [requestRuns, flowRuns] = await Promise.all([
      context.prisma.apiRequestRun.findMany({
        where: requestRunWhere,
        orderBy: { createdAt: 'desc' },
        take: 80,
        include: {
          task: { select: { id: true, code: true, title: true } },
          request: { select: { id: true, name: true, method: true, url: true, collectionName: true } },
          flowRun: { include: { flow: { select: { id: true, name: true, collectionName: true } } } },
          flowStep: { select: { id: true, name: true, sortOrder: true } },
        },
      }),
      requestId
        ? Promise.resolve([])
        : context.prisma.apiFlowRun.findMany({
            where: flowRunWhere,
            orderBy: { createdAt: 'desc' },
            take: 80,
            include: {
              task: { select: { id: true, code: true, title: true } },
              flow: { select: { id: true, name: true, collectionName: true } },
            },
          }),
    ])

    return [
      ...requestRuns.map((run) => ({
        kind: 'REQUEST',
        id: run.id,
        status: run.status,
        httpStatus: run.httpStatus,
        durationMs: run.durationMs,
        assertionSummaryJson: run.assertionSummaryJson,
        errorMessage: run.errorMessage,
        responseBodySaved: run.responseBodySaved,
        createdAt: run.createdAt,
        task: run.task,
        request: run.request,
        flow: run.flowRun?.flow ?? null,
        flowStep: run.flowStep,
      })),
      ...flowRuns.map((run) => ({
        kind: 'FLOW',
        id: run.id,
        status: run.status,
        httpStatus: null,
        durationMs: run.durationMs,
        assertionSummaryJson: run.assertionSummaryJson,
        errorMessage: run.errorMessage,
        responseBodySaved: false,
        createdAt: run.createdAt,
        task: run.task,
        request: null,
        flow: run.flow,
        flowStep: null,
      })),
    ]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 80)
  })

  app.get('/api/api-lab/environments', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') ?? ''
    const project = await ensureProject(context.prisma, projectId, userId, reply)

    if (!project) {
      return
    }

    const environments = await context.prisma.apiEnvironment.findMany({
      where: { projectId: project.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: environmentInclude(),
    })

    return environments.map(publicEnvironment)
  })

  app.post('/api/api-lab/environments', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const body = bodyAs<EnvironmentBody>(request.body)
    const projectId = text(body.projectId)
    const project = await ensureProject(context.prisma, projectId, userId, reply)

    if (!project) {
      return
    }

    const name = text(body.name)

    if (!name) {
      return reply.code(400).send({ message: 'Can nhap ten environment API.' })
    }

    const exists = await context.prisma.apiEnvironment.findUnique({
      where: {
        projectId_name: {
          projectId: project.id,
          name,
        },
      },
    })

    if (exists) {
      return reply.code(409).send({ message: 'Environment API da ton tai trong du an.' })
    }

    const environment = await context.prisma.$transaction(async (tx) => {
      const created = await tx.apiEnvironment.create({
        data: {
          projectId: project.id,
          name,
          environmentType: normalizeEnvironmentType(body.environmentType),
          baseUrl: nullableText(body.baseUrl),
          description: nullableText(body.description),
          enabled: booleanValue(body.enabled, true),
          sortOrder: numberValue(body.sortOrder, 0),
        },
      })

      await replaceEnvironmentVariables(tx, created.id, body.variables)

      return tx.apiEnvironment.findUnique({
        where: { id: created.id },
        include: environmentInclude(),
      })
    })

    return publicEnvironment(environment!)
  })

  app.patch('/api/api-lab/environments/:environmentId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const environmentId = paramsAs(request.params).environmentId ?? ''
    const environment = await ensureEnvironment(context.prisma, environmentId, userId, reply)

    if (!environment) {
      return
    }

    const body = bodyAs<EnvironmentBody>(request.body)
    const name = text(body.name)

    if (!name) {
      return reply.code(400).send({ message: 'Can nhap ten environment API.' })
    }

    const duplicate = await context.prisma.apiEnvironment.findFirst({
      where: {
        projectId: environment.projectId,
        name,
        id: { not: environment.id },
      },
    })

    if (duplicate) {
      return reply.code(409).send({ message: 'Environment API da ton tai trong du an.' })
    }

    const updated = await context.prisma.$transaction(async (tx) => {
      const nextEnvironment = await tx.apiEnvironment.update({
        where: { id: environment.id },
        data: {
          name,
          environmentType: normalizeEnvironmentType(body.environmentType, environment.environmentType),
          baseUrl: nullableText(body.baseUrl),
          description: nullableText(body.description),
          enabled: booleanValue(body.enabled, environment.enabled),
          sortOrder: numberValue(body.sortOrder, environment.sortOrder),
        },
      })

      await replaceEnvironmentVariables(tx, nextEnvironment.id, body.variables)

      return tx.apiEnvironment.findUnique({
        where: { id: nextEnvironment.id },
        include: environmentInclude(),
      })
    })

    return publicEnvironment(updated!)
  })

  app.delete('/api/api-lab/environments/:environmentId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const environmentId = paramsAs(request.params).environmentId ?? ''
    const environment = await ensureEnvironment(context.prisma, environmentId, userId, reply)

    if (!environment) {
      return
    }

    await context.prisma.apiEnvironment.delete({ where: { id: environment.id } })

    return { ok: true }
  })

  app.get('/api/api-lab/requests', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') ?? ''
    const taskId = url.searchParams.get('taskId')
    const query = url.searchParams.get('q')?.trim() || undefined
    const project = await ensureProject(context.prisma, projectId, userId, reply)

    if (!project) {
      return
    }

    const task = await ensureTaskInProject(context.prisma, taskId, project.id, reply)

    if (task === false) {
      return
    }

    return context.prisma.apiRequest.findMany({
      where: {
        projectId: project.id,
        ...(taskId ? { taskId } : {}),
        ...(query
          ? {
              OR: [{ name: { contains: query } }, { url: { contains: query } }, { collectionName: { contains: query } }],
            }
          : {}),
      },
      orderBy: [{ collectionName: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        task: { select: { id: true, code: true, title: true } },
        _count: { select: { flowSteps: true, requestRuns: true } },
      },
    })
  })

  app.post('/api/api-lab/requests', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const body = bodyAs<ApiRequestBody>(request.body)
    const projectId = text(body.projectId)
    const project = await ensureProject(context.prisma, projectId, userId, reply)

    if (!project) {
      return
    }

    const taskId = nullableText(body.taskId)
    const task = await ensureTaskInProject(context.prisma, taskId, project.id, reply)

    if (task === false) {
      return
    }

    const payload = requestPayload(body)

    if (!payload.name || !payload.url) {
      return reply.code(400).send({ message: 'Can nhap ten va URL API request.' })
    }

    return context.prisma.apiRequest.create({
      data: {
        projectId: project.id,
        taskId,
        ...payload,
      },
      include: {
        task: { select: { id: true, code: true, title: true } },
        _count: { select: { flowSteps: true, requestRuns: true } },
      },
    })
  })

  app.patch('/api/api-lab/requests/:requestId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const requestId = paramsAs(request.params).requestId ?? ''
    const apiRequest = await ensureApiRequest(context.prisma, requestId, userId, reply)

    if (!apiRequest) {
      return
    }

    const body = bodyAs<ApiRequestBody>(request.body)
    const taskId = nullableText(body.taskId)
    const task = await ensureTaskInProject(context.prisma, taskId, apiRequest.projectId, reply)

    if (task === false) {
      return
    }

    const payload = requestPayload(body, apiRequest)

    if (!payload.name || !payload.url) {
      return reply.code(400).send({ message: 'Can nhap ten va URL API request.' })
    }

    return context.prisma.apiRequest.update({
      where: { id: apiRequest.id },
      data: {
        taskId,
        ...payload,
      },
      include: {
        task: { select: { id: true, code: true, title: true } },
        _count: { select: { flowSteps: true, requestRuns: true } },
      },
    })
  })

  app.delete('/api/api-lab/requests/:requestId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const requestId = paramsAs(request.params).requestId ?? ''
    const apiRequest = await ensureApiRequest(context.prisma, requestId, userId, reply)

    if (!apiRequest) {
      return
    }

    await context.prisma.apiRequest.delete({ where: { id: apiRequest.id } })

    return { ok: true }
  })

  app.post('/api/api-lab/requests/:requestId/run', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const requestId = paramsAs(request.params).requestId ?? ''
    const apiRequest = await ensureApiRequest(context.prisma, requestId, userId, reply)

    if (!apiRequest) {
      return
    }

    const body = bodyAs<RunRequestBody>(request.body)
    const environmentId = nullableText(body.environmentId)
    const environment = await ensureEnvironmentInProject(context.prisma, environmentId, apiRequest.projectId, reply)

    if (environment === false) {
      return
    }

    const task = await ensureTaskInProject(context.prisma, apiRequest.taskId, apiRequest.projectId, reply)

    if (task === false) {
      return
    }

    const startedAt = new Date()
    const runtimeVariables = recordFromUnknown(body.runtimeVariables)
    const variableVariants = recordFromUnknown(body.variableVariants)
    const variableContext = buildVariableContext(environment, task, runtimeVariables, variableVariants)
    const shouldSaveResponse = booleanValue(body.saveResponseBody, apiRequest.storeResponseBody)

    try {
      const resolvedRequest = buildResolvedRequest(
        apiRequest,
        variableContext.values,
        body.timeoutMs === undefined ? undefined : Math.max(1, numberValue(body.timeoutMs, apiRequest.timeoutMs)),
      )
      const result = await executeResolvedRequest(resolvedRequest)
      const finishedAt = new Date()
      const assertionSummary = evaluateAssertionRules(normalizeAssertionRules(apiRequest.assertionRulesJson), result)
      const assertionError = firstRequiredAssertionFailure(assertionSummary)
      const runStatus = result.status === 'PASSED' && !assertionError ? 'PASSED' : 'FAILED'
      const maskedHeaders = maskHeaders(result.headers, variableContext.secretValues)
      const maskedBodyPreview = maskKnownSecrets(result.bodyPreview, variableContext.secretValues)
      const responseBodySaved = shouldSaveResponse && (maskedBodyPreview.length > 0 || result.httpStatus !== null)
      const run = await context.prisma.apiRequestRun.create({
        data: {
          projectId: apiRequest.projectId,
          taskId: apiRequest.taskId,
          environmentId,
          requestId: apiRequest.id,
          status: runStatus,
          httpStatus: result.httpStatus,
          durationMs: result.durationMs,
          assertionSummaryJson: JSON.stringify(assertionSummary),
          capturedVariablesJson: '{}',
          errorMessage: assertionError ?? result.errorMessage,
          responseBodySaved,
          startedAt,
          finishedAt,
        },
      })
      const savedResponse = responseBodySaved
        ? await context.prisma.apiSavedResponse.create({
            data: {
              requestRunId: run.id,
              statusCode: result.httpStatus,
              headersJson: JSON.stringify(maskedHeaders),
              bodyText: maskedBodyPreview,
              contentType: result.headers['content-type'] ?? null,
              originalSize: result.originalSize,
              truncated: result.truncated,
            },
          })
        : null

      return {
        run,
        response: {
          httpStatus: result.httpStatus,
          durationMs: result.durationMs,
          headers: maskedHeaders,
          bodyPreview: maskedBodyPreview,
          originalSize: result.originalSize,
          truncated: result.truncated,
          savedResponseId: savedResponse?.id ?? null,
        },
      }
    } catch (error) {
      const finishedAt = new Date()
      const run = await context.prisma.apiRequestRun.create({
        data: {
          projectId: apiRequest.projectId,
          taskId: apiRequest.taskId,
          environmentId,
          requestId: apiRequest.id,
          status: 'FAILED',
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          assertionSummaryJson: JSON.stringify({ total: 0, passed: 0, failed: 0 }),
          capturedVariablesJson: '{}',
          errorMessage:
            error instanceof Error && error.message === 'INVALID_URL'
              ? 'URL API khong hop le.'
              : error instanceof Error
                ? error.message
                : 'Khong goi duoc API.',
          responseBodySaved: false,
          startedAt,
          finishedAt,
        },
      })

      return {
        run,
        response: null,
      }
    }
  })

  app.get('/api/api-lab/requests/:requestId/runs', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const requestId = paramsAs(request.params).requestId ?? ''
    const apiRequest = await ensureApiRequest(context.prisma, requestId, userId, reply)

    if (!apiRequest) {
      return
    }

    return context.prisma.apiRequestRun.findMany({
      where: { requestId: apiRequest.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        savedResponse: {
          select: {
            id: true,
            statusCode: true,
            originalSize: true,
            truncated: true,
            contentType: true,
            createdAt: true,
          },
        },
      },
    })
  })

  app.post('/api/api-lab/request-runs/:runId/save-response', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const runId = paramsAs(request.params).runId ?? ''
    const run = await ensureApiRequestRun(context.prisma, runId, userId, reply)

    if (!run) {
      return
    }

    const body = bodyAs<SaveResponseBody>(request.body)
    const headersJson = jsonObjectString(body.headers)
    const bodyText = text(body.bodyText)

    if (!bodyText && headersJson === '{}') {
      return reply.code(400).send({ message: 'Khong co response de luu.' })
    }

    const savedResponse = await context.prisma.apiSavedResponse.upsert({
      where: { requestRunId: run.id },
      create: {
        requestRunId: run.id,
        statusCode: numberValue(body.statusCode, run.httpStatus ?? 0) || null,
        headersJson,
        bodyText,
        contentType: nullableText(body.contentType),
        originalSize: numberValue(body.originalSize, bodyText.length),
        truncated: booleanValue(body.truncated, false),
      },
      update: {
        statusCode: numberValue(body.statusCode, run.httpStatus ?? 0) || null,
        headersJson,
        bodyText,
        contentType: nullableText(body.contentType),
        originalSize: numberValue(body.originalSize, bodyText.length),
        truncated: booleanValue(body.truncated, false),
      },
    })

    await context.prisma.apiRequestRun.update({
      where: { id: run.id },
      data: { responseBodySaved: true },
    })

    return savedResponse
  })

  app.post('/api/api-lab/request-runs/:runId/attach-task', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const runId = paramsAs(request.params).runId ?? ''
    const run = await context.prisma.apiRequestRun.findFirst({
      where: {
        id: runId,
        project: {
          OR: [{ ownerId: userId }, { ownerId: null }],
        },
      },
      include: {
        task: { select: { id: true, code: true, title: true } },
        request: { select: { id: true, name: true, method: true, url: true, collectionName: true } },
        flowRun: { include: { flow: { select: { id: true, name: true, collectionName: true } } } },
        flowStep: { select: { id: true, name: true, sortOrder: true } },
        savedResponse: { select: { id: true } },
      },
    })

    if (!run) {
      return reply.code(404).send({ message: 'Khong tim thay luot chay API.' })
    }

    if (!run.taskId || !run.task) {
      return reply.code(400).send({ message: 'Luot chay API chua gan task. Hay link request/flow voi task truoc.' })
    }

    const existingEvent = await context.prisma.timelineEvent.findFirst({
      where: {
        projectId: run.projectId,
        taskId: run.taskId,
        eventType: 'API_REQUEST_RUN_ATTACHED',
        metadataJson: { contains: run.id },
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, code: true, title: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (existingEvent) {
      return existingEvent
    }

    const body = bodyAs<AttachRunBody>(request.body)
    const note = text(body.note)
    const requestName = run.request?.name ?? run.flowStep?.name ?? 'Request run'
    const sourceLabel = run.flowRun?.flow
      ? `Flow ${run.flowRun.flow.name} / ${requestName}`
      : `${run.request?.method ?? 'API'} ${requestName}`
    const descriptionParts = [
      `${sourceLabel} - ${run.status}`,
      run.httpStatus ? `HTTP ${run.httpStatus}` : '',
      run.durationMs !== null ? `${run.durationMs}ms` : '',
      assertionSummaryText(run.assertionSummaryJson),
      run.errorMessage ? `Loi: ${run.errorMessage}` : '',
      note ? `Ghi chu: ${note}` : '',
    ].filter(Boolean)

    return context.prisma.timelineEvent.create({
      data: {
        projectId: run.projectId,
        taskId: run.taskId,
        createdById: userId,
        eventType: 'API_REQUEST_RUN_ATTACHED',
        title: `Gan API run vao ${run.task.code}`,
        description: descriptionParts.join('\n'),
        metadataJson: JSON.stringify({
          source: 'api-lab',
          kind: 'REQUEST',
          requestRunId: run.id,
          requestId: run.requestId,
          flowRunId: run.flowRunId,
          flowStepId: run.flowStepId,
          status: run.status,
          httpStatus: run.httpStatus,
          durationMs: run.durationMs,
          assertionSummary: assertionSummaryFromJson(run.assertionSummaryJson),
          responseBodySaved: run.responseBodySaved,
          savedResponseId: run.savedResponse?.id ?? null,
        }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, code: true, title: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })
  })

  app.get('/api/api-lab/flows', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') ?? ''
    const taskId = url.searchParams.get('taskId')
    const query = url.searchParams.get('q')?.trim() || undefined
    const project = await ensureProject(context.prisma, projectId, userId, reply)

    if (!project) {
      return
    }

    const task = await ensureTaskInProject(context.prisma, taskId, project.id, reply)

    if (task === false) {
      return
    }

    return context.prisma.apiFlow.findMany({
      where: {
        projectId: project.id,
        ...(taskId ? { taskId } : {}),
        ...(query
          ? {
              OR: [{ name: { contains: query } }, { collectionName: { contains: query } }],
            }
          : {}),
      },
      orderBy: [{ collectionName: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        task: { select: { id: true, code: true, title: true } },
        _count: { select: { steps: true, flowRuns: true } },
      },
    })
  })

  app.post('/api/api-lab/flows', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const body = bodyAs<ApiFlowBody>(request.body)
    const projectId = text(body.projectId)
    const project = await ensureProject(context.prisma, projectId, userId, reply)

    if (!project) {
      return
    }

    const taskId = nullableText(body.taskId)
    const task = await ensureTaskInProject(context.prisma, taskId, project.id, reply)

    if (task === false) {
      return
    }

    const payload = flowPayload(body)

    if (!payload.name) {
      return reply.code(400).send({ message: 'Can nhap ten API flow.' })
    }

    return context.prisma.apiFlow.create({
      data: {
        projectId: project.id,
        taskId,
        ...payload,
      },
      include: {
        task: { select: { id: true, code: true, title: true } },
        _count: { select: { steps: true, flowRuns: true } },
      },
    })
  })

  app.patch('/api/api-lab/flows/:flowId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const flowId = paramsAs(request.params).flowId ?? ''
    const flow = await ensureApiFlow(context.prisma, flowId, userId, reply)

    if (!flow) {
      return
    }

    const body = bodyAs<ApiFlowBody>(request.body)
    const taskId = nullableText(body.taskId)
    const task = await ensureTaskInProject(context.prisma, taskId, flow.projectId, reply)

    if (task === false) {
      return
    }

    const payload = flowPayload(body, flow)

    if (!payload.name) {
      return reply.code(400).send({ message: 'Can nhap ten API flow.' })
    }

    return context.prisma.apiFlow.update({
      where: { id: flow.id },
      data: {
        taskId,
        ...payload,
      },
      include: {
        task: { select: { id: true, code: true, title: true } },
        _count: { select: { steps: true, flowRuns: true } },
      },
    })
  })

  app.delete('/api/api-lab/flows/:flowId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const flowId = paramsAs(request.params).flowId ?? ''
    const flow = await ensureApiFlow(context.prisma, flowId, userId, reply)

    if (!flow) {
      return
    }

    await context.prisma.apiFlow.delete({ where: { id: flow.id } })

    return { ok: true }
  })

  app.post('/api/api-lab/flows/:flowId/run', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const flowId = paramsAs(request.params).flowId ?? ''
    const flow = await context.prisma.apiFlow.findFirst({
      where: {
        id: flowId,
        project: {
          OR: [{ ownerId: userId }, { ownerId: null }],
        },
      },
      include: {
        steps: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: { request: true },
        },
      },
    })

    if (!flow) {
      return reply.code(404).send({ message: 'Khong tim thay API flow.' })
    }

    if (!flow.enabled) {
      return reply.code(400).send({ message: 'API flow dang bi tat.' })
    }

    if (flow.steps.length === 0) {
      return reply.code(400).send({ message: 'API flow chua co step.' })
    }

    const body = bodyAs<RunRequestBody>(request.body)
    const environmentId = nullableText(body.environmentId)
    const environment = await ensureEnvironmentInProject(context.prisma, environmentId, flow.projectId, reply)

    if (environment === false) {
      return
    }

    const task = await ensureTaskInProject(context.prisma, flow.taskId, flow.projectId, reply)

    if (task === false) {
      return
    }

    const startedAt = new Date()
    const runtimeVariables = recordFromUnknown(body.runtimeVariables)
    const variableVariants = recordFromUnknown(body.variableVariants)
    const baseVariableContext = buildVariableContext(environment, task, runtimeVariables, variableVariants)
    const capturedVariables: Record<string, string> = {}
    const publicCapturedVariables: Record<string, string> = {}
    const flowSecretValues = [...baseVariableContext.secretValues]
    const assertionSummaries: AssertionSummary[] = []
    const stepResults: Array<{
      step: {
        id: string
        name: string
        sortOrder: number
        continueOnFailure: boolean
      }
      run: Awaited<ReturnType<typeof context.prisma.apiRequestRun.create>>
      response: {
        httpStatus: number | null
        durationMs: number
        headers: Record<string, string>
        bodyPreview: string
        originalSize: number
        truncated: boolean
        savedResponseId: string | null
      } | null
      capturedVariables: Record<string, string>
    }> = []
    const flowRun = await context.prisma.apiFlowRun.create({
      data: {
        projectId: flow.projectId,
        taskId: flow.taskId,
        environmentId,
        flowId: flow.id,
        status: 'RUNNING',
        assertionSummaryJson: JSON.stringify({ total: 0, passed: 0, failed: 0 }),
        capturedVariablesJson: '{}',
        startedAt,
      },
    })
    let finalStatus: 'PASSED' | 'FAILED' = 'PASSED'
    let finalErrorMessage: string | null = null
    let shouldSkipRemaining = false

    for (const step of flow.steps) {
      if (shouldSkipRemaining) {
        const now = new Date()
        const skippedRun = await context.prisma.apiRequestRun.create({
          data: {
            projectId: flow.projectId,
            taskId: flow.taskId,
            environmentId,
            requestId: step.requestId,
            flowRunId: flowRun.id,
            flowStepId: step.id,
            status: 'SKIPPED',
            durationMs: 0,
            assertionSummaryJson: JSON.stringify({ total: 0, passed: 0, failed: 0 }),
            capturedVariablesJson: '{}',
            errorMessage: 'Bi bo qua vi step truoc that bai.',
            responseBodySaved: false,
            startedAt: now,
            finishedAt: now,
          },
        })

        stepResults.push({
          step: {
            id: step.id,
            name: step.name,
            sortOrder: step.sortOrder,
            continueOnFailure: step.continueOnFailure,
          },
          run: skippedRun,
          response: null,
          capturedVariables: {},
        })
        continue
      }

      const stepStartedAt = new Date()
      const requestRecord = stepRequestRecord(step)

      if (!requestRecord) {
        const finishedAt = new Date()
        const failedRun = await context.prisma.apiRequestRun.create({
          data: {
            projectId: flow.projectId,
            taskId: flow.taskId,
            environmentId,
            requestId: step.requestId,
            flowRunId: flowRun.id,
            flowStepId: step.id,
            status: 'FAILED',
            durationMs: finishedAt.getTime() - stepStartedAt.getTime(),
            assertionSummaryJson: JSON.stringify({ total: 0, passed: 0, failed: 0 }),
            capturedVariablesJson: '{}',
            errorMessage: 'Step chua co request hoac URL inline.',
            responseBodySaved: false,
            startedAt: stepStartedAt,
            finishedAt,
          },
        })

        finalStatus = 'FAILED'
        finalErrorMessage ??= failedRun.errorMessage
        shouldSkipRemaining = !step.continueOnFailure
        stepResults.push({
          step: {
            id: step.id,
            name: step.name,
            sortOrder: step.sortOrder,
            continueOnFailure: step.continueOnFailure,
          },
          run: failedRun,
          response: null,
          capturedVariables: {},
        })
        continue
      }

      try {
        const resolvedRequest = buildResolvedRequest(
          requestRecord,
          { ...baseVariableContext.values, ...capturedVariables },
          body.timeoutMs === undefined ? undefined : Math.max(1, numberValue(body.timeoutMs, requestRecord.timeoutMs)),
        )
        const result = await executeResolvedRequest(resolvedRequest)
        const captureRules = normalizeCaptureRules(step.captureRulesJson)
        const captures = evaluateCaptureRules(captureRules, result)
        const assertionSummary = evaluateAssertionRules(
          [
            ...normalizeAssertionRules(step.request?.assertionRulesJson ?? '[]'),
            ...normalizeAssertionRules(step.assertionRulesJson),
          ],
          result,
        )
        const assertionError = firstRequiredAssertionFailure(assertionSummary)
        assertionSummaries.push(assertionSummary)
        const stepSecretValues = [...flowSecretValues, ...captures.secretValues]
        const maskedHeaders = maskHeaders(result.headers, stepSecretValues)
        const maskedBodyPreview = maskKnownSecrets(result.bodyPreview, stepSecretValues)
        const captureError =
          captures.missingRequired.length > 0
            ? `Thieu capture bat buoc: ${captures.missingRequired.join(', ')}.`
            : null
        const stepStatus = result.status === 'PASSED' && !captureError && !assertionError ? 'PASSED' : 'FAILED'
        const shouldSaveResponse =
          booleanValue(body.saveResponseBody, false) || flow.storeResponseBody || requestRecord.storeResponseBody
        const responseBodySaved = shouldSaveResponse && (maskedBodyPreview.length > 0 || result.httpStatus !== null)
        const finishedAt = new Date()
        const stepRun = await context.prisma.apiRequestRun.create({
          data: {
            projectId: flow.projectId,
            taskId: flow.taskId ?? step.request?.taskId ?? null,
            environmentId,
            requestId: step.requestId,
            flowRunId: flowRun.id,
            flowStepId: step.id,
            status: stepStatus,
            httpStatus: result.httpStatus,
            durationMs: result.durationMs,
            assertionSummaryJson: JSON.stringify(assertionSummary),
            capturedVariablesJson: JSON.stringify(captures.publicValues),
            errorMessage: captureError ?? assertionError ?? result.errorMessage,
            responseBodySaved,
            startedAt: stepStartedAt,
            finishedAt,
          },
        })
        const savedResponse = responseBodySaved
          ? await context.prisma.apiSavedResponse.create({
              data: {
                requestRunId: stepRun.id,
                statusCode: result.httpStatus,
                headersJson: JSON.stringify(maskedHeaders),
                bodyText: maskedBodyPreview,
                contentType: result.headers['content-type'] ?? null,
                originalSize: result.originalSize,
                truncated: result.truncated,
              },
            })
          : null

        Object.assign(capturedVariables, captures.values)
        Object.assign(publicCapturedVariables, captures.publicValues)
        flowSecretValues.push(...captures.secretValues)

        if (stepStatus === 'FAILED') {
          finalStatus = 'FAILED'
          finalErrorMessage ??= stepRun.errorMessage || `Step ${step.name} that bai.`
          shouldSkipRemaining = !step.continueOnFailure
        }

        stepResults.push({
          step: {
            id: step.id,
            name: step.name,
            sortOrder: step.sortOrder,
            continueOnFailure: step.continueOnFailure,
          },
          run: stepRun,
          response: {
            httpStatus: result.httpStatus,
            durationMs: result.durationMs,
            headers: maskedHeaders,
            bodyPreview: maskedBodyPreview,
            originalSize: result.originalSize,
            truncated: result.truncated,
            savedResponseId: savedResponse?.id ?? null,
          },
          capturedVariables: captures.publicValues,
        })
      } catch (error) {
        const finishedAt = new Date()
        const failedRun = await context.prisma.apiRequestRun.create({
          data: {
            projectId: flow.projectId,
            taskId: flow.taskId ?? step.request?.taskId ?? null,
            environmentId,
            requestId: step.requestId,
            flowRunId: flowRun.id,
            flowStepId: step.id,
            status: 'FAILED',
            durationMs: finishedAt.getTime() - stepStartedAt.getTime(),
            assertionSummaryJson: JSON.stringify({ total: 0, passed: 0, failed: 0 }),
            capturedVariablesJson: '{}',
            errorMessage:
              error instanceof Error && error.message === 'INVALID_URL'
                ? 'URL API khong hop le.'
                : error instanceof Error
                  ? error.message
                  : 'Khong goi duoc API.',
            responseBodySaved: false,
            startedAt: stepStartedAt,
            finishedAt,
          },
        })

        finalStatus = 'FAILED'
        finalErrorMessage ??= failedRun.errorMessage
        shouldSkipRemaining = !step.continueOnFailure
        stepResults.push({
          step: {
            id: step.id,
            name: step.name,
            sortOrder: step.sortOrder,
            continueOnFailure: step.continueOnFailure,
          },
          run: failedRun,
          response: null,
          capturedVariables: {},
        })
      }
    }

    const finishedAt = new Date()
    const updatedFlowRun = await context.prisma.apiFlowRun.update({
      where: { id: flowRun.id },
      data: {
        status: finalStatus,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        assertionSummaryJson: JSON.stringify(mergeAssertionSummaries(assertionSummaries)),
        capturedVariablesJson: JSON.stringify(publicCapturedVariables),
        errorMessage: finalErrorMessage,
        finishedAt,
      },
    })

    return {
      flowRun: updatedFlowRun,
      steps: stepResults,
      capturedVariables: publicCapturedVariables,
    }
  })

  app.get('/api/api-lab/flows/:flowId/runs', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const flowId = paramsAs(request.params).flowId ?? ''
    const flow = await ensureApiFlow(context.prisma, flowId, userId, reply)

    if (!flow) {
      return
    }

    return context.prisma.apiFlowRun.findMany({
      where: { flowId: flow.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        stepRuns: {
          orderBy: { createdAt: 'asc' },
          include: {
            flowStep: { select: { id: true, name: true, sortOrder: true } },
            request: { select: { id: true, name: true, method: true, url: true } },
          },
        },
      },
    })
  })

  app.post('/api/api-lab/flow-runs/:runId/attach-task', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const runId = paramsAs(request.params).runId ?? ''
    const run = await context.prisma.apiFlowRun.findFirst({
      where: {
        id: runId,
        project: {
          OR: [{ ownerId: userId }, { ownerId: null }],
        },
      },
      include: {
        task: { select: { id: true, code: true, title: true } },
        flow: { select: { id: true, name: true, collectionName: true } },
      },
    })

    if (!run) {
      return reply.code(404).send({ message: 'Khong tim thay luot chay flow API.' })
    }

    if (!run.taskId || !run.task) {
      return reply.code(400).send({ message: 'Luot chay flow API chua gan task. Hay link flow voi task truoc.' })
    }

    const existingEvent = await context.prisma.timelineEvent.findFirst({
      where: {
        projectId: run.projectId,
        taskId: run.taskId,
        eventType: 'API_FLOW_RUN_ATTACHED',
        metadataJson: { contains: run.id },
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, code: true, title: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (existingEvent) {
      return existingEvent
    }

    const body = bodyAs<AttachRunBody>(request.body)
    const note = text(body.note)
    const flowName = run.flow?.name ?? 'Flow run'
    const descriptionParts = [
      `Flow ${flowName} - ${run.status}`,
      run.durationMs !== null ? `${run.durationMs}ms` : '',
      assertionSummaryText(run.assertionSummaryJson),
      run.errorMessage ? `Loi: ${run.errorMessage}` : '',
      note ? `Ghi chu: ${note}` : '',
    ].filter(Boolean)

    return context.prisma.timelineEvent.create({
      data: {
        projectId: run.projectId,
        taskId: run.taskId,
        createdById: userId,
        eventType: 'API_FLOW_RUN_ATTACHED',
        title: `Gan API flow vao ${run.task.code}`,
        description: descriptionParts.join('\n'),
        metadataJson: JSON.stringify({
          source: 'api-lab',
          kind: 'FLOW',
          flowRunId: run.id,
          flowId: run.flowId,
          status: run.status,
          durationMs: run.durationMs,
          assertionSummary: assertionSummaryFromJson(run.assertionSummaryJson),
          capturedVariablesJson: run.capturedVariablesJson,
        }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, code: true, title: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })
  })

  app.get('/api/api-lab/flows/:flowId/steps', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const flowId = paramsAs(request.params).flowId ?? ''
    const flow = await ensureApiFlow(context.prisma, flowId, userId, reply)

    if (!flow) {
      return
    }

    return context.prisma.apiFlowStep.findMany({
      where: { flowId: flow.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        request: {
          select: {
            id: true,
            name: true,
            method: true,
            url: true,
            collectionName: true,
          },
        },
      },
    })
  })

  app.post('/api/api-lab/flows/:flowId/steps', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const flowId = paramsAs(request.params).flowId ?? ''
    const flow = await ensureApiFlow(context.prisma, flowId, userId, reply)

    if (!flow) {
      return
    }

    const body = bodyAs<ApiFlowStepBody>(request.body)
    const requestId = nullableText(body.requestId)
    const apiRequest = await ensureRequestInProject(context.prisma, requestId, flow.projectId, reply)

    if (apiRequest === false) {
      return
    }

    const stepCount = await context.prisma.apiFlowStep.count({ where: { flowId: flow.id } })
    const payload = stepPayload(body, {
      name: '',
      sortOrder: stepCount,
      overrideJson: '{}',
      captureRulesJson: '[]',
      assertionRulesJson: '[]',
      continueOnFailure: false,
    })

    if (!payload.name) {
      return reply.code(400).send({ message: 'Can nhap ten API flow step.' })
    }

    return context.prisma.apiFlowStep.create({
      data: {
        flowId: flow.id,
        requestId,
        ...payload,
      },
      include: {
        request: {
          select: {
            id: true,
            name: true,
            method: true,
            url: true,
            collectionName: true,
          },
        },
      },
    })
  })

  app.patch('/api/api-lab/flow-steps/:stepId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const stepId = paramsAs(request.params).stepId ?? ''
    const step = await ensureApiFlowStep(context.prisma, stepId, userId, reply)

    if (!step) {
      return
    }

    const body = bodyAs<ApiFlowStepBody>(request.body)
    const requestId = nullableText(body.requestId)
    const apiRequest = await ensureRequestInProject(context.prisma, requestId, step.flow.projectId, reply)

    if (apiRequest === false) {
      return
    }

    const payload = stepPayload(body, step)

    if (!payload.name) {
      return reply.code(400).send({ message: 'Can nhap ten API flow step.' })
    }

    return context.prisma.apiFlowStep.update({
      where: { id: step.id },
      data: {
        requestId,
        ...payload,
      },
      include: {
        request: {
          select: {
            id: true,
            name: true,
            method: true,
            url: true,
            collectionName: true,
          },
        },
      },
    })
  })

  app.delete('/api/api-lab/flow-steps/:stepId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const stepId = paramsAs(request.params).stepId ?? ''
    const step = await ensureApiFlowStep(context.prisma, stepId, userId, reply)

    if (!step) {
      return
    }

    await context.prisma.apiFlowStep.delete({ where: { id: step.id } })

    return { ok: true }
  })
}
