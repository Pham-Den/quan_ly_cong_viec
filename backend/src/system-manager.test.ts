import { PrismaClient } from '@prisma/client'
import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, test } from 'node:test'

import { ensureSystemManagerSeed } from './system-manager/seed.js'
import type { AppEnv } from './env.js'
import { buildServer } from './server.js'

const databaseUrl = process.env.DATABASE_URL ?? 'file:./test.db'
const env: AppEnv = {
  host: '127.0.0.1',
  port: 0,
  frontendOrigin: 'http://localhost:5173',
  databaseUrl,
  jwtAccessSecret: 'test-access-secret-at-least-long-enough',
  jwtRefreshSecret: 'test-refresh-secret-at-least-long-enough',
  accessTokenMinutes: 60,
  refreshTokenDays: 7,
}
const app = buildServer(env)
const prisma = new PrismaClient()

type Session = {
  accessToken: string
}

type EnvironmentDto = {
  id: string
  key: string
  label: string
}

type HostDto = {
  id: string
  name: string
  ip: string
}

type TopologyDto = {
  environment: {
    key: string
    label: string
  }
  nodes: Array<{
    id: string
    name: string
    kind: string
    runtime: {
      host: string
      ip: string
    }
    configs: Array<{
      name: string
      items: Array<{
        key: string
        value: string
        secret?: boolean
      }>
    }>
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    label: string
    configItems: Array<{
      key: string
      value: string
    }>
  }>
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  token?: string,
  payload?: Record<string, unknown>,
) {
  const response = await app.inject({
    method,
    url,
    payload,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  })

  return {
    response,
    body: response.json() as T,
  }
}

async function resetDatabase() {
  await prisma.systemDependencyBindingConfig.deleteMany()
  await prisma.systemDependencyEnvironmentBinding.deleteMany()
  await prisma.systemTopologyBlueprintDependency.deleteMany()
  await prisma.systemNodeBindingConfigItem.deleteMany()
  await prisma.systemNodeBindingConfigGroup.deleteMany()
  await prisma.systemNodeEnvironmentBinding.deleteMany()
  await prisma.systemTopologyBlueprintNode.deleteMany()
  await prisma.systemDependencyConfig.deleteMany()
  await prisma.systemDependency.deleteMany()
  await prisma.systemNodeConfigItem.deleteMany()
  await prisma.systemNodeConfigGroup.deleteMany()
  await prisma.systemTopologyNode.deleteMany()
  await prisma.systemHost.deleteMany()
  await prisma.systemEnvironment.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
}

async function setupSession() {
  const setup = await request<Session>('POST', '/api/auth/setup', undefined, {
    name: 'System Manager Test',
    email: 'system.manager.api@example.com',
    password: 'password123',
  })
  assert.equal(setup.response.statusCode, 200)

  return setup.body.accessToken
}

before(async () => {
  await app.ready()
})

beforeEach(async () => {
  await resetDatabase()
})

after(async () => {
  await prisma.$disconnect()
  await app.close()
})

describe('system manager topology API', () => {
  test('requires authentication', async () => {
    const response = await request('GET', '/api/system-manager/environments')

    assert.equal(response.response.statusCode, 401)
  })

  test('lists seeded environments and loads dev topology', async () => {
    const token = await setupSession()

    await ensureSystemManagerSeed(prisma)

    const environments = await request<EnvironmentDto[]>('GET', '/api/system-manager/environments', token)
    assert.equal(environments.response.statusCode, 200)
    assert.deepEqual(environments.body.map((environment) => environment.key), ['local', 'dev'])

    const topology = await request<TopologyDto>('GET', '/api/system-manager/topology?environment=dev', token)
    assert.equal(topology.response.statusCode, 200)
    assert.equal(topology.body.environment.key, 'dev')
    assert.ok(topology.body.nodes.find((node) => node.id === 'b2p-web'))
    assert.ok(topology.body.nodes.find((node) => node.id === 'svc-redis'))

    const redisNodes = topology.body.nodes.filter((node) => node.id === 'svc-redis')
    assert.equal(redisNodes.length, 1)
    assert.equal(redisNodes[0]?.name, 'Redis')

    const dbEdge = topology.body.edges.find((edge) => edge.id === 'web-db')
    assert.equal(dbEdge?.source, 'b2p-web')
    assert.equal(dbEdge?.target, 'svc-mariadb')
    assert.equal(dbEdge?.label, 'DB_HOST')
    assert.equal(dbEdge?.configItems[0]?.value, 'mariadb-dev.company.local')
  })

  test('returns readable error for missing environment', async () => {
    const token = await setupSession()
    const topology = await request('GET', '/api/system-manager/topology?environment=missing', token)

    assert.equal(topology.response.statusCode, 404)
  })

  test('manages global nodes and dependency with per-environment bindings', async () => {
    const token = await setupSession()

    const qaEnvironment = await request<EnvironmentDto>('POST', '/api/system-manager/environments', token, {
      key: 'qa',
      name: 'QA',
      description: 'Manual QA topology',
      sortOrder: 20,
    })
    assert.equal(qaEnvironment.response.statusCode, 200)
    assert.equal(qaEnvironment.body.key, 'qa')

    const uatEnvironment = await request<EnvironmentDto>('POST', '/api/system-manager/environments', token, {
      key: 'uat',
      name: 'UAT',
      description: 'Manual UAT bindings',
      sortOrder: 30,
    })
    assert.equal(uatEnvironment.response.statusCode, 200)

    const qaHost = await request<HostDto>('POST', '/api/system-manager/hosts', token, {
      environmentKey: 'qa',
      name: 'qa-app-01',
      ip: '10.30.0.11',
      description: 'QA host',
    })
    assert.equal(qaHost.response.statusCode, 200)

    const uatHost = await request<HostDto>('POST', '/api/system-manager/hosts', token, {
      environmentKey: 'uat',
      name: 'uat-app-01',
      ip: '10.40.0.11',
      description: 'UAT host',
    })
    assert.equal(uatHost.response.statusCode, 200)

    const appNode = await request('POST', '/api/system-manager/nodes', token, {
      environmentKey: 'qa',
      hostId: qaHost.body.id,
      code: 'manual-web',
      name: 'Manual Web/API',
      kind: 'app',
      type: 'Web/API',
      status: 'healthy',
      tags: ['Laravel', 'QA'],
      ports: ['8080'],
      configs: [
        {
          name: 'App',
          items: [{ key: 'APP_ENV', value: 'qa' }],
        },
      ],
      positionX: 80,
      positionY: 120,
    })
    assert.equal(appNode.response.statusCode, 200)

    const serviceNode = await request('POST', '/api/system-manager/nodes', token, {
      environmentKey: 'qa',
      hostId: qaHost.body.id,
      code: 'manual-redis',
      name: 'Manual Redis',
      kind: 'service',
      type: 'Cache',
      status: 'healthy',
      ports: ['6379'],
      configs: [
        {
          name: 'Redis',
          items: [{ key: 'REDIS_HOST', value: 'redis-qa.company.local' }],
        },
      ],
      positionX: 420,
      positionY: 120,
    })
    assert.equal(serviceNode.response.statusCode, 200)

    const dependency = await request('POST', '/api/system-manager/dependencies', token, {
      environmentKey: 'qa',
      code: 'manual-web-redis',
      sourceCode: 'manual-web',
      targetCode: 'manual-redis',
      label: 'REDIS_HOST',
      connectionType: 'redis',
      direction: 'read',
      port: '6379',
      configItems: [{ key: 'REDIS_HOST', value: 'redis-qa.company.local' }],
    })
    assert.equal(dependency.response.statusCode, 200)

    const uatAppBinding = await request('PATCH', '/api/system-manager/nodes/manual-web', token, {
      environmentKey: 'uat',
      hostId: uatHost.body.id,
      code: 'manual-web',
      name: 'Manual Web/API',
      kind: 'app',
      type: 'Web/API',
      status: 'warning',
      tags: ['Laravel', 'UAT'],
      ports: ['8080'],
      configs: [
        {
          name: 'App',
          items: [{ key: 'APP_ENV', value: 'uat' }],
        },
      ],
      positionX: 80,
      positionY: 120,
    })
    assert.equal(uatAppBinding.response.statusCode, 200)

    const uatRedisBinding = await request('PATCH', '/api/system-manager/nodes/manual-redis', token, {
      environmentKey: 'uat',
      hostId: uatHost.body.id,
      code: 'manual-redis',
      name: 'Manual Redis',
      kind: 'service',
      type: 'Cache',
      status: 'healthy',
      ports: ['6379'],
      configs: [
        {
          name: 'Redis',
          items: [{ key: 'REDIS_HOST', value: 'redis-uat.company.local' }],
        },
      ],
      positionX: 420,
      positionY: 120,
    })
    assert.equal(uatRedisBinding.response.statusCode, 200)

    const uatDependencyBinding = await request('POST', '/api/system-manager/dependencies', token, {
      environmentKey: 'uat',
      code: 'manual-web-redis',
      configItems: [{ key: 'REDIS_HOST', value: 'redis-uat.company.local' }],
    })
    assert.equal(uatDependencyBinding.response.statusCode, 200)

    const qaDependencyConfigOnlyUpdate = await request(
      'PATCH',
      '/api/system-manager/dependencies/manual-web-redis?environment=qa',
      token,
      {
        environmentKey: 'qa',
        configItems: [{ key: 'REDIS_HOST', value: 'redis-qa-updated.company.local' }],
      },
    )
    assert.equal(qaDependencyConfigOnlyUpdate.response.statusCode, 200)

    const qaTopology = await request<TopologyDto>('GET', '/api/system-manager/topology?environment=qa', token)
    assert.equal(qaTopology.response.statusCode, 200)
    assert.equal(qaTopology.body.environment.key, 'qa')
    assert.ok(qaTopology.body.nodes.find((node) => node.id === 'manual-web'))
    assert.ok(qaTopology.body.nodes.find((node) => node.id === 'manual-redis'))

    const qaRedisEdge = qaTopology.body.edges.find((edge) => edge.id === 'manual-web-redis')
    assert.equal(qaRedisEdge?.source, 'manual-web')
    assert.equal(qaRedisEdge?.target, 'manual-redis')
    assert.equal(qaRedisEdge?.configItems[0]?.value, 'redis-qa-updated.company.local')

    const uatTopology = await request<TopologyDto>('GET', '/api/system-manager/topology?environment=uat', token)
    assert.equal(uatTopology.response.statusCode, 200)
    assert.equal(uatTopology.body.nodes.find((node) => node.id === 'manual-web')?.runtime.ip, '10.40.0.11')

    const uatRedisEdge = uatTopology.body.edges.find((edge) => edge.id === 'manual-web-redis')
    assert.equal(uatRedisEdge?.source, 'manual-web')
    assert.equal(uatRedisEdge?.target, 'manual-redis')
    assert.equal(uatRedisEdge?.configItems[0]?.value, 'redis-uat.company.local')
  })
})
