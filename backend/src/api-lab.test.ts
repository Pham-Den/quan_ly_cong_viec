import { PrismaClient } from '@prisma/client'
import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, test } from 'node:test'

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

type Project = {
  id: string
  code: string
}

type Task = {
  id: string
  code: string
}

type ApiEnvironment = {
  id: string
  name: string
  variables: Array<{
    key: string
    secret: boolean
    variants: Array<{
      name: string
      value: string
      hasValue: boolean
    }>
  }>
}

type ApiRequest = {
  id: string
  name: string
  taskId: string | null
}

type ApiFlow = {
  id: string
  name: string
}

type ApiFlowStep = {
  id: string
  name: string
  requestId: string | null
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

async function request<T>(method: HttpMethod, url: string, token?: string, payload?: Record<string, unknown>) {
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
  await prisma.apiSavedResponse.deleteMany()
  await prisma.apiRequestRun.deleteMany()
  await prisma.apiFlowRun.deleteMany()
  await prisma.apiFlowStep.deleteMany()
  await prisma.apiFlow.deleteMany()
  await prisma.apiRequest.deleteMany()
  await prisma.apiEnvironmentVariableVariant.deleteMany()
  await prisma.apiEnvironmentVariable.deleteMany()
  await prisma.apiEnvironment.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.timelineEvent.deleteMany()
  await prisma.taskBranch.deleteMany()
  await prisma.branchAlias.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.releaseCycle.deleteMany()
  await prisma.task.deleteMany()
  await prisma.note.deleteMany()
  await prisma.project.updateMany({ data: { defaultRepoId: null } })
  await prisma.repository.deleteMany()
  await prisma.workflowStatus.deleteMany()
  await prisma.taskGroup.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
}

async function setupProject(code: string, token: string) {
  const project = await request<Project>('POST', '/api/projects', token, {
    code,
    name: `Du an ${code}`,
  })
  assert.equal(project.response.statusCode, 200)

  return project.body
}

async function setupSession() {
  const setup = await request<Session>('POST', '/api/auth/setup', undefined, {
    name: 'Khanh Test',
    email: 'khanh.api.lab@example.com',
    password: 'password123',
  })
  assert.equal(setup.response.statusCode, 200)

  return setup.body.accessToken
}

async function createTask(token: string, projectId: string, title: string) {
  const task = await request<Task>('POST', '/api/tasks', token, {
    projectId,
    title,
    priority: 'MEDIUM',
    type: 'FEATURE',
  })
  assert.equal(task.response.statusCode, 200)

  return task.body
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

describe('api lab foundation', () => {
  test('creates API environment with masked secret variants', async () => {
    const token = await setupSession()
    const project = await setupProject('LAB', token)
    const environment = await request<ApiEnvironment>('POST', '/api/api-lab/environments', token, {
      projectId: project.id,
      name: 'local',
      environmentType: 'LOCAL',
      baseUrl: 'http://localhost:4000',
      variables: [
        {
          key: 'token',
          secret: true,
          variants: [{ name: 'admin', value: 'secret-token' }],
        },
      ],
    })
    assert.equal(environment.response.statusCode, 200)
    assert.equal(environment.body.variables[0]?.variants[0]?.value, '********')
    assert.equal(environment.body.variables[0]?.variants[0]?.hasValue, true)

    const storedVariant = await prisma.apiEnvironmentVariableVariant.findFirstOrThrow()
    assert.equal(storedVariant.value, 'secret-token')

    const list = await request<ApiEnvironment[]>(
      'GET',
      `/api/api-lab/environments?projectId=${project.id}`,
      token,
    )
    assert.equal(list.response.statusCode, 200)
    assert.equal(list.body[0]?.variables[0]?.variants[0]?.value, '********')
  })

  test('creates saved request, flow, and flow step inside one project', async () => {
    const token = await setupSession()
    const project = await setupProject('FLOW', token)
    const task = await createTask(token, project.id, 'Kiem tra API noi bo')
    const apiRequest = await request<ApiRequest>('POST', '/api/api-lab/requests', token, {
      projectId: project.id,
      taskId: task.id,
      collectionName: 'Auth',
      name: 'Login',
      method: 'POST',
      url: '{{baseUrl}}/api/auth/login',
      headers: [{ key: 'content-type', value: 'application/json' }],
      bodyType: 'JSON',
      bodyText: '{"email":"demo@example.com"}',
    })
    assert.equal(apiRequest.response.statusCode, 200)
    assert.equal(apiRequest.body.taskId, task.id)

    const flow = await request<ApiFlow>('POST', '/api/api-lab/flows', token, {
      projectId: project.id,
      taskId: task.id,
      collectionName: 'Auth',
      name: 'Login flow',
    })
    assert.equal(flow.response.statusCode, 200)

    const step = await request<ApiFlowStep>('POST', `/api/api-lab/flows/${flow.body.id}/steps`, token, {
      requestId: apiRequest.body.id,
      name: 'Login',
      captureRules: [{ source: 'json', path: '$.accessToken', as: 'token' }],
    })
    assert.equal(step.response.statusCode, 200)
    assert.equal(step.body.requestId, apiRequest.body.id)

    const steps = await request<ApiFlowStep[]>('GET', `/api/api-lab/flows/${flow.body.id}/steps`, token)
    assert.equal(steps.response.statusCode, 200)
    assert.equal(steps.body.length, 1)
  })

  test('rejects linking API request to a task from another project', async () => {
    const token = await setupSession()
    const firstProject = await setupProject('ONE', token)
    const secondProject = await setupProject('TWO', token)
    const otherTask = await createTask(token, secondProject.id, 'Task khac du an')
    const apiRequest = await request<{ message: string }>('POST', '/api/api-lab/requests', token, {
      projectId: firstProject.id,
      taskId: otherTask.id,
      name: 'Cross project',
      method: 'GET',
      url: '{{baseUrl}}/health',
    })

    assert.equal(apiRequest.response.statusCode, 400)
    assert.match(apiRequest.body.message, /Task khong thuoc du an/)
  })
})
