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
      const maskedHeaders = maskHeaders(result.headers, variableContext.secretValues)
      const maskedBodyPreview = maskKnownSecrets(result.bodyPreview, variableContext.secretValues)
      const responseBodySaved = shouldSaveResponse && (maskedBodyPreview.length > 0 || result.httpStatus !== null)
      const run = await context.prisma.apiRequestRun.create({
        data: {
          projectId: apiRequest.projectId,
          taskId: apiRequest.taskId,
          environmentId,
          requestId: apiRequest.id,
          status: result.status,
          httpStatus: result.httpStatus,
          durationMs: result.durationMs,
          assertionSummaryJson: JSON.stringify({ total: 0, passed: 0, failed: 0 }),
          capturedVariablesJson: '{}',
          errorMessage: result.errorMessage,
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
