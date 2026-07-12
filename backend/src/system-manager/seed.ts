import type { PrismaClient } from '@prisma/client'

type SeedEnvironment = {
  key: string
  name: string
  color: string
  appHost: {
    name: string
    ip: string
  }
  serviceHost: {
    name: string
    ip: string
  }
  externalHost: {
    name: string
    ip: string
  }
  statuses: {
    app: string
    redis: string
    kafka: string
    consumer: string
    ocr: string
  }
}

type ConfigItemSeed = {
  key: string
  value: string
  secret?: boolean
}

type ConfigGroupSeed = {
  name: string
  items: ConfigItemSeed[]
}

type BlueprintNodeSeed = {
  code: string
  name: string
  kind: string
  type: string
  description: string
  notes: string
  positionX: number
  positionY: number
}

type NodeBindingSeed = {
  nodeCode: string
  hostName: string
  status: string
  tags: string[]
  containerName: string
  image: string
  ports: string[]
  network: string
  configs: ConfigGroupSeed[]
}

type BlueprintDependencySeed = {
  code: string
  sourceCode: string
  targetCode: string
  label: string
  connectionType: string
  direction: string
  port: string
  description: string
  sortOrder: number
}

type DependencyBindingSeed = {
  dependencyCode: string
  configs: ConfigItemSeed[]
}

const environments: SeedEnvironment[] = [
  {
    key: 'local',
    name: 'Local',
    color: '#475467',
    appHost: { name: 'khanh-dev-laptop', ip: '127.0.0.1' },
    serviceHost: { name: 'khanh-dev-laptop', ip: '127.0.0.1' },
    externalHost: { name: 'local-external-mock', ip: '127.0.0.1' },
    statuses: {
      app: 'unknown',
      redis: 'unknown',
      kafka: 'unknown',
      consumer: 'unknown',
      ocr: 'unknown',
    },
  },
  {
    key: 'dev',
    name: 'Dev',
    color: '#2563eb',
    appHost: { name: 'dev-app-01', ip: '10.20.1.21' },
    serviceHost: { name: 'dev-service-01', ip: '10.20.1.31' },
    externalHost: { name: 'sap-gateway', ip: '10.20.5.10' },
    statuses: {
      app: 'healthy',
      redis: 'healthy',
      kafka: 'warning',
      consumer: 'warning',
      ocr: 'down',
    },
  },
]

const blueprintNodes: BlueprintNodeSeed[] = [
  {
    code: 'b2p-app',
    name: 'B2P',
    kind: 'app',
    type: 'Application',
    description: 'Ứng dụng B2P mẫu để kiểm chứng topology và flow dependency.',
    notes: 'Collapsed view gom dependency của các component để nhìn tổng quan nhanh.',
    positionX: 80,
    positionY: 260,
  },
  {
    code: 'b2p-web',
    name: 'B2P Web/API',
    kind: 'component',
    type: 'Web/API',
    description: 'HTTP API chính của B2P.',
    notes: 'Nhận request từ frontend/internal services và gọi DB, Redis, SAP, Mail.',
    positionX: 250,
    positionY: 70,
  },
  {
    code: 'b2p-worker',
    name: 'B2P Queue Worker',
    kind: 'component',
    type: 'Queue Worker',
    description: 'Worker xử lý job nền và publish event sang Kafka.',
    notes: 'Cần Redis queue và Kafka broker để xử lý đồng bộ nền.',
    positionX: 250,
    positionY: 230,
  },
  {
    code: 'b2p-scheduler',
    name: 'B2P Scheduler',
    kind: 'component',
    type: 'Scheduler',
    description: 'Cron/scheduler chạy các tác vụ định kỳ.',
    notes: 'Đọc DB, gọi OCR và gửi mail nhắc việc trong flow mẫu.',
    positionX: 250,
    positionY: 390,
  },
  {
    code: 'b2p-consumer',
    name: 'B2P Consumer',
    kind: 'component',
    type: 'Consumer',
    description: 'Consumer đọc event Kafka và đồng bộ sang SAP.',
    notes: 'Consumer thể hiện hướng consume riêng với edge Kafka.',
    positionX: 520,
    positionY: 300,
  },
  {
    code: 'svc-mariadb',
    name: 'MariaDB',
    kind: 'service',
    type: 'Database',
    description: 'Database chính của B2P.',
    notes: 'Một service logical dùng chung; runtime/config thay đổi theo môi trường.',
    positionX: 780,
    positionY: 20,
  },
  {
    code: 'svc-redis',
    name: 'Redis',
    kind: 'service',
    type: 'Cache',
    description: 'Cache, session và queue backend.',
    notes: 'Node chung để thấy các component nào đang phụ thuộc Redis.',
    positionX: 780,
    positionY: 150,
  },
  {
    code: 'svc-kafka',
    name: 'Kafka',
    kind: 'service',
    type: 'Message Broker',
    description: 'Message broker cho publish/consume event.',
    notes: 'Có cả hướng publish từ Worker và consume từ Consumer.',
    positionX: 780,
    positionY: 280,
  },
  {
    code: 'svc-sap',
    name: 'SAP API',
    kind: 'service',
    type: 'External API',
    description: 'Dịch vụ SAP nội bộ được B2P gọi để đồng bộ dữ liệu.',
    notes: 'Production sau này chỉ cần theo dõi, phase này dùng seed.',
    positionX: 1080,
    positionY: 300,
  },
  {
    code: 'svc-mail',
    name: 'Mail',
    kind: 'service',
    type: 'Mail',
    description: 'SMTP relay cho thông báo nội bộ.',
    notes: 'Mock mail service để kiểm tra config grouping và copy env line.',
    positionX: 780,
    positionY: 540,
  },
  {
    code: 'svc-ocr',
    name: 'OCR',
    kind: 'service',
    type: 'OCR',
    description: 'OCR API dùng trong tác vụ định kỳ.',
    notes: 'Dev đang đặt trạng thái down để test màu status và impact flow.',
    positionX: 1080,
    positionY: 430,
  },
]

const blueprintDependencies: BlueprintDependencySeed[] = [
  {
    code: 'web-db',
    sourceCode: 'b2p-web',
    targetCode: 'svc-mariadb',
    label: 'DB_HOST',
    connectionType: 'database',
    direction: 'read',
    port: '3306',
    description: 'Web/API đọc ghi dữ liệu chính.',
    sortOrder: 10,
  },
  {
    code: 'web-redis',
    sourceCode: 'b2p-web',
    targetCode: 'svc-redis',
    label: 'REDIS_HOST +3',
    connectionType: 'cache/session',
    direction: 'read',
    port: '6379',
    description: 'Web/API dùng Redis cho cache và session.',
    sortOrder: 20,
  },
  {
    code: 'web-sap',
    sourceCode: 'b2p-web',
    targetCode: 'svc-sap',
    label: 'SAP_URL',
    connectionType: 'http api',
    direction: 'request',
    port: '443',
    description: 'Web/API gọi SAP trong một số thao tác đồng bộ.',
    sortOrder: 30,
  },
  {
    code: 'web-mail',
    sourceCode: 'b2p-web',
    targetCode: 'svc-mail',
    label: 'MAIL_HOST',
    connectionType: 'smtp',
    direction: 'request',
    port: '587',
    description: 'Web/API gửi email xác nhận/thông báo.',
    sortOrder: 40,
  },
  {
    code: 'worker-redis',
    sourceCode: 'b2p-worker',
    targetCode: 'svc-redis',
    label: 'REDIS_QUEUE',
    connectionType: 'queue backend',
    direction: 'read',
    port: '6379',
    description: 'Worker lấy job từ Redis queue.',
    sortOrder: 50,
  },
  {
    code: 'worker-kafka',
    sourceCode: 'b2p-worker',
    targetCode: 'svc-kafka',
    label: 'KAFKA_BROKER / publish',
    connectionType: 'message broker',
    direction: 'publish',
    port: '9092',
    description: 'Worker publish event sang Kafka.',
    sortOrder: 60,
  },
  {
    code: 'consumer-kafka',
    sourceCode: 'b2p-consumer',
    targetCode: 'svc-kafka',
    label: 'KAFKA_BROKER / consume',
    connectionType: 'message broker',
    direction: 'consume',
    port: '9092',
    description: 'Consumer đọc event từ Kafka.',
    sortOrder: 70,
  },
  {
    code: 'consumer-sap',
    sourceCode: 'b2p-consumer',
    targetCode: 'svc-sap',
    label: 'SAP_SYNC_URL',
    connectionType: 'http api',
    direction: 'request',
    port: '443',
    description: 'Consumer đồng bộ event sang SAP.',
    sortOrder: 80,
  },
  {
    code: 'scheduler-db',
    sourceCode: 'b2p-scheduler',
    targetCode: 'svc-mariadb',
    label: 'DB_HOST',
    connectionType: 'database',
    direction: 'read',
    port: '3306',
    description: 'Scheduler đọc dữ liệu để chạy batch.',
    sortOrder: 90,
  },
  {
    code: 'scheduler-ocr',
    sourceCode: 'b2p-scheduler',
    targetCode: 'svc-ocr',
    label: 'OCR_URL',
    connectionType: 'http api',
    direction: 'request',
    port: '8088',
    description: 'Scheduler gọi OCR API.',
    sortOrder: 100,
  },
  {
    code: 'scheduler-mail',
    sourceCode: 'b2p-scheduler',
    targetCode: 'svc-mail',
    label: 'MAIL_HOST',
    connectionType: 'smtp',
    direction: 'request',
    port: '587',
    description: 'Scheduler gửi email nhắc việc.',
    sortOrder: 110,
  },
]

function envSuffix(environmentKey: string) {
  return environmentKey === 'local' ? 'local' : environmentKey
}

function appConfigGroups(environment: SeedEnvironment): ConfigGroupSeed[] {
  const env = envSuffix(environment.key)

  return [
    {
      name: 'App',
      items: [
        { key: 'APP_NAME', value: `B2P ${environment.name}` },
        { key: 'APP_ENV', value: env },
        { key: 'APP_URL', value: `https://b2p-${env}.company.local` },
        { key: 'APP_KEY', value: `base64:${env}-mock-secret`, secret: true },
      ],
    },
    {
      name: 'DB',
      items: [
        { key: 'DB_HOST', value: `mariadb-${env}.company.local` },
        { key: 'DB_PORT', value: '3306' },
        { key: 'DB_DATABASE', value: `b2p_${env}` },
        { key: 'DB_USERNAME', value: `b2p_${env}` },
        { key: 'DB_PASSWORD', value: `${env}-db-password`, secret: true },
      ],
    },
    {
      name: 'Redis',
      items: [
        { key: 'REDIS_HOST', value: `redis-${env}.company.local` },
        { key: 'REDIS_PORT', value: '6379' },
        { key: 'CACHE_DRIVER', value: 'redis' },
        { key: 'SESSION_DRIVER', value: 'redis' },
        { key: 'REDIS_PASSWORD', value: `${env}-redis-password`, secret: true },
      ],
    },
    {
      name: 'Kafka',
      items: [
        { key: 'KAFKA_BROKER', value: `kafka-${env}.company.local:9092` },
        { key: 'KAFKA_TOPIC_B2P', value: `b2p.events.${env}` },
      ],
    },
    {
      name: 'External API',
      items: [
        { key: 'SAP_URL', value: `https://sap-${env}.company.local/api` },
        { key: 'SAP_TOKEN', value: `${env}-sap-token`, secret: true },
        { key: 'OCR_URL', value: `https://ocr-${env}.company.local/api` },
      ],
    },
    {
      name: 'Mail',
      items: [
        { key: 'MAIL_HOST', value: `mail-${env}.company.local` },
        { key: 'MAIL_PORT', value: '587' },
        { key: 'MAIL_PASSWORD', value: `${env}-mail-password`, secret: true },
      ],
    },
  ]
}

function serviceConfigGroup(name: string, items: ConfigItemSeed[]): ConfigGroupSeed[] {
  return [{ name, items }]
}

function nodeBindingsFor(environment: SeedEnvironment): NodeBindingSeed[] {
  const env = envSuffix(environment.key)
  const appConfigs = appConfigGroups(environment)
  const appNetwork = `b2p-${env}-net`

  return [
    {
      nodeCode: 'b2p-app',
      hostName: environment.appHost.name,
      status: environment.statuses.app,
      tags: ['Laravel', 'Docker', 'Internal'],
      containerName: `b2p-${env}-web`,
      image: 'company/b2p:mock',
      ports: ['8080'],
      network: appNetwork,
      configs: appConfigs,
    },
    {
      nodeCode: 'b2p-web',
      hostName: environment.appHost.name,
      status: 'healthy',
      tags: ['Laravel', 'API'],
      containerName: `b2p-${env}-web`,
      image: 'company/b2p:mock',
      ports: ['8080'],
      network: appNetwork,
      configs: appConfigs,
    },
    {
      nodeCode: 'b2p-worker',
      hostName: environment.appHost.name,
      status: environment.key === 'local' ? 'warning' : 'healthy',
      tags: ['Queue', 'Worker'],
      containerName: `b2p-${env}-worker`,
      image: 'company/b2p-worker:mock',
      ports: ['9001'],
      network: appNetwork,
      configs: appConfigs,
    },
    {
      nodeCode: 'b2p-scheduler',
      hostName: environment.appHost.name,
      status: 'healthy',
      tags: ['Cron', 'Batch'],
      containerName: `b2p-${env}-scheduler`,
      image: 'company/b2p-scheduler:mock',
      ports: ['9002'],
      network: appNetwork,
      configs: appConfigs,
    },
    {
      nodeCode: 'b2p-consumer',
      hostName: environment.appHost.name,
      status: environment.statuses.consumer,
      tags: ['Kafka', 'Consumer'],
      containerName: `b2p-${env}-consumer`,
      image: 'company/b2p-consumer:mock',
      ports: ['9003'],
      network: appNetwork,
      configs: appConfigs,
    },
    {
      nodeCode: 'svc-mariadb',
      hostName: environment.serviceHost.name,
      status: 'healthy',
      tags: ['DB', 'Shared'],
      containerName: `mariadb-${env}`,
      image: 'mariadb:10.11',
      ports: ['3306'],
      network: appNetwork,
      configs: serviceConfigGroup('DB', [
        { key: 'DB_HOST', value: `mariadb-${env}.company.local` },
        { key: 'DB_PORT', value: '3306' },
        { key: 'DB_DATABASE', value: `b2p_${env}` },
      ]),
    },
    {
      nodeCode: 'svc-redis',
      hostName: environment.serviceHost.name,
      status: environment.statuses.redis,
      tags: ['Cache', 'Queue'],
      containerName: `redis-${env}`,
      image: 'redis:7-alpine',
      ports: ['6379'],
      network: appNetwork,
      configs: serviceConfigGroup('Redis', [
        { key: 'REDIS_HOST', value: `redis-${env}.company.local` },
        { key: 'REDIS_PORT', value: '6379' },
        { key: 'REDIS_PASSWORD', value: `${env}-redis-password`, secret: true },
      ]),
    },
    {
      nodeCode: 'svc-kafka',
      hostName: environment.serviceHost.name,
      status: environment.statuses.kafka,
      tags: ['Kafka', 'Broker'],
      containerName: `kafka-${env}`,
      image: 'bitnami/kafka:3.7',
      ports: ['9092'],
      network: appNetwork,
      configs: serviceConfigGroup('Kafka', [
        { key: 'KAFKA_BROKER', value: `kafka-${env}.company.local:9092` },
        { key: 'KAFKA_TOPIC_B2P', value: `b2p.events.${env}` },
      ]),
    },
    {
      nodeCode: 'svc-sap',
      hostName: environment.externalHost.name,
      status: 'healthy',
      tags: ['SAP', 'HTTP'],
      containerName: `sap-api-${env}`,
      image: 'external/sap-api',
      ports: ['443'],
      network: appNetwork,
      configs: serviceConfigGroup('External API', [
        { key: 'SAP_URL', value: `https://sap-${env}.company.local/api` },
        { key: 'SAP_TOKEN', value: `${env}-sap-token`, secret: true },
      ]),
    },
    {
      nodeCode: 'svc-mail',
      hostName: environment.serviceHost.name,
      status: 'healthy',
      tags: ['SMTP'],
      containerName: `mail-${env}`,
      image: 'mailhog/mailhog:mock',
      ports: ['587'],
      network: appNetwork,
      configs: serviceConfigGroup('Mail', [
        { key: 'MAIL_HOST', value: `mail-${env}.company.local` },
        { key: 'MAIL_PORT', value: '587' },
        { key: 'MAIL_PASSWORD', value: `${env}-mail-password`, secret: true },
      ]),
    },
    {
      nodeCode: 'svc-ocr',
      hostName: environment.serviceHost.name,
      status: environment.statuses.ocr,
      tags: ['OCR', 'HTTP'],
      containerName: `ocr-${env}`,
      image: 'company/ocr:mock',
      ports: ['8088'],
      network: appNetwork,
      configs: serviceConfigGroup('External API', [
        { key: 'OCR_URL', value: `https://ocr-${env}.company.local/api` },
        { key: 'OCR_TOKEN', value: `${env}-ocr-token`, secret: true },
      ]),
    },
  ]
}

function dependencyBindingsFor(environment: SeedEnvironment): DependencyBindingSeed[] {
  const env = envSuffix(environment.key)
  const redisItems = [
    { key: 'REDIS_HOST', value: `redis-${env}.company.local` },
    { key: 'REDIS_PORT', value: '6379' },
    { key: 'CACHE_DRIVER', value: 'redis' },
    { key: 'SESSION_DRIVER', value: 'redis' },
  ]

  return [
    {
      dependencyCode: 'web-db',
      configs: [{ key: 'DB_HOST', value: `mariadb-${env}.company.local` }],
    },
    {
      dependencyCode: 'web-redis',
      configs: redisItems,
    },
    {
      dependencyCode: 'web-sap',
      configs: [{ key: 'SAP_URL', value: `https://sap-${env}.company.local/api` }],
    },
    {
      dependencyCode: 'web-mail',
      configs: [{ key: 'MAIL_HOST', value: `mail-${env}.company.local` }],
    },
    {
      dependencyCode: 'worker-redis',
      configs: [{ key: 'REDIS_QUEUE', value: `redis-${env}.company.local:6379/b2p` }],
    },
    {
      dependencyCode: 'worker-kafka',
      configs: [
        { key: 'KAFKA_BROKER', value: `kafka-${env}.company.local:9092` },
        { key: 'KAFKA_TOPIC_B2P', value: `b2p.events.${env}` },
      ],
    },
    {
      dependencyCode: 'consumer-kafka',
      configs: [
        { key: 'KAFKA_BROKER', value: `kafka-${env}.company.local:9092` },
        { key: 'KAFKA_GROUP_ID', value: `b2p-consumer-${env}` },
      ],
    },
    {
      dependencyCode: 'consumer-sap',
      configs: [{ key: 'SAP_SYNC_URL', value: `https://sap-${env}.company.local/api/sync` }],
    },
    {
      dependencyCode: 'scheduler-db',
      configs: [{ key: 'DB_HOST', value: `mariadb-${env}.company.local` }],
    },
    {
      dependencyCode: 'scheduler-ocr',
      configs: [{ key: 'OCR_URL', value: `https://ocr-${env}.company.local/api` }],
    },
    {
      dependencyCode: 'scheduler-mail',
      configs: [{ key: 'MAIL_HOST', value: `mail-${env}.company.local` }],
    },
  ]
}

async function replaceNodeBindingConfigGroups(
  prisma: PrismaClient,
  bindingId: string,
  configGroups: ConfigGroupSeed[],
) {
  await prisma.systemNodeBindingConfigGroup.deleteMany({ where: { bindingId } })

  for (const [groupIndex, group] of configGroups.entries()) {
    await prisma.systemNodeBindingConfigGroup.create({
      data: {
        bindingId,
        name: group.name,
        sortOrder: groupIndex,
        items: {
          create: group.items.map((item, itemIndex) => ({
            key: item.key,
            value: item.value,
            secret: item.secret ?? false,
            sortOrder: itemIndex,
          })),
        },
      },
    })
  }
}

async function replaceDependencyBindingConfigItems(
  prisma: PrismaClient,
  bindingId: string,
  configItems: ConfigItemSeed[],
) {
  await prisma.systemDependencyBindingConfig.deleteMany({ where: { bindingId } })

  if (!configItems.length) {
    return
  }

  await prisma.systemDependencyBindingConfig.createMany({
    data: configItems.map((item, itemIndex) => ({
      bindingId,
      key: item.key,
      value: item.value,
      secret: item.secret ?? false,
      sortOrder: itemIndex,
    })),
  })
}

export async function ensureSystemManagerSeed(prisma: PrismaClient) {
  const nodeIdByCode = new Map<string, string>()

  for (const nodeSeed of blueprintNodes) {
    const node = await prisma.systemTopologyBlueprintNode.upsert({
      where: { code: nodeSeed.code },
      create: nodeSeed,
      update: {
        name: nodeSeed.name,
        kind: nodeSeed.kind,
        type: nodeSeed.type,
        description: nodeSeed.description,
        notes: nodeSeed.notes,
        positionX: nodeSeed.positionX,
        positionY: nodeSeed.positionY,
      },
    })

    nodeIdByCode.set(node.code, node.id)
  }

  const dependencyIdByCode = new Map<string, string>()

  for (const dependencySeed of blueprintDependencies) {
    const sourceNodeId = nodeIdByCode.get(dependencySeed.sourceCode)
    const targetNodeId = nodeIdByCode.get(dependencySeed.targetCode)

    if (!sourceNodeId || !targetNodeId) {
      continue
    }

    const dependency = await prisma.systemTopologyBlueprintDependency.upsert({
      where: { code: dependencySeed.code },
      create: {
        code: dependencySeed.code,
        sourceNodeId,
        targetNodeId,
        label: dependencySeed.label,
        connectionType: dependencySeed.connectionType,
        direction: dependencySeed.direction,
        port: dependencySeed.port,
        description: dependencySeed.description,
        sortOrder: dependencySeed.sortOrder,
      },
      update: {
        sourceNodeId,
        targetNodeId,
        label: dependencySeed.label,
        connectionType: dependencySeed.connectionType,
        direction: dependencySeed.direction,
        port: dependencySeed.port,
        description: dependencySeed.description,
        sortOrder: dependencySeed.sortOrder,
      },
    })

    dependencyIdByCode.set(dependency.code, dependency.id)
  }

  for (const [environmentIndex, environmentSeed] of environments.entries()) {
    const environment = await prisma.systemEnvironment.upsert({
      where: { key: environmentSeed.key },
      create: {
        key: environmentSeed.key,
        name: environmentSeed.name,
        color: environmentSeed.color,
        description: `System Manager ${environmentSeed.name} bindings`,
        sortOrder: environmentIndex,
      },
      update: {
        name: environmentSeed.name,
        color: environmentSeed.color,
        description: `System Manager ${environmentSeed.name} bindings`,
        sortOrder: environmentIndex,
      },
    })

    const hostSeeds = [environmentSeed.appHost, environmentSeed.serviceHost, environmentSeed.externalHost]
    const hostIdByName = new Map<string, string>()

    for (const [hostIndex, hostSeed] of hostSeeds.entries()) {
      const host = await prisma.systemHost.upsert({
        where: {
          environmentId_name: {
            environmentId: environment.id,
            name: hostSeed.name,
          },
        },
        create: {
          environmentId: environment.id,
          name: hostSeed.name,
          ip: hostSeed.ip,
          description: `${environmentSeed.name} host`,
          sortOrder: hostIndex,
        },
        update: {
          ip: hostSeed.ip,
          description: `${environmentSeed.name} host`,
          sortOrder: hostIndex,
        },
      })

      hostIdByName.set(host.name, host.id)
    }

    for (const bindingSeed of nodeBindingsFor(environmentSeed)) {
      const nodeId = nodeIdByCode.get(bindingSeed.nodeCode)
      const hostId = hostIdByName.get(bindingSeed.hostName)

      if (!nodeId) {
        continue
      }

      const binding = await prisma.systemNodeEnvironmentBinding.upsert({
        where: {
          environmentId_nodeId: {
            environmentId: environment.id,
            nodeId,
          },
        },
        create: {
          environmentId: environment.id,
          nodeId,
          hostId,
          displayName: null,
          status: bindingSeed.status,
          tagsJson: JSON.stringify(bindingSeed.tags),
          containerName: bindingSeed.containerName,
          image: bindingSeed.image,
          portsJson: JSON.stringify(bindingSeed.ports),
          network: bindingSeed.network,
        },
        update: {
          hostId,
          displayName: null,
          status: bindingSeed.status,
          tagsJson: JSON.stringify(bindingSeed.tags),
          containerName: bindingSeed.containerName,
          image: bindingSeed.image,
          portsJson: JSON.stringify(bindingSeed.ports),
          network: bindingSeed.network,
        },
      })

      await replaceNodeBindingConfigGroups(prisma, binding.id, bindingSeed.configs)
    }

    for (const bindingSeed of dependencyBindingsFor(environmentSeed)) {
      const dependencyId = dependencyIdByCode.get(bindingSeed.dependencyCode)

      if (!dependencyId) {
        continue
      }

      const binding = await prisma.systemDependencyEnvironmentBinding.upsert({
        where: {
          environmentId_dependencyId: {
            environmentId: environment.id,
            dependencyId,
          },
        },
        create: {
          environmentId: environment.id,
          dependencyId,
        },
        update: {},
      })

      await replaceDependencyBindingConfigItems(prisma, binding.id, bindingSeed.configs)
    }
  }
}
