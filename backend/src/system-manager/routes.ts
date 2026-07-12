import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'

type SystemManagerRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

type Params = {
  environmentId?: string
  hostId?: string
  nodeCode?: string
  dependencyCode?: string
}

type EnvironmentBody = {
  key?: unknown
  name?: unknown
  description?: unknown
  sortOrder?: unknown
}

type HostBody = {
  environmentKey?: unknown
  name?: unknown
  ip?: unknown
  description?: unknown
  sortOrder?: unknown
}

type NodeBody = {
  environmentKey?: unknown
  hostId?: unknown
  code?: unknown
  name?: unknown
  kind?: unknown
  type?: unknown
  status?: unknown
  description?: unknown
  tags?: unknown
  containerName?: unknown
  image?: unknown
  ports?: unknown
  network?: unknown
  notes?: unknown
  positionX?: unknown
  positionY?: unknown
  configs?: unknown
}

type DependencyBody = {
  environmentKey?: unknown
  code?: unknown
  sourceCode?: unknown
  targetCode?: unknown
  label?: unknown
  connectionType?: unknown
  direction?: unknown
  port?: unknown
  description?: unknown
  configItems?: unknown
  sortOrder?: unknown
}

type ConfigItemInput = {
  key?: unknown
  value?: unknown
  secret?: unknown
  sortOrder?: unknown
}

type ConfigGroupInput = {
  name?: unknown
  items?: unknown
  sortOrder?: unknown
}

const nodeKinds = new Set(['app', 'component', 'service'])
const topologyStatuses = new Set(['healthy', 'warning', 'down', 'unknown', 'maintenance', 'disabled'])
const dependencyDirections = new Set(['request', 'read', 'write', 'publish', 'consume', 'proxy'])

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

function booleanValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeCode(value: unknown, fallback?: unknown) {
  const rawValue = text(value) || text(fallback)

  return rawValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeEnvironmentKey(value: unknown, fallback?: unknown) {
  return normalizeCode(value, fallback)
}

function normalizeKind(value: unknown, fallback = 'service') {
  const nextValue = text(value).toLowerCase()

  return nodeKinds.has(nextValue) ? nextValue : fallback
}

function normalizeStatus(value: unknown, fallback = 'unknown') {
  const nextValue = text(value).toLowerCase()

  return topologyStatuses.has(nextValue) ? nextValue : fallback
}

function normalizeDirection(value: unknown, fallback = 'request') {
  const nextValue = text(value).toLowerCase()

  return dependencyDirections.has(nextValue) ? nextValue : fallback
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean)
  }

  return text(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseJsonArray(value: string | null | undefined) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function uniqueConfigItems(items: Array<{ key: string; value: string; secret: boolean; sortOrder: number }>) {
  const seen = new Set<string>()

  return items.filter((item) => {
    if (seen.has(item.key)) {
      return false
    }

    seen.add(item.key)
    return true
  })
}

function normalizeConfigItems(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return uniqueConfigItems(
    value
      .map((item, index) => {
        const config = bodyAs<ConfigItemInput>(item)
        const key = text(config.key)

        if (!key) {
          return null
        }

        return {
          key,
          value: text(config.value),
          secret: booleanValue(config.secret),
          sortOrder: numberValue(config.sortOrder, index),
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
  )
}

function normalizeConfigGroups(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => {
      const group = bodyAs<ConfigGroupInput>(item)
      const name = text(group.name)

      if (!name) {
        return null
      }

      return {
        name,
        sortOrder: numberValue(group.sortOrder, index),
        items: normalizeConfigItems(group.items),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function queryEnvironmentKey(requestUrl: string) {
  const url = new URL(requestUrl, 'http://localhost')

  return normalizeEnvironmentKey(url.searchParams.get('environment'), 'local')
}

async function ensureEnvironmentByKey(
  prisma: AppPrismaClient,
  environmentKey: string,
  reply: FastifyReply,
) {
  const environment = await prisma.systemEnvironment.findUnique({
    where: { key: environmentKey },
  })

  if (!environment) {
    reply.code(404).send({ message: 'Khong tim thay moi truong he thong.' })
    return null
  }

  return environment
}

async function ensureHostInEnvironment(
  prisma: AppPrismaClient,
  hostId: string,
  environmentId: string,
  reply: FastifyReply,
) {
  const host = await prisma.systemHost.findFirst({
    where: {
      id: hostId,
      environmentId,
    },
  })

  if (!host) {
    reply.code(400).send({ message: 'Host khong thuoc moi truong da chon.' })
    return null
  }

  return host
}

async function resolveHostId(
  prisma: AppPrismaClient,
  hostIdValue: unknown,
  environmentId: string,
  reply: FastifyReply,
) {
  const hostId = text(hostIdValue)

  if (!hostId) {
    return null
  }

  const host = await ensureHostInEnvironment(prisma, hostId, environmentId, reply)

  return host ? host.id : false
}

async function ensureBlueprintNodeByCode(prisma: AppPrismaClient, nodeCode: string, reply: FastifyReply) {
  const node = await prisma.systemTopologyBlueprintNode.findUnique({
    where: { code: nodeCode },
  })

  if (!node) {
    reply.code(404).send({ message: 'Khong tim thay node topology.' })
    return null
  }

  return node
}

async function ensureBlueprintDependencyByCode(
  prisma: AppPrismaClient,
  dependencyCode: string,
  reply: FastifyReply,
) {
  const dependency = await prisma.systemTopologyBlueprintDependency.findUnique({
    where: { code: dependencyCode },
  })

  if (!dependency) {
    reply.code(404).send({ message: 'Khong tim thay dependency.' })
    return null
  }

  return dependency
}

async function replaceNodeBindingConfigGroups(
  prisma: AppPrismaClient,
  bindingId: string,
  configsValue: unknown,
) {
  const groups = normalizeConfigGroups(configsValue)

  await prisma.systemNodeBindingConfigGroup.deleteMany({ where: { bindingId } })

  for (const group of groups) {
    await prisma.systemNodeBindingConfigGroup.create({
      data: {
        bindingId,
        name: group.name,
        sortOrder: group.sortOrder,
        items: {
          create: group.items,
        },
      },
    })
  }
}

async function replaceDependencyBindingConfigItems(
  prisma: AppPrismaClient,
  bindingId: string,
  configItemsValue: unknown,
) {
  const configItems = normalizeConfigItems(configItemsValue)

  await prisma.systemDependencyBindingConfig.deleteMany({ where: { bindingId } })

  if (!configItems.length) {
    return
  }

  await prisma.systemDependencyBindingConfig.createMany({
    data: configItems.map((item) => ({
      bindingId,
      key: item.key,
      value: item.value,
      secret: item.secret,
      sortOrder: item.sortOrder,
    })),
  })
}

async function upsertNodeBinding(
  prisma: AppPrismaClient,
  environmentId: string,
  nodeId: string,
  hostId: string | null,
  body: NodeBody,
  fallback?: {
    status: string
    tagsJson: string
    containerName: string | null
    image: string | null
    portsJson: string
    network: string | null
  },
) {
  const binding = await prisma.systemNodeEnvironmentBinding.upsert({
    where: {
      environmentId_nodeId: {
        environmentId,
        nodeId,
      },
    },
    create: {
      environmentId,
      nodeId,
      hostId,
      status: normalizeStatus(body.status),
      tagsJson: JSON.stringify(stringList(body.tags)),
      containerName: nullableText(body.containerName),
      image: nullableText(body.image),
      portsJson: JSON.stringify(stringList(body.ports)),
      network: nullableText(body.network),
    },
    update: {
      hostId,
      status: body.status === undefined ? fallback?.status ?? 'unknown' : normalizeStatus(body.status, fallback?.status),
      tagsJson: body.tags === undefined ? fallback?.tagsJson ?? '[]' : JSON.stringify(stringList(body.tags)),
      containerName:
        body.containerName === undefined ? fallback?.containerName ?? null : nullableText(body.containerName),
      image: body.image === undefined ? fallback?.image ?? null : nullableText(body.image),
      portsJson: body.ports === undefined ? fallback?.portsJson ?? '[]' : JSON.stringify(stringList(body.ports)),
      network: body.network === undefined ? fallback?.network ?? null : nullableText(body.network),
    },
  })

  if (body.configs !== undefined) {
    await replaceNodeBindingConfigGroups(prisma, binding.id, body.configs)
  }

  return binding
}

export function registerSystemManagerRoutes(app: FastifyInstance, context: SystemManagerRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.get('/api/system-manager/environments', { preHandler: requireAuth }, async () => {
    const environments = await context.prisma.systemEnvironment.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        sortOrder: true,
      },
    })

    return environments.map((environment) => ({
      id: environment.id,
      key: environment.key,
      label: environment.name,
      description: environment.description,
      sortOrder: environment.sortOrder,
    }))
  })

  app.post('/api/system-manager/environments', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<EnvironmentBody>(request.body)
    const key = normalizeEnvironmentKey(body.key, body.name)
    const name = text(body.name)

    if (!key || !name) {
      return reply.code(400).send({ message: 'Can nhap key va ten moi truong.' })
    }

    const exists = await context.prisma.systemEnvironment.findUnique({ where: { key } })

    if (exists) {
      return reply.code(409).send({ message: 'Key moi truong da ton tai.' })
    }

    const environment = await context.prisma.systemEnvironment.create({
      data: {
        key,
        name,
        description: nullableText(body.description),
        sortOrder: numberValue(body.sortOrder, 0),
      },
    })

    return {
      id: environment.id,
      key: environment.key,
      label: environment.name,
      description: environment.description,
      sortOrder: environment.sortOrder,
    }
  })

  app.patch('/api/system-manager/environments/:environmentId', { preHandler: requireAuth }, async (request, reply) => {
    const { environmentId = '' } = paramsAs(request.params)
    const body = bodyAs<EnvironmentBody>(request.body)
    const current = await context.prisma.systemEnvironment.findUnique({ where: { id: environmentId } })

    if (!current) {
      return reply.code(404).send({ message: 'Khong tim thay moi truong he thong.' })
    }

    const key =
      body.key === undefined ? current.key : normalizeEnvironmentKey(body.key, body.name ?? current.name)
    const name = body.name === undefined ? current.name : text(body.name)

    if (!key || !name) {
      return reply.code(400).send({ message: 'Can nhap key va ten moi truong.' })
    }

    const duplicate = await context.prisma.systemEnvironment.findFirst({
      where: {
        key,
        id: { not: current.id },
      },
    })

    if (duplicate) {
      return reply.code(409).send({ message: 'Key moi truong da ton tai.' })
    }

    const environment = await context.prisma.systemEnvironment.update({
      where: { id: current.id },
      data: {
        key,
        name,
        description: body.description === undefined ? current.description : nullableText(body.description),
        sortOrder: numberValue(body.sortOrder, current.sortOrder),
      },
    })

    return {
      id: environment.id,
      key: environment.key,
      label: environment.name,
      description: environment.description,
      sortOrder: environment.sortOrder,
    }
  })

  app.delete('/api/system-manager/environments/:environmentId', { preHandler: requireAuth }, async (request, reply) => {
    const { environmentId = '' } = paramsAs(request.params)
    const current = await context.prisma.systemEnvironment.findUnique({ where: { id: environmentId } })

    if (!current) {
      return reply.code(404).send({ message: 'Khong tim thay moi truong he thong.' })
    }

    await context.prisma.systemEnvironment.delete({ where: { id: current.id } })

    return reply.code(204).send()
  })

  app.get('/api/system-manager/hosts', { preHandler: requireAuth }, async (request, reply) => {
    const environmentKey = queryEnvironmentKey(request.url)
    const environment = await ensureEnvironmentByKey(context.prisma, environmentKey, reply)

    if (!environment) {
      return
    }

    return context.prisma.systemHost.findMany({
      where: { environmentId: environment.id },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        environmentId: true,
        name: true,
        ip: true,
        description: true,
        sortOrder: true,
      },
    })
  })

  app.post('/api/system-manager/hosts', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<HostBody>(request.body)
    const environmentKey = normalizeEnvironmentKey(body.environmentKey, 'local')
    const environment = await ensureEnvironmentByKey(context.prisma, environmentKey, reply)

    if (!environment) {
      return
    }

    const name = text(body.name)
    const ip = text(body.ip)

    if (!name || !ip) {
      return reply.code(400).send({ message: 'Can nhap ten host va IP.' })
    }

    const exists = await context.prisma.systemHost.findUnique({
      where: {
        environmentId_name: {
          environmentId: environment.id,
          name,
        },
      },
    })

    if (exists) {
      return reply.code(409).send({ message: 'Host da ton tai trong moi truong nay.' })
    }

    return context.prisma.systemHost.create({
      data: {
        environmentId: environment.id,
        name,
        ip,
        description: nullableText(body.description),
        sortOrder: numberValue(body.sortOrder, 0),
      },
    })
  })

  app.patch('/api/system-manager/hosts/:hostId', { preHandler: requireAuth }, async (request, reply) => {
    const { hostId = '' } = paramsAs(request.params)
    const body = bodyAs<HostBody>(request.body)
    const current = await context.prisma.systemHost.findUnique({ where: { id: hostId } })

    if (!current) {
      return reply.code(404).send({ message: 'Khong tim thay host.' })
    }

    const name = body.name === undefined ? current.name : text(body.name)
    const ip = body.ip === undefined ? current.ip : text(body.ip)

    if (!name || !ip) {
      return reply.code(400).send({ message: 'Can nhap ten host va IP.' })
    }

    const duplicate = await context.prisma.systemHost.findFirst({
      where: {
        environmentId: current.environmentId,
        name,
        id: { not: current.id },
      },
    })

    if (duplicate) {
      return reply.code(409).send({ message: 'Host da ton tai trong moi truong nay.' })
    }

    return context.prisma.systemHost.update({
      where: { id: current.id },
      data: {
        name,
        ip,
        description: body.description === undefined ? current.description : nullableText(body.description),
        sortOrder: numberValue(body.sortOrder, current.sortOrder),
      },
    })
  })

  app.delete('/api/system-manager/hosts/:hostId', { preHandler: requireAuth }, async (request, reply) => {
    const { hostId = '' } = paramsAs(request.params)
    const current = await context.prisma.systemHost.findUnique({ where: { id: hostId } })

    if (!current) {
      return reply.code(404).send({ message: 'Khong tim thay host.' })
    }

    await context.prisma.systemHost.delete({ where: { id: current.id } })

    return reply.code(204).send()
  })

  app.post('/api/system-manager/nodes', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<NodeBody>(request.body)
    const environmentKey = normalizeEnvironmentKey(body.environmentKey, 'local')
    const environment = await ensureEnvironmentByKey(context.prisma, environmentKey, reply)

    if (!environment) {
      return
    }

    const code = normalizeCode(body.code, body.name)
    const name = text(body.name)
    const hostId = await resolveHostId(context.prisma, body.hostId, environment.id, reply)

    if (hostId === false) {
      return
    }

    if (!code || !name) {
      return reply.code(400).send({ message: 'Can nhap code va ten node.' })
    }

    const exists = await context.prisma.systemTopologyBlueprintNode.findUnique({ where: { code } })

    if (exists) {
      return reply.code(409).send({ message: 'Code node da ton tai trong global topology.' })
    }

    const node = await context.prisma.systemTopologyBlueprintNode.create({
      data: {
        code,
        name,
        kind: normalizeKind(body.kind),
        type: text(body.type) || 'Service',
        description: nullableText(body.description),
        notes: nullableText(body.notes),
        positionX: numberValue(body.positionX, 0),
        positionY: numberValue(body.positionY, 0),
      },
    })

    await upsertNodeBinding(context.prisma, environment.id, node.id, hostId, body)

    return node
  })

  app.patch('/api/system-manager/nodes/:nodeCode', { preHandler: requireAuth }, async (request, reply) => {
    const { nodeCode = '' } = paramsAs(request.params)
    const body = bodyAs<NodeBody>(request.body)
    const environmentKey = normalizeEnvironmentKey(body.environmentKey, queryEnvironmentKey(request.url))
    const environment = await ensureEnvironmentByKey(context.prisma, environmentKey, reply)

    if (!environment) {
      return
    }

    const current = await ensureBlueprintNodeByCode(context.prisma, nodeCode, reply)

    if (!current) {
      return
    }

    const currentBinding = await context.prisma.systemNodeEnvironmentBinding.findUnique({
      where: {
        environmentId_nodeId: {
          environmentId: environment.id,
          nodeId: current.id,
        },
      },
    })
    const code = body.code === undefined ? current.code : normalizeCode(body.code, body.name ?? current.name)
    const name = body.name === undefined ? current.name : text(body.name)
    const hostId =
      body.hostId === undefined
        ? currentBinding?.hostId ?? null
        : await resolveHostId(context.prisma, body.hostId, environment.id, reply)

    if (hostId === false) {
      return
    }

    if (!code || !name) {
      return reply.code(400).send({ message: 'Can nhap code va ten node.' })
    }

    const duplicate = await context.prisma.systemTopologyBlueprintNode.findFirst({
      where: {
        code,
        id: { not: current.id },
      },
    })

    if (duplicate) {
      return reply.code(409).send({ message: 'Code node da ton tai trong global topology.' })
    }

    const node = await context.prisma.systemTopologyBlueprintNode.update({
      where: { id: current.id },
      data: {
        code,
        name,
        kind: body.kind === undefined ? current.kind : normalizeKind(body.kind, current.kind),
        type: body.type === undefined ? current.type : text(body.type) || current.type,
        description: body.description === undefined ? current.description : nullableText(body.description),
        notes: body.notes === undefined ? current.notes : nullableText(body.notes),
        positionX: numberValue(body.positionX, current.positionX),
        positionY: numberValue(body.positionY, current.positionY),
      },
    })

    await upsertNodeBinding(context.prisma, environment.id, node.id, hostId, body, currentBinding ?? undefined)

    return node
  })

  app.delete('/api/system-manager/nodes/:nodeCode', { preHandler: requireAuth }, async (request, reply) => {
    const { nodeCode = '' } = paramsAs(request.params)
    const node = await ensureBlueprintNodeByCode(context.prisma, nodeCode, reply)

    if (!node) {
      return
    }

    await context.prisma.systemTopologyBlueprintNode.delete({ where: { id: node.id } })

    return reply.code(204).send()
  })

  app.post('/api/system-manager/dependencies', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<DependencyBody>(request.body)
    const environmentKey = normalizeEnvironmentKey(body.environmentKey, 'local')
    const environment = await ensureEnvironmentByKey(context.prisma, environmentKey, reply)

    if (!environment) {
      return
    }

    const configItems = normalizeConfigItems(body.configItems)
    const requestedCode = normalizeCode(body.code)
    const existingDependency = requestedCode
      ? await context.prisma.systemTopologyBlueprintDependency.findUnique({ where: { code: requestedCode } })
      : null
    const sourceCode = normalizeCode(body.sourceCode)
    const targetCode = normalizeCode(body.targetCode)
    const [sourceNode, targetNode] = await Promise.all([
      sourceCode ? ensureBlueprintNodeByCode(context.prisma, sourceCode, reply) : Promise.resolve(null),
      targetCode ? ensureBlueprintNodeByCode(context.prisma, targetCode, reply) : Promise.resolve(null),
    ])
    const code =
      requestedCode || normalizeCode(undefined, sourceNode && targetNode ? `${sourceNode.code}-${targetNode.code}` : '')
    const label = text(body.label) || existingDependency?.label || configItems[0]?.key || ''

    if (!existingDependency && !sourceNode && !targetNode) {
      return reply.code(400).send({ message: 'Can chon dependency co san hoac chon source/target de tao moi.' })
    }

    if (!existingDependency && (!sourceNode || !targetNode)) {
      return reply.code(400).send({ message: 'Can chon source va target node cho dependency moi.' })
    }

    if (!code) {
      return reply.code(400).send({ message: 'Can nhap code dependency hoac chon source/target.' })
    }

    if (!label) {
      return reply.code(400).send({ message: 'Can nhap label dependency hoac it nhat mot dong Edge config.' })
    }

    const dependency = existingDependency
      ? await context.prisma.systemTopologyBlueprintDependency.update({
          where: { id: existingDependency.id },
          data: {
            sourceNodeId: sourceNode?.id ?? existingDependency.sourceNodeId,
            targetNodeId: targetNode?.id ?? existingDependency.targetNodeId,
            label,
            connectionType:
              body.connectionType === undefined
                ? existingDependency.connectionType
                : text(body.connectionType) || 'dependency',
            direction:
              body.direction === undefined
                ? existingDependency.direction
                : normalizeDirection(body.direction, existingDependency.direction),
            port: body.port === undefined ? existingDependency.port : nullableText(body.port),
            description:
              body.description === undefined ? existingDependency.description : nullableText(body.description),
            sortOrder: numberValue(body.sortOrder, existingDependency.sortOrder),
          },
        })
      : await context.prisma.systemTopologyBlueprintDependency.create({
          data: {
            code,
            sourceNodeId: sourceNode?.id ?? '',
            targetNodeId: targetNode?.id ?? '',
            label,
            connectionType: text(body.connectionType) || 'dependency',
            direction: normalizeDirection(body.direction),
            port: nullableText(body.port),
            description: nullableText(body.description),
            sortOrder: numberValue(body.sortOrder, 0),
          },
        })

    const binding = await context.prisma.systemDependencyEnvironmentBinding.upsert({
      where: {
        environmentId_dependencyId: {
          environmentId: environment.id,
          dependencyId: dependency.id,
        },
      },
      create: {
        environmentId: environment.id,
        dependencyId: dependency.id,
      },
      update: {},
    })

    await replaceDependencyBindingConfigItems(context.prisma, binding.id, body.configItems)

    return dependency
  })

  app.patch('/api/system-manager/dependencies/:dependencyCode', { preHandler: requireAuth }, async (request, reply) => {
    const { dependencyCode = '' } = paramsAs(request.params)
    const body = bodyAs<DependencyBody>(request.body)
    const environmentKey = normalizeEnvironmentKey(body.environmentKey, queryEnvironmentKey(request.url))
    const environment = await ensureEnvironmentByKey(context.prisma, environmentKey, reply)

    if (!environment) {
      return
    }

    const current = await ensureBlueprintDependencyByCode(context.prisma, dependencyCode, reply)

    if (!current) {
      return
    }

    const sourceNode =
      body.sourceCode === undefined
        ? null
        : await ensureBlueprintNodeByCode(context.prisma, normalizeCode(body.sourceCode), reply)
    const targetNode =
      body.targetCode === undefined
        ? null
        : await ensureBlueprintNodeByCode(context.prisma, normalizeCode(body.targetCode), reply)
    const configItems = normalizeConfigItems(body.configItems)

    if (body.sourceCode !== undefined && !sourceNode) {
      return
    }

    if (body.targetCode !== undefined && !targetNode) {
      return
    }

    const nextCode = body.code === undefined ? current.code : normalizeCode(body.code, current.code)
    const nextLabel = body.label === undefined ? current.label : text(body.label) || current.label || configItems[0]?.key || ''

    if (!nextCode || !nextLabel) {
      return reply.code(400).send({ message: 'Can nhap label dependency hoac it nhat mot dong Edge config.' })
    }

    const duplicate = await context.prisma.systemTopologyBlueprintDependency.findFirst({
      where: {
        code: nextCode,
        id: { not: current.id },
      },
    })

    if (duplicate) {
      return reply.code(409).send({ message: 'Code dependency da ton tai trong global topology.' })
    }

    const dependency = await context.prisma.systemTopologyBlueprintDependency.update({
      where: { id: current.id },
      data: {
        code: nextCode,
        sourceNodeId: sourceNode?.id ?? current.sourceNodeId,
        targetNodeId: targetNode?.id ?? current.targetNodeId,
        label: nextLabel,
        connectionType:
          body.connectionType === undefined ? current.connectionType : text(body.connectionType) || 'dependency',
        direction:
          body.direction === undefined ? current.direction : normalizeDirection(body.direction, current.direction),
        port: body.port === undefined ? current.port : nullableText(body.port),
        description: body.description === undefined ? current.description : nullableText(body.description),
        sortOrder: numberValue(body.sortOrder, current.sortOrder),
      },
    })

    if (body.configItems !== undefined) {
      const binding = await context.prisma.systemDependencyEnvironmentBinding.upsert({
        where: {
          environmentId_dependencyId: {
            environmentId: environment.id,
            dependencyId: dependency.id,
          },
        },
        create: {
          environmentId: environment.id,
          dependencyId: dependency.id,
        },
        update: {},
      })

      await replaceDependencyBindingConfigItems(context.prisma, binding.id, body.configItems)
    }

    return dependency
  })

  app.delete('/api/system-manager/dependencies/:dependencyCode', { preHandler: requireAuth }, async (request, reply) => {
    const { dependencyCode = '' } = paramsAs(request.params)
    const dependency = await ensureBlueprintDependencyByCode(context.prisma, dependencyCode, reply)

    if (!dependency) {
      return
    }

    await context.prisma.systemTopologyBlueprintDependency.delete({ where: { id: dependency.id } })

    return reply.code(204).send()
  })

  app.get('/api/system-manager/topology', { preHandler: requireAuth }, async (request, reply) => {
    const environmentKey = queryEnvironmentKey(request.url)
    const environment = await context.prisma.systemEnvironment.findUnique({
      where: { key: environmentKey },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
      },
    })

    if (!environment) {
      return reply.code(404).send({ message: 'Khong tim thay moi truong he thong.' })
    }

    const [nodes, dependencies] = await Promise.all([
      context.prisma.systemTopologyBlueprintNode.findMany({
        orderBy: [{ kind: 'asc' }, { positionX: 'asc' }, { positionY: 'asc' }],
        include: {
          bindings: {
            where: { environmentId: environment.id },
            include: {
              host: {
                select: {
                  name: true,
                  ip: true,
                },
              },
              configGroups: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  items: {
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          },
        },
      }),
      context.prisma.systemTopologyBlueprintDependency.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          sourceNode: {
            select: {
              code: true,
            },
          },
          targetNode: {
            select: {
              code: true,
            },
          },
          bindings: {
            where: { environmentId: environment.id },
            include: {
              configItems: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      }),
    ])

    return {
      environment: {
        id: environment.id,
        key: environment.key,
        label: environment.name,
        description: environment.description,
      },
      nodes: nodes.map((node) => {
        const binding = node.bindings[0]

        return {
          id: node.code,
          name: node.name,
          kind: node.kind,
          type: node.type,
          status: binding?.status ?? 'unknown',
          environment: environment.key,
          description: node.description ?? '',
          tags: parseJsonArray(binding?.tagsJson),
          runtime: {
            hostId: binding?.hostId ?? '',
            host: binding?.host?.name ?? '',
            ip: binding?.host?.ip ?? '',
            ports: parseJsonArray(binding?.portsJson),
            containerName: binding?.containerName ?? '',
            image: binding?.image ?? '',
            network: binding?.network ?? '',
          },
          configs:
            binding?.configGroups.map((group) => ({
              name: group.name,
              items: group.items.map((item) => ({
                key: item.key,
                value: item.value,
                secret: item.secret,
              })),
            })) ?? [],
          notes: node.notes ?? '',
          position: {
            x: node.positionX,
            y: node.positionY,
          },
        }
      }),
      edges: dependencies.map((dependency) => {
        const binding = dependency.bindings[0]

        return {
          id: dependency.code,
          source: dependency.sourceNode.code,
          target: dependency.targetNode.code,
          label: binding?.label || dependency.label,
          connectionType: binding?.connectionType || dependency.connectionType,
          direction: binding?.direction || dependency.direction,
          port: binding?.port || dependency.port || '',
          description: binding?.description || dependency.description || '',
          configItems:
            binding?.configItems.map((item) => ({
              key: item.key,
              value: item.value,
              secret: item.secret,
            })) ?? [],
        }
      }),
    }
  })
}
