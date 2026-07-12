export type SystemEnvironment = string

export type TopologyStatus = 'healthy' | 'warning' | 'down' | 'unknown' | 'maintenance' | 'disabled'

export type TopologyNodeKind = 'app' | 'component' | 'service'

export type TopologyNodeType =
  | 'Application'
  | 'Web/API'
  | 'Queue Worker'
  | 'Scheduler'
  | 'Consumer'
  | 'Database'
  | 'Cache'
  | 'Message Broker'
  | 'External API'
  | 'Mail'
  | 'OCR'
  | string

export type ConfigGroupName = 'App' | 'DB' | 'Redis' | 'Kafka' | 'External API' | 'Mail' | string

export type RuntimeInfo = {
  hostId?: string
  host: string
  ip: string
  ports: string[]
  containerName: string
  image: string
  network: string
}

export type ConfigItem = {
  key: string
  value: string
  secret?: boolean
}

export type ConfigGroup = {
  name: ConfigGroupName
  items: ConfigItem[]
}

export type TopologyNodeRecord = {
  id: string
  name: string
  kind: TopologyNodeKind
  type: TopologyNodeType
  status: TopologyStatus
  environment: SystemEnvironment
  description: string
  tags: string[]
  runtime: RuntimeInfo
  configs: ConfigGroup[]
  notes: string
  position: {
    x: number
    y: number
  }
}

export type DependencyDirection = 'request' | 'read' | 'write' | 'publish' | 'consume' | 'proxy'

export type TopologyEdgeRecord = {
  id: string
  source: string
  target: string
  label: string
  connectionType: string
  direction: DependencyDirection
  port: string
  description: string
  configItems: ConfigItem[]
}

export type TopologyEnvironmentData = {
  key: SystemEnvironment
  label: string
  collapsedNodes: TopologyNodeRecord[]
  collapsedEdges: TopologyEdgeRecord[]
  expandedNodes: TopologyNodeRecord[]
  expandedEdges: TopologyEdgeRecord[]
}

const environmentLabels: Record<string, string> = {
  local: 'Local',
  dev: 'Dev',
}

function suffix(environment: SystemEnvironment) {
  return environment === 'local' ? 'local' : 'dev'
}

function runtime(
  environment: SystemEnvironment,
  host: string,
  ip: string,
  containerName: string,
  image: string,
  ports: string[],
): RuntimeInfo {
  return {
    host,
    hostId: '',
    ip,
    containerName,
    image,
    ports,
    network: `b2p-${suffix(environment)}-net`,
  }
}

function appConfigs(environment: SystemEnvironment): ConfigGroup[] {
  const env = suffix(environment)
  const label = environmentLabels[environment] ?? environment

  return [
    {
      name: 'App',
      items: [
        { key: 'APP_NAME', value: `B2P ${label}` },
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

function serviceConfigs(group: ConfigGroupName, items: ConfigItem[]): ConfigGroup[] {
  return [{ name: group, items }]
}

function makeNode(
  environment: SystemEnvironment,
  node: Omit<TopologyNodeRecord, 'environment'>,
): TopologyNodeRecord {
  return {
    ...node,
    environment,
  }
}

function makeEnvironment(environment: SystemEnvironment): TopologyEnvironmentData {
  const env = suffix(environment)
  const appHost = environment === 'local' ? 'khanh-dev-laptop' : 'dev-app-01'
  const serviceHost = environment === 'local' ? 'khanh-dev-laptop' : 'dev-service-01'
  const appIp = environment === 'local' ? '127.0.0.1' : '10.20.1.21'
  const serviceIp = environment === 'local' ? '127.0.0.1' : '10.20.1.31'
  const appConfigGroups = appConfigs(environment)
  const appRuntime = runtime(environment, appHost, appIp, `b2p-${env}-web`, 'company/b2p:mock', ['8080'])

  const appNode = makeNode(environment, {
    id: 'b2p-app',
    name: 'B2P',
    kind: 'app',
    type: 'Application',
    status: environment === 'local' ? 'unknown' : 'healthy',
    description: 'Ứng dụng B2P mẫu để kiểm chứng topology và flow dependency.',
    tags: ['Laravel', 'Docker', 'Internal'],
    runtime: appRuntime,
    configs: appConfigGroups,
    notes: 'Collapsed view gom dependency của các component để nhìn tổng quan nhanh.',
    position: { x: 64, y: 250 },
  })

  const componentNodes = [
    makeNode(environment, {
      id: 'b2p-web',
      name: 'B2P Web/API',
      kind: 'component',
      type: 'Web/API',
      status: 'healthy',
      description: 'HTTP API chính của B2P.',
      tags: ['Laravel', 'API'],
      runtime: appRuntime,
      configs: appConfigGroups,
      notes: 'Nhận request từ frontend/internal services và gọi DB, Redis, SAP, Mail.',
      position: { x: 250, y: 70 },
    }),
    makeNode(environment, {
      id: 'b2p-worker',
      name: 'B2P Queue Worker',
      kind: 'component',
      type: 'Queue Worker',
      status: environment === 'local' ? 'warning' : 'healthy',
      description: 'Worker xử lý job nền và publish event sang Kafka.',
      tags: ['Queue', 'Worker'],
      runtime: runtime(environment, appHost, appIp, `b2p-${env}-worker`, 'company/b2p-worker:mock', ['9001']),
      configs: appConfigGroups,
      notes: 'Cần Redis queue và Kafka broker để xử lý đồng bộ nền.',
      position: { x: 250, y: 230 },
    }),
    makeNode(environment, {
      id: 'b2p-scheduler',
      name: 'B2P Scheduler',
      kind: 'component',
      type: 'Scheduler',
      status: 'healthy',
      description: 'Cron/scheduler chạy các tác vụ định kỳ.',
      tags: ['Cron', 'Batch'],
      runtime: runtime(environment, appHost, appIp, `b2p-${env}-scheduler`, 'company/b2p-scheduler:mock', ['9002']),
      configs: appConfigGroups,
      notes: 'Đọc DB, gọi OCR và gửi mail nhắc việc trong flow mẫu.',
      position: { x: 250, y: 390 },
    }),
    makeNode(environment, {
      id: 'b2p-consumer',
      name: 'B2P Consumer',
      kind: 'component',
      type: 'Consumer',
      status: environment === 'dev' ? 'warning' : 'unknown',
      description: 'Consumer đọc event Kafka và đồng bộ sang SAP.',
      tags: ['Kafka', 'Consumer'],
      runtime: runtime(environment, appHost, appIp, `b2p-${env}-consumer`, 'company/b2p-consumer:mock', ['9003']),
      configs: appConfigGroups,
      notes: 'Consumer thể hiện hướng consume riêng với edge Kafka.',
      position: { x: 520, y: 300 },
    }),
  ]

  const serviceNodes = [
    makeNode(environment, {
      id: 'svc-mariadb',
      name: `MariaDB ${environmentLabels[environment]}`,
      kind: 'service',
      type: 'Database',
      status: 'healthy',
      description: 'Database chính của B2P.',
      tags: ['DB', 'Shared'],
      runtime: runtime(environment, serviceHost, serviceIp, `mariadb-${env}`, 'mariadb:10.11', ['3306']),
      configs: serviceConfigs('DB', [
        { key: 'DB_HOST', value: `mariadb-${env}.company.local` },
        { key: 'DB_PORT', value: '3306' },
        { key: 'DB_DATABASE', value: `b2p_${env}` },
      ]),
      notes: 'Một service instance dùng chung trong môi trường đang chọn.',
      position: { x: 780, y: 20 },
    }),
    makeNode(environment, {
      id: 'svc-redis',
      name: `Redis ${environmentLabels[environment]}`,
      kind: 'service',
      type: 'Cache',
      status: environment === 'local' ? 'unknown' : 'healthy',
      description: 'Cache, session và queue backend.',
      tags: ['Cache', 'Queue'],
      runtime: runtime(environment, serviceHost, serviceIp, `redis-${env}`, 'redis:7-alpine', ['6379']),
      configs: serviceConfigs('Redis', [
        { key: 'REDIS_HOST', value: `redis-${env}.company.local` },
        { key: 'REDIS_PORT', value: '6379' },
        { key: 'REDIS_PASSWORD', value: `${env}-redis-password`, secret: true },
      ]),
      notes: 'Node chung để thấy các component nào đang phụ thuộc Redis.',
      position: { x: 780, y: 150 },
    }),
    makeNode(environment, {
      id: 'svc-kafka',
      name: `Kafka ${environmentLabels[environment]}`,
      kind: 'service',
      type: 'Message Broker',
      status: environment === 'dev' ? 'warning' : 'unknown',
      description: 'Message broker cho publish/consume event.',
      tags: ['Kafka', 'Broker'],
      runtime: runtime(environment, serviceHost, serviceIp, `kafka-${env}`, 'bitnami/kafka:3.7', ['9092']),
      configs: serviceConfigs('Kafka', [
        { key: 'KAFKA_BROKER', value: `kafka-${env}.company.local:9092` },
        { key: 'KAFKA_TOPIC_B2P', value: `b2p.events.${env}` },
      ]),
      notes: 'Có cả hướng publish từ Worker và consume từ Consumer.',
      position: { x: 780, y: 280 },
    }),
    makeNode(environment, {
      id: 'svc-sap',
      name: `SAP API ${environmentLabels[environment]}`,
      kind: 'service',
      type: 'External API',
      status: 'healthy',
      description: 'Dịch vụ SAP nội bộ được B2P gọi để đồng bộ dữ liệu.',
      tags: ['SAP', 'HTTP'],
      runtime: runtime(environment, 'sap-gateway', environment === 'local' ? '127.0.0.1' : '10.20.5.10', `sap-api-${env}`, 'external/sap-api', ['443']),
      configs: serviceConfigs('External API', [
        { key: 'SAP_URL', value: `https://sap-${env}.company.local/api` },
        { key: 'SAP_TOKEN', value: `${env}-sap-token`, secret: true },
      ]),
      notes: 'Production sau này chỉ cần theo dõi, phase này dùng mock.',
      position: { x: 1080, y: 300 },
    }),
    makeNode(environment, {
      id: 'svc-mail',
      name: `Mail ${environmentLabels[environment]}`,
      kind: 'service',
      type: 'Mail',
      status: 'healthy',
      description: 'SMTP relay cho thông báo nội bộ.',
      tags: ['SMTP'],
      runtime: runtime(environment, serviceHost, serviceIp, `mail-${env}`, 'mailhog/mailhog:mock', ['587']),
      configs: serviceConfigs('Mail', [
        { key: 'MAIL_HOST', value: `mail-${env}.company.local` },
        { key: 'MAIL_PORT', value: '587' },
        { key: 'MAIL_PASSWORD', value: `${env}-mail-password`, secret: true },
      ]),
      notes: 'Mock mail service để kiểm tra config grouping và copy env line.',
      position: { x: 780, y: 540 },
    }),
    makeNode(environment, {
      id: 'svc-ocr',
      name: `OCR ${environmentLabels[environment]}`,
      kind: 'service',
      type: 'OCR',
      status: environment === 'dev' ? 'down' : 'unknown',
      description: 'OCR API dùng trong tác vụ định kỳ.',
      tags: ['OCR', 'HTTP'],
      runtime: runtime(environment, serviceHost, serviceIp, `ocr-${env}`, 'company/ocr:mock', ['8088']),
      configs: serviceConfigs('External API', [
        { key: 'OCR_URL', value: `https://ocr-${env}.company.local/api` },
        { key: 'OCR_TOKEN', value: `${env}-ocr-token`, secret: true },
      ]),
      notes: 'Dev đang đặt trạng thái down để test màu status và impact flow.',
      position: { x: 1080, y: 430 },
    }),
  ]

  const edge = (
    id: string,
    source: string,
    target: string,
    label: string,
    connectionType: string,
    direction: DependencyDirection,
    port: string,
    configItems: ConfigItem[],
    description: string,
  ): TopologyEdgeRecord => ({
    id,
    source,
    target,
    label,
    connectionType,
    direction,
    port,
    configItems,
    description,
  })

  const redisItems = [
    { key: 'REDIS_HOST', value: `redis-${env}.company.local` },
    { key: 'REDIS_PORT', value: '6379' },
    { key: 'CACHE_DRIVER', value: 'redis' },
    { key: 'SESSION_DRIVER', value: 'redis' },
  ]

  return {
    key: environment,
    label: environmentLabels[environment],
    collapsedNodes: [
      {
        ...appNode,
        position: { x: 80, y: 260 },
      },
      ...serviceNodes.map((node, index) => ({
        ...node,
        position: { x: index < 3 ? 620 : 920, y: 60 + (index % 3) * 170 },
      })),
    ],
    collapsedEdges: [
      edge('b2p-db', 'b2p-app', 'svc-mariadb', 'DB_HOST', 'database', 'read', '3306', [
        { key: 'DB_HOST', value: `mariadb-${env}.company.local` },
      ], 'B2P đọc/ghi dữ liệu chính qua DB_HOST.'),
      edge('b2p-redis', 'b2p-app', 'svc-redis', 'REDIS_HOST +3', 'cache/session/queue', 'read', '6379', redisItems, 'B2P dùng Redis cho cache, session và queue.'),
      edge('b2p-kafka', 'b2p-app', 'svc-kafka', 'KAFKA_BROKER +1', 'message broker', 'publish', '9092', [
        { key: 'KAFKA_BROKER', value: `kafka-${env}.company.local:9092` },
        { key: 'KAFKA_TOPIC_B2P', value: `b2p.events.${env}` },
      ], 'B2P publish và consume event qua Kafka.'),
      edge('b2p-sap', 'b2p-app', 'svc-sap', 'SAP_URL', 'http api', 'request', '443', [
        { key: 'SAP_URL', value: `https://sap-${env}.company.local/api` },
      ], 'B2P gọi SAP API để đồng bộ dữ liệu.'),
      edge('b2p-mail', 'b2p-app', 'svc-mail', 'MAIL_HOST', 'smtp', 'request', '587', [
        { key: 'MAIL_HOST', value: `mail-${env}.company.local` },
      ], 'B2P gửi thông báo qua mail relay.'),
      edge('b2p-ocr', 'b2p-app', 'svc-ocr', 'OCR_URL', 'http api', 'request', '8088', [
        { key: 'OCR_URL', value: `https://ocr-${env}.company.local/api` },
      ], 'B2P Scheduler gọi OCR API cho batch định kỳ.'),
    ],
    expandedNodes: [
      {
        ...appNode,
        position: { x: 34, y: 250 },
      },
      ...componentNodes,
      ...serviceNodes,
    ],
    expandedEdges: [
      edge('web-db', 'b2p-web', 'svc-mariadb', 'DB_HOST', 'database', 'read', '3306', [
        { key: 'DB_HOST', value: `mariadb-${env}.company.local` },
      ], 'Web/API đọc ghi dữ liệu chính.'),
      edge('web-redis', 'b2p-web', 'svc-redis', 'REDIS_HOST +3', 'cache/session', 'read', '6379', redisItems, 'Web/API dùng Redis cho cache và session.'),
      edge('web-sap', 'b2p-web', 'svc-sap', 'SAP_URL', 'http api', 'request', '443', [
        { key: 'SAP_URL', value: `https://sap-${env}.company.local/api` },
      ], 'Web/API gọi SAP trong một số thao tác đồng bộ.'),
      edge('web-mail', 'b2p-web', 'svc-mail', 'MAIL_HOST', 'smtp', 'request', '587', [
        { key: 'MAIL_HOST', value: `mail-${env}.company.local` },
      ], 'Web/API gửi email xác nhận/thông báo.'),
      edge('worker-redis', 'b2p-worker', 'svc-redis', 'REDIS_QUEUE', 'queue backend', 'read', '6379', [
        { key: 'REDIS_QUEUE', value: `redis-${env}.company.local:6379/b2p` },
      ], 'Worker lấy job từ Redis queue.'),
      edge('worker-kafka', 'b2p-worker', 'svc-kafka', 'KAFKA_BROKER / publish', 'message broker', 'publish', '9092', [
        { key: 'KAFKA_BROKER', value: `kafka-${env}.company.local:9092` },
        { key: 'KAFKA_TOPIC_B2P', value: `b2p.events.${env}` },
      ], 'Worker publish event sang Kafka.'),
      edge('consumer-kafka', 'b2p-consumer', 'svc-kafka', 'KAFKA_BROKER / consume', 'message broker', 'consume', '9092', [
        { key: 'KAFKA_BROKER', value: `kafka-${env}.company.local:9092` },
        { key: 'KAFKA_GROUP_ID', value: `b2p-consumer-${env}` },
      ], 'Consumer đọc event từ Kafka.'),
      edge('consumer-sap', 'b2p-consumer', 'svc-sap', 'SAP_SYNC_URL', 'http api', 'request', '443', [
        { key: 'SAP_SYNC_URL', value: `https://sap-${env}.company.local/api/sync` },
      ], 'Consumer đồng bộ event sang SAP.'),
      edge('scheduler-db', 'b2p-scheduler', 'svc-mariadb', 'DB_HOST', 'database', 'read', '3306', [
        { key: 'DB_HOST', value: `mariadb-${env}.company.local` },
      ], 'Scheduler đọc dữ liệu để chạy batch.'),
      edge('scheduler-ocr', 'b2p-scheduler', 'svc-ocr', 'OCR_URL', 'http api', 'request', '8088', [
        { key: 'OCR_URL', value: `https://ocr-${env}.company.local/api` },
      ], 'Scheduler gọi OCR API.'),
      edge('scheduler-mail', 'b2p-scheduler', 'svc-mail', 'MAIL_HOST', 'smtp', 'request', '587', [
        { key: 'MAIL_HOST', value: `mail-${env}.company.local` },
      ], 'Scheduler gửi email nhắc việc.'),
    ],
  }
}

export const systemManagerTopology: Record<SystemEnvironment, TopologyEnvironmentData> = {
  local: makeEnvironment('local'),
  dev: makeEnvironment('dev'),
}

export const systemEnvironmentOptions = Object.values(systemManagerTopology).map((topology) => ({
  label: topology.label,
  value: topology.key,
}))
