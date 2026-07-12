import type { AppPrismaClient } from '../db.js'

type UnknownRecord = Record<string, unknown>

type ImportIssue = {
  level: 'error' | 'warning'
  message: string
}

type ImportSummaryItem = {
  create: number
  update: number
  total: number
}

export type SystemManagerImportPreview = {
  valid: boolean
  summary: {
    environments: ImportSummaryItem
    hosts: ImportSummaryItem
    nodes: ImportSummaryItem
    nodeBindings: ImportSummaryItem
    dependencies: ImportSummaryItem
    dependencyBindings: ImportSummaryItem
  }
  issues: ImportIssue[]
}

type NormalizedConfigItem = {
  key: string
  value: string
  secret: boolean
  sortOrder: number
}

type NormalizedConfigGroup = {
  name: string
  sortOrder: number
  items: NormalizedConfigItem[]
}

type NormalizedEnvironment = {
  key: string
  name: string
  description: string | null
  color: string
  sortOrder: number
}

type NormalizedHost = {
  environmentKey: string
  name: string
  ip: string
  description: string | null
  sortOrder: number
}

type NormalizedNodeBinding = {
  environmentKey: string
  hostName: string
  status: string
  tags: string[]
  containerName: string | null
  image: string | null
  ports: string[]
  network: string | null
  configs: NormalizedConfigGroup[]
}

type NormalizedNode = {
  code: string
  name: string
  kind: string
  type: string
  description: string | null
  notes: string | null
  positionX: number
  positionY: number
  bindings: NormalizedNodeBinding[]
}

type NormalizedDependencyBinding = {
  environmentKey: string
  label: string | null
  connectionType: string | null
  direction: string | null
  port: string | null
  description: string | null
  sortOrder: number | null
  configItems: NormalizedConfigItem[]
}

type NormalizedDependency = {
  code: string
  sourceCode: string
  targetCode: string
  label: string
  connectionType: string
  direction: string
  port: string | null
  description: string | null
  sortOrder: number
  bindings: NormalizedDependencyBinding[]
}

type NormalizedImportDocument = {
  environments: NormalizedEnvironment[]
  hosts: NormalizedHost[]
  nodes: NormalizedNode[]
  dependencies: NormalizedDependency[]
}

const nodeKinds = new Set(['app', 'component', 'service'])
const topologyStatuses = new Set(['healthy', 'warning', 'down', 'unknown', 'maintenance', 'disabled'])
const dependencyDirections = new Set(['request', 'read', 'write', 'publish', 'consume', 'proxy'])
const environmentColorOverrides: Record<string, string> = {
  local: '#475467',
  dev: '#2563eb',
  development: '#2563eb',
  staging: '#d97706',
  stage: '#d97706',
  production: '#dc2626',
  prod: '#dc2626',
}
const environmentColorPalette = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#c026d3', '#0891b2']

export class SystemManagerImportError extends Error {
  issues: ImportIssue[]

  constructor(issues: ImportIssue[]) {
    super('System Manager import payload is invalid.')
    this.issues = issues
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function objectList(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : []
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

function nullableNumberValue(value: unknown) {
  if (value === undefined || value === null || text(value) === '') {
    return null
  }

  return numberValue(value, 0)
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function hashText(value: string) {
  return value.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0)
}

function defaultEnvironmentColor(key: string) {
  const normalizedKey = key.trim().toLowerCase()

  return (
    environmentColorOverrides[normalizedKey] ??
    environmentColorPalette[hashText(normalizedKey) % environmentColorPalette.length] ??
    '#667085'
  )
}

function colorValue(value: unknown, fallback: string) {
  const rawValue = text(value)

  return /^#[0-9a-f]{6}$/i.test(rawValue) ? rawValue.toLowerCase() : fallback
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

function uniqueBy<T>(items: T[], keyOf: (item: T) => string) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = keyOf(item)

    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function normalizeConfigItems(value: unknown) {
  return uniqueBy(
    objectList(value)
      .map((item, index) => {
        const key = text(item.key)
        const rawValue = text(item.value)
        const secretPrefixed = rawValue.startsWith('secret:')

        if (!key) {
          return null
        }

        return {
          key,
          value: secretPrefixed ? rawValue.slice('secret:'.length) : rawValue,
          secret: booleanValue(item.secret, secretPrefixed),
          sortOrder: numberValue(item.sortOrder, index),
        }
      })
      .filter((item): item is NormalizedConfigItem => Boolean(item)),
    (item) => item.key,
  )
}

function normalizeConfigGroups(value: unknown) {
  return uniqueBy(
    objectList(value)
      .map((group, index) => {
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
      .filter((group): group is NormalizedConfigGroup => Boolean(group)),
    (group) => group.name,
  )
}

function normalizeEnvironment(item: UnknownRecord, index: number): NormalizedEnvironment | null {
  const key = normalizeEnvironmentKey(item.key, item.name)
  const name = text(item.name) || key

  if (!key || !name) {
    return null
  }

  return {
    key,
    name,
    description: nullableText(item.description),
    color: colorValue(item.color, defaultEnvironmentColor(key)),
    sortOrder: numberValue(item.sortOrder, index),
  }
}

function normalizeHost(item: UnknownRecord, index: number): NormalizedHost | null {
  const environmentKey = normalizeEnvironmentKey(item.environmentKey ?? item.environment)
  const name = text(item.name)
  const ip = text(item.ip)

  if (!environmentKey || !name || !ip) {
    return null
  }

  return {
    environmentKey,
    name,
    ip,
    description: nullableText(item.description),
    sortOrder: numberValue(item.sortOrder, index),
  }
}

function normalizeNodeBinding(item: UnknownRecord): NormalizedNodeBinding | null {
  const environmentKey = normalizeEnvironmentKey(item.environmentKey ?? item.environment)

  if (!environmentKey) {
    return null
  }

  return {
    environmentKey,
    hostName: text(item.hostName ?? item.host),
    status: normalizeStatus(item.status),
    tags: stringList(item.tags),
    containerName: nullableText(item.containerName),
    image: nullableText(item.image),
    ports: stringList(item.ports),
    network: nullableText(item.network),
    configs: normalizeConfigGroups(item.configs ?? item.configGroups),
  }
}

function normalizeNode(item: UnknownRecord, index: number): NormalizedNode | null {
  const code = normalizeCode(item.code, item.name)
  const name = text(item.name)

  if (!code || !name) {
    return null
  }

  return {
    code,
    name,
    kind: normalizeKind(item.kind),
    type: text(item.type) || 'Service',
    description: nullableText(item.description),
    notes: nullableText(item.notes),
    positionX: numberValue(item.positionX, index * 180),
    positionY: numberValue(item.positionY, 120),
    bindings: objectList(item.bindings).map(normalizeNodeBinding).filter((binding): binding is NormalizedNodeBinding => Boolean(binding)),
  }
}

function normalizeDependencyBinding(item: UnknownRecord): NormalizedDependencyBinding | null {
  const environmentKey = normalizeEnvironmentKey(item.environmentKey ?? item.environment)

  if (!environmentKey) {
    return null
  }

  return {
    environmentKey,
    label: nullableText(item.label),
    connectionType: nullableText(item.connectionType),
    direction: item.direction === undefined ? null : normalizeDirection(item.direction),
    port: nullableText(item.port),
    description: nullableText(item.description),
    sortOrder: nullableNumberValue(item.sortOrder),
    configItems: normalizeConfigItems(item.configItems ?? item.configs),
  }
}

function normalizeDependency(item: UnknownRecord, index: number): NormalizedDependency | null {
  const sourceCode = normalizeCode(item.sourceCode ?? item.source)
  const targetCode = normalizeCode(item.targetCode ?? item.target)
  const configItems = normalizeConfigItems(item.configItems ?? item.configs)
  const code = normalizeCode(item.code, sourceCode && targetCode ? `${sourceCode}-${targetCode}` : undefined)
  const label = text(item.label) || configItems[0]?.key || code

  if (!code || !sourceCode || !targetCode || !label) {
    return null
  }

  return {
    code,
    sourceCode,
    targetCode,
    label,
    connectionType: text(item.connectionType) || 'dependency',
    direction: normalizeDirection(item.direction),
    port: nullableText(item.port),
    description: nullableText(item.description),
    sortOrder: numberValue(item.sortOrder, index),
    bindings: objectList(item.bindings).map(normalizeDependencyBinding).filter((binding): binding is NormalizedDependencyBinding => Boolean(binding)),
  }
}

function normalizeImportDocument(rawValue: unknown): NormalizedImportDocument {
  const rawDocument = isRecord(rawValue) && isRecord(rawValue.document) ? rawValue.document : rawValue
  const document = isRecord(rawDocument) ? rawDocument : {}

  return {
    environments: uniqueBy(
      objectList(document.environments).map(normalizeEnvironment).filter((item): item is NormalizedEnvironment => Boolean(item)),
      (environment) => environment.key,
    ),
    hosts: uniqueBy(
      objectList(document.hosts).map(normalizeHost).filter((item): item is NormalizedHost => Boolean(item)),
      (host) => `${host.environmentKey}:${host.name}`,
    ),
    nodes: uniqueBy(
      objectList(document.nodes).map(normalizeNode).filter((item): item is NormalizedNode => Boolean(item)),
      (node) => node.code,
    ),
    dependencies: uniqueBy(
      objectList(document.dependencies).map(normalizeDependency).filter((item): item is NormalizedDependency => Boolean(item)),
      (dependency) => dependency.code,
    ),
  }
}

function emptySummaryItem(): ImportSummaryItem {
  return {
    create: 0,
    update: 0,
    total: 0,
  }
}

function incrementSummary(summary: ImportSummaryItem, exists: boolean) {
  summary.total += 1

  if (exists) {
    summary.update += 1
  } else {
    summary.create += 1
  }
}

async function existingTopologyIndexes(prisma: AppPrismaClient) {
  const [environments, hosts, nodes, dependencies, nodeBindings, dependencyBindings] = await Promise.all([
    prisma.systemEnvironment.findMany({ select: { id: true, key: true } }),
    prisma.systemHost.findMany({
      select: {
        name: true,
        environment: {
          select: {
            key: true,
          },
        },
      },
    }),
    prisma.systemTopologyBlueprintNode.findMany({ select: { code: true } }),
    prisma.systemTopologyBlueprintDependency.findMany({ select: { code: true } }),
    prisma.systemNodeEnvironmentBinding.findMany({
      select: {
        environment: { select: { key: true } },
        node: { select: { code: true } },
      },
    }),
    prisma.systemDependencyEnvironmentBinding.findMany({
      select: {
        environment: { select: { key: true } },
        dependency: { select: { code: true } },
      },
    }),
  ])

  return {
    environmentKeys: new Set(environments.map((environment) => environment.key)),
    hostKeys: new Set(hosts.map((host) => `${host.environment.key}:${host.name}`)),
    nodeCodes: new Set(nodes.map((node) => node.code)),
    dependencyCodes: new Set(dependencies.map((dependency) => dependency.code)),
    nodeBindingKeys: new Set(nodeBindings.map((binding) => `${binding.environment.key}:${binding.node.code}`)),
    dependencyBindingKeys: new Set(
      dependencyBindings.map((binding) => `${binding.environment.key}:${binding.dependency.code}`),
    ),
  }
}

export async function previewSystemManagerImport(
  prisma: AppPrismaClient,
  rawValue: unknown,
): Promise<SystemManagerImportPreview> {
  const document = normalizeImportDocument(rawValue)
  const existing = await existingTopologyIndexes(prisma)
  const importedEnvironmentKeys = new Set(document.environments.map((environment) => environment.key))
  const availableEnvironmentKeys = new Set([...existing.environmentKeys, ...importedEnvironmentKeys])
  const importedHostKeys = new Set(document.hosts.map((host) => `${host.environmentKey}:${host.name}`))
  const availableHostKeys = new Set([...existing.hostKeys, ...importedHostKeys])
  const importedNodeCodes = new Set(document.nodes.map((node) => node.code))
  const availableNodeCodes = new Set([...existing.nodeCodes, ...importedNodeCodes])
  const issues: ImportIssue[] = []
  const summary: SystemManagerImportPreview['summary'] = {
    environments: emptySummaryItem(),
    hosts: emptySummaryItem(),
    nodes: emptySummaryItem(),
    nodeBindings: emptySummaryItem(),
    dependencies: emptySummaryItem(),
    dependencyBindings: emptySummaryItem(),
  }

  for (const environment of document.environments) {
    incrementSummary(summary.environments, existing.environmentKeys.has(environment.key))
  }

  for (const host of document.hosts) {
    if (!availableEnvironmentKeys.has(host.environmentKey)) {
      issues.push({
        level: 'error',
        message: `Host "${host.name}" tham chieu environment "${host.environmentKey}" chua ton tai trong DB/import.`,
      })
    }

    incrementSummary(summary.hosts, existing.hostKeys.has(`${host.environmentKey}:${host.name}`))
  }

  for (const node of document.nodes) {
    incrementSummary(summary.nodes, existing.nodeCodes.has(node.code))

    for (const binding of node.bindings) {
      if (!availableEnvironmentKeys.has(binding.environmentKey)) {
        issues.push({
          level: 'error',
          message: `Node "${node.code}" co binding toi environment "${binding.environmentKey}" chua ton tai trong DB/import.`,
        })
      }

      if (binding.hostName && !availableHostKeys.has(`${binding.environmentKey}:${binding.hostName}`)) {
        issues.push({
          level: 'warning',
          message: `Node "${node.code}" tham chieu host "${binding.hostName}" trong "${binding.environmentKey}" nhung host chua co; binding se khong gan host.`,
        })
      }

      incrementSummary(summary.nodeBindings, existing.nodeBindingKeys.has(`${binding.environmentKey}:${node.code}`))
    }
  }

  for (const dependency of document.dependencies) {
    if (!availableNodeCodes.has(dependency.sourceCode)) {
      issues.push({
        level: 'error',
        message: `Dependency "${dependency.code}" thieu source node "${dependency.sourceCode}".`,
      })
    }

    if (!availableNodeCodes.has(dependency.targetCode)) {
      issues.push({
        level: 'error',
        message: `Dependency "${dependency.code}" thieu target node "${dependency.targetCode}".`,
      })
    }

    incrementSummary(summary.dependencies, existing.dependencyCodes.has(dependency.code))

    for (const binding of dependency.bindings) {
      if (!availableEnvironmentKeys.has(binding.environmentKey)) {
        issues.push({
          level: 'error',
          message: `Dependency "${dependency.code}" co binding toi environment "${binding.environmentKey}" chua ton tai trong DB/import.`,
        })
      }

      incrementSummary(
        summary.dependencyBindings,
        existing.dependencyBindingKeys.has(`${binding.environmentKey}:${dependency.code}`),
      )
    }
  }

  if (!document.environments.length && !document.nodes.length && !document.dependencies.length) {
    issues.push({
      level: 'error',
      message: 'File import khong co environments, nodes hoac dependencies hop le.',
    })
  }

  return {
    valid: issues.every((issue) => issue.level !== 'error'),
    summary,
    issues,
  }
}

async function replaceNodeBindingConfigGroups(
  prisma: AppPrismaClient,
  bindingId: string,
  groups: NormalizedConfigGroup[],
) {
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
  items: NormalizedConfigItem[],
) {
  await prisma.systemDependencyBindingConfig.deleteMany({ where: { bindingId } })

  if (!items.length) {
    return
  }

  await prisma.systemDependencyBindingConfig.createMany({
    data: items.map((item) => ({
      bindingId,
      key: item.key,
      value: item.value,
      secret: item.secret,
      sortOrder: item.sortOrder,
    })),
  })
}

export async function applySystemManagerImport(prisma: AppPrismaClient, rawValue: unknown) {
  const preview = await previewSystemManagerImport(prisma, rawValue)

  if (!preview.valid) {
    throw new SystemManagerImportError(preview.issues)
  }

  const document = normalizeImportDocument(rawValue)
  const environmentByKey = new Map<string, { id: string; key: string }>()
  const hostByEnvironmentAndName = new Map<string, { id: string }>()
  const nodeByCode = new Map<string, { id: string; code: string }>()
  const dependencyByCode = new Map<string, { id: string; code: string }>()

  for (const environment of document.environments) {
    const savedEnvironment = await prisma.systemEnvironment.upsert({
      where: { key: environment.key },
      create: environment,
      update: {
        name: environment.name,
        description: environment.description,
        color: environment.color,
        sortOrder: environment.sortOrder,
      },
      select: { id: true, key: true },
    })

    environmentByKey.set(savedEnvironment.key, savedEnvironment)
  }

  for (const environment of await prisma.systemEnvironment.findMany({ select: { id: true, key: true } })) {
    environmentByKey.set(environment.key, environment)
  }

  for (const host of document.hosts) {
    const environment = environmentByKey.get(host.environmentKey)

    if (!environment) {
      continue
    }

    const savedHost = await prisma.systemHost.upsert({
      where: {
        environmentId_name: {
          environmentId: environment.id,
          name: host.name,
        },
      },
      create: {
        environmentId: environment.id,
        name: host.name,
        ip: host.ip,
        description: host.description,
        sortOrder: host.sortOrder,
      },
      update: {
        ip: host.ip,
        description: host.description,
        sortOrder: host.sortOrder,
      },
      select: { id: true },
    })

    hostByEnvironmentAndName.set(`${host.environmentKey}:${host.name}`, savedHost)
  }

  for (const host of await prisma.systemHost.findMany({
    select: {
      id: true,
      name: true,
      environment: { select: { key: true } },
    },
  })) {
    hostByEnvironmentAndName.set(`${host.environment.key}:${host.name}`, { id: host.id })
  }

  for (const node of document.nodes) {
    const savedNode = await prisma.systemTopologyBlueprintNode.upsert({
      where: { code: node.code },
      create: {
        code: node.code,
        name: node.name,
        kind: node.kind,
        type: node.type,
        description: node.description,
        notes: node.notes,
        positionX: node.positionX,
        positionY: node.positionY,
      },
      update: {
        name: node.name,
        kind: node.kind,
        type: node.type,
        description: node.description,
        notes: node.notes,
        positionX: node.positionX,
        positionY: node.positionY,
      },
      select: { id: true, code: true },
    })

    nodeByCode.set(savedNode.code, savedNode)
  }

  for (const node of await prisma.systemTopologyBlueprintNode.findMany({ select: { id: true, code: true } })) {
    nodeByCode.set(node.code, node)
  }

  for (const node of document.nodes) {
    const savedNode = nodeByCode.get(node.code)

    if (!savedNode) {
      continue
    }

    for (const binding of node.bindings) {
      const environment = environmentByKey.get(binding.environmentKey)

      if (!environment) {
        continue
      }

      const host = binding.hostName
        ? hostByEnvironmentAndName.get(`${binding.environmentKey}:${binding.hostName}`) ?? null
        : null
      const savedBinding = await prisma.systemNodeEnvironmentBinding.upsert({
        where: {
          environmentId_nodeId: {
            environmentId: environment.id,
            nodeId: savedNode.id,
          },
        },
        create: {
          environmentId: environment.id,
          nodeId: savedNode.id,
          hostId: host?.id ?? null,
          status: binding.status,
          tagsJson: JSON.stringify(binding.tags),
          containerName: binding.containerName,
          image: binding.image,
          portsJson: JSON.stringify(binding.ports),
          network: binding.network,
        },
        update: {
          hostId: host?.id ?? null,
          status: binding.status,
          tagsJson: JSON.stringify(binding.tags),
          containerName: binding.containerName,
          image: binding.image,
          portsJson: JSON.stringify(binding.ports),
          network: binding.network,
        },
        select: { id: true },
      })

      await replaceNodeBindingConfigGroups(prisma, savedBinding.id, binding.configs)
    }
  }

  for (const dependency of document.dependencies) {
    const sourceNode = nodeByCode.get(dependency.sourceCode)
    const targetNode = nodeByCode.get(dependency.targetCode)

    if (!sourceNode || !targetNode) {
      continue
    }

    const savedDependency = await prisma.systemTopologyBlueprintDependency.upsert({
      where: { code: dependency.code },
      create: {
        code: dependency.code,
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        label: dependency.label,
        connectionType: dependency.connectionType,
        direction: dependency.direction,
        port: dependency.port,
        description: dependency.description,
        sortOrder: dependency.sortOrder,
      },
      update: {
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        label: dependency.label,
        connectionType: dependency.connectionType,
        direction: dependency.direction,
        port: dependency.port,
        description: dependency.description,
        sortOrder: dependency.sortOrder,
      },
      select: { id: true, code: true },
    })

    dependencyByCode.set(savedDependency.code, savedDependency)
  }

  for (const dependency of document.dependencies) {
    const savedDependency = dependencyByCode.get(dependency.code)

    if (!savedDependency) {
      continue
    }

    for (const binding of dependency.bindings) {
      const environment = environmentByKey.get(binding.environmentKey)

      if (!environment) {
        continue
      }

      const savedBinding = await prisma.systemDependencyEnvironmentBinding.upsert({
        where: {
          environmentId_dependencyId: {
            environmentId: environment.id,
            dependencyId: savedDependency.id,
          },
        },
        create: {
          environmentId: environment.id,
          dependencyId: savedDependency.id,
          label: binding.label,
          connectionType: binding.connectionType,
          direction: binding.direction,
          port: binding.port,
          description: binding.description,
          sortOrder: binding.sortOrder,
        },
        update: {
          label: binding.label,
          connectionType: binding.connectionType,
          direction: binding.direction,
          port: binding.port,
          description: binding.description,
          sortOrder: binding.sortOrder,
        },
        select: { id: true },
      })

      await replaceDependencyBindingConfigItems(prisma, savedBinding.id, binding.configItems)
    }
  }

  return preview
}

export async function buildSystemManagerExport(prisma: AppPrismaClient) {
  const [environments, hosts, nodes, dependencies] = await Promise.all([
    prisma.systemEnvironment.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        key: true,
        name: true,
        description: true,
        color: true,
        sortOrder: true,
      },
    }),
    prisma.systemHost.findMany({
      orderBy: [{ environment: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        name: true,
        ip: true,
        description: true,
        sortOrder: true,
        environment: {
          select: {
            key: true,
          },
        },
      },
    }),
    prisma.systemTopologyBlueprintNode.findMany({
      orderBy: [{ kind: 'asc' }, { positionX: 'asc' }, { positionY: 'asc' }, { name: 'asc' }],
      include: {
        bindings: {
          orderBy: { environment: { sortOrder: 'asc' } },
          include: {
            environment: { select: { key: true } },
            host: { select: { name: true } },
            configGroups: {
              orderBy: { sortOrder: 'asc' },
              include: {
                items: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    }),
    prisma.systemTopologyBlueprintDependency.findMany({
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      include: {
        sourceNode: { select: { code: true } },
        targetNode: { select: { code: true } },
        bindings: {
          orderBy: { environment: { sortOrder: 'asc' } },
          include: {
            environment: { select: { key: true } },
            configItems: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    }),
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    environments: environments.map((environment) => ({
      key: environment.key,
      name: environment.name,
      description: environment.description,
      color: environment.color,
      sortOrder: environment.sortOrder,
    })),
    hosts: hosts.map((host) => ({
      environmentKey: host.environment.key,
      name: host.name,
      ip: host.ip,
      description: host.description,
      sortOrder: host.sortOrder,
    })),
    nodes: nodes.map((node) => ({
      code: node.code,
      name: node.name,
      kind: node.kind,
      type: node.type,
      description: node.description,
      notes: node.notes,
      positionX: node.positionX,
      positionY: node.positionY,
      bindings: node.bindings.map((binding) => ({
        environmentKey: binding.environment.key,
        hostName: binding.host?.name ?? '',
        status: binding.status,
        tags: parseJsonArray(binding.tagsJson),
        containerName: binding.containerName,
        image: binding.image,
        ports: parseJsonArray(binding.portsJson),
        network: binding.network,
        configs: binding.configGroups.map((group) => ({
          name: group.name,
          sortOrder: group.sortOrder,
          items: group.items.map((item) => ({
            key: item.key,
            value: item.value,
            secret: item.secret,
            sortOrder: item.sortOrder,
          })),
        })),
      })),
    })),
    dependencies: dependencies.map((dependency) => ({
      code: dependency.code,
      sourceCode: dependency.sourceNode.code,
      targetCode: dependency.targetNode.code,
      label: dependency.label,
      connectionType: dependency.connectionType,
      direction: dependency.direction,
      port: dependency.port,
      description: dependency.description,
      sortOrder: dependency.sortOrder,
      bindings: dependency.bindings.map((binding) => ({
        environmentKey: binding.environment.key,
        label: binding.label,
        connectionType: binding.connectionType,
        direction: binding.direction,
        port: binding.port,
        description: binding.description,
        sortOrder: binding.sortOrder,
        configItems: binding.configItems.map((item) => ({
          key: item.key,
          value: item.value,
          secret: item.secret,
          sortOrder: item.sortOrder,
        })),
      })),
    })),
  }
}
