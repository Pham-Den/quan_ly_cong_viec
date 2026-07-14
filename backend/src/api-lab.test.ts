import { PrismaClient } from '@prisma/client'
import assert from 'node:assert/strict'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { after, before, beforeEach, describe, test } from 'node:test'

import type { AppEnv } from './env.js'
import { buildServer } from './server.js'
import { resolveTestDatabaseUrl } from './db/test-url.js'

const databaseUrl = resolveTestDatabaseUrl()
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

type ApiRequestRunResult = {
  run: {
    id: string
    status: string
    httpStatus: number | null
    assertionSummaryJson: string
    responseBodySaved: boolean
    errorMessage: string | null
  }
  response: {
    httpStatus: number | null
    durationMs: number
    headers: Record<string, string>
    bodyPreview: string
    originalSize: number
    truncated: boolean
    savedResponseId: string | null
  } | null
}

type ApiFlowRunResult = {
  flowRun: {
    id: string
    status: string
    capturedVariablesJson: string
    errorMessage: string | null
  }
  steps: Array<{
    step: {
      id: string
      name: string
      sortOrder: number
    }
    run: {
      id: string
      status: string
      httpStatus: number | null
      capturedVariablesJson: string
      errorMessage: string | null
    }
    response: {
      bodyPreview: string
      headers: Record<string, string>
    } | null
    capturedVariables: Record<string, string>
  }>
  capturedVariables: Record<string, string>
}

type CurlImportDraft = {
  method: string
  url: string
  query: Array<{ key: string; value: string }>
  headers: Array<{ key: string; value: string }>
  bodyType: string
  bodyText: string | null
}

type ApiHistoryItem = {
  kind: 'REQUEST' | 'FLOW'
  id: string
  status: string
  assertionSummaryJson: string
  request: { id: string; name: string } | null
  flow: { id: string; name: string } | null
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

async function startInternalApi(
  handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>,
) {
  const server = createServer((request, response) => {
    void handler(request, response)
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

  const address = server.address()

  assert.ok(address && typeof address === 'object')

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
        server.closeAllConnections()
      }),
  }
}

async function createEnvironment(token: string, projectId: string, baseUrl: string) {
  const environment = await request<ApiEnvironment>('POST', '/api/api-lab/environments', token, {
    projectId,
    name: 'local',
    environmentType: 'LOCAL',
    baseUrl,
    variables: [
      {
        key: 'token',
        secret: true,
        variants: [{ name: 'admin', value: 'secret-token' }],
      },
    ],
  })
  assert.equal(environment.response.statusCode, 200)

  return environment.body
}

async function createApiRequest(token: string, payload: Record<string, unknown>) {
  const apiRequest = await request<ApiRequest>('POST', '/api/api-lab/requests', token, payload)
  assert.equal(apiRequest.response.statusCode, 200)

  return apiRequest.body
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

  test('imports a cURL command into a request draft', async () => {
    const token = await setupSession()
    const draft = await request<CurlImportDraft>('POST', '/api/api-lab/import-curl', token, {
      curl:
        "curl -X POST 'https://api.internal.test/users?active=1' -H 'Content-Type: application/json' -H 'X-Team: core' --data-raw '{\"name\":\"Khanh\"}'",
    })

    assert.equal(draft.response.statusCode, 200)
    assert.equal(draft.body.method, 'POST')
    assert.equal(draft.body.url, 'https://api.internal.test/users')
    assert.deepEqual(draft.body.query, [{ key: 'active', value: '1' }])
    assert.deepEqual(draft.body.headers, [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'X-Team', value: 'core' },
    ])
    assert.equal(draft.body.bodyType, 'JSON')
    assert.equal(draft.body.bodyText, '{"name":"Khanh"}')
  })

  test('runs a saved request with environment, task, and runtime variables without saving response body', async () => {
    const internalApi = await startInternalApi((incomingRequest, response) => {
      response.setHeader('content-type', 'application/json')
      response.end(
        JSON.stringify({
          url: incomingRequest.url,
          authorization: incomingRequest.headers.authorization,
        }),
      )
    })

    try {
      const token = await setupSession()
      const project = await setupProject('RUN', token)
      const task = await createTask(token, project.id, 'Chay request noi bo')
      const environment = await createEnvironment(token, project.id, internalApi.baseUrl)
      const apiRequest = await createApiRequest(token, {
        projectId: project.id,
        taskId: task.id,
        name: 'Echo task',
        method: 'GET',
        url: '{{baseUrl}}/echo/{{task.code}}',
        query: [{ key: 'runtime', value: '{{requestId}}' }],
        headers: [{ key: 'authorization', value: 'Bearer {{token}}' }],
      })
      const run = await request<ApiRequestRunResult>(
        'POST',
        `/api/api-lab/requests/${apiRequest.id}/run`,
        token,
        {
          environmentId: environment.id,
          variableVariants: { token: 'admin' },
          runtimeVariables: { requestId: 'abc-123' },
        },
      )

      assert.equal(run.response.statusCode, 200)
      assert.equal(run.body.run.status, 'PASSED')
      assert.equal(run.body.run.httpStatus, 200)
      assert.equal(run.body.run.responseBodySaved, false)
      assert.equal(run.body.response?.savedResponseId, null)
      assert.match(run.body.response?.bodyPreview ?? '', new RegExp(task.code))
      assert.match(run.body.response?.bodyPreview ?? '', /abc-123/)
      assert.doesNotMatch(run.body.response?.bodyPreview ?? '', /secret-token/)
      assert.match(run.body.response?.bodyPreview ?? '', /\*\*\*\*\*\*\*\*/)
      assert.equal(await prisma.apiSavedResponse.count(), 0)
    } finally {
      await internalApi.close()
    }
  })

  test('stores explicitly saved responses with truncation and secret masking', async () => {
    const internalApi = await startInternalApi((_incomingRequest, response) => {
      response.setHeader('content-type', 'text/plain')
      response.end(`secret-token-${'x'.repeat(210_000)}`)
    })

    try {
      const token = await setupSession()
      const project = await setupProject('SAVE', token)
      const environment = await createEnvironment(token, project.id, internalApi.baseUrl)
      const apiRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'Large response',
        method: 'GET',
        url: '{{baseUrl}}/large',
      })
      const run = await request<ApiRequestRunResult>(
        'POST',
        `/api/api-lab/requests/${apiRequest.id}/run`,
        token,
        {
          environmentId: environment.id,
          saveResponseBody: true,
        },
      )

      assert.equal(run.response.statusCode, 200)
      assert.equal(run.body.run.responseBodySaved, true)
      assert.ok(run.body.response?.truncated)
      assert.ok(run.body.response?.savedResponseId)

      const savedResponse = await prisma.apiSavedResponse.findUniqueOrThrow({
        where: { id: run.body.response?.savedResponseId ?? '' },
      })

      assert.equal(savedResponse.truncated, true)
      assert.doesNotMatch(savedResponse.bodyText ?? '', /secret-token/)
      assert.match(savedResponse.bodyText ?? '', /\*\*\*\*\*\*\*\*/)
    } finally {
      await internalApi.close()
    }
  })

  test('stores failed run metadata for invalid URLs', async () => {
    const token = await setupSession()
    const project = await setupProject('BAD', token)
    const apiRequest = await createApiRequest(token, {
      projectId: project.id,
      name: 'Bad URL',
      method: 'GET',
      url: '/relative-without-base-url',
    })
    const run = await request<ApiRequestRunResult>('POST', `/api/api-lab/requests/${apiRequest.id}/run`, token)

    assert.equal(run.response.statusCode, 200)
    assert.equal(run.body.run.status, 'FAILED')
    assert.equal(run.body.run.httpStatus, null)
    assert.match(run.body.run.errorMessage ?? '', /URL API khong hop le/)
  })

  test('stores failed run metadata when a request times out', async () => {
    const internalApi = await startInternalApi(async (_incomingRequest, response) => {
      await new Promise((resolve) => setTimeout(resolve, 200))
      response.end('late')
    })

    try {
      const token = await setupSession()
      const project = await setupProject('SLOW', token)
      const environment = await createEnvironment(token, project.id, internalApi.baseUrl)
      const apiRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'Slow API',
        method: 'GET',
        url: '{{baseUrl}}/slow',
        timeoutMs: 1_000,
      })
      const run = await request<ApiRequestRunResult>(
        'POST',
        `/api/api-lab/requests/${apiRequest.id}/run`,
        token,
        { environmentId: environment.id, timeoutMs: 50 },
      )

      assert.equal(run.response.statusCode, 200)
      assert.equal(run.body.run.status, 'FAILED')
      assert.match(run.body.run.errorMessage ?? '', /timeout/i)
    } finally {
      await internalApi.close()
    }
  })

  test('runs a flow sequentially and passes captured output into later steps', async () => {
    const internalApi = await startInternalApi((incomingRequest, response) => {
      response.setHeader('content-type', 'application/json')

      if (incomingRequest.url?.startsWith('/create')) {
        response.setHeader('x-flow-token', 'dynamic-secret')
        response.end(JSON.stringify({ data: { id: 'user-123' } }))
        return
      }

      response.end(
        JSON.stringify({
          url: incomingRequest.url,
          authorization: incomingRequest.headers.authorization,
          fromStatus: incomingRequest.headers['x-from-status'],
        }),
      )
    })

    try {
      const token = await setupSession()
      const project = await setupProject('CHAIN', token)
      const environment = await createEnvironment(token, project.id, internalApi.baseUrl)
      const createRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'Create user',
        method: 'GET',
        url: '{{baseUrl}}/create',
      })
      const readRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'Read user',
        method: 'GET',
        url: '{{baseUrl}}/users/{{userId}}',
        headers: [
          { key: 'authorization', value: 'Bearer {{flowToken}}' },
          { key: 'x-from-status', value: '{{createStatus}}' },
        ],
      })
      const flow = await request<ApiFlow>('POST', '/api/api-lab/flows', token, {
        projectId: project.id,
        name: 'Create then read',
      })
      const readStep = await request<ApiFlowStep>('POST', `/api/api-lab/flows/${flow.body.id}/steps`, token, {
        requestId: readRequest.id,
        name: 'Read user',
        sortOrder: 0,
      })
      const createStep = await request<ApiFlowStep>('POST', `/api/api-lab/flows/${flow.body.id}/steps`, token, {
        requestId: createRequest.id,
        name: 'Create user',
        sortOrder: 1,
        captureRules: [
          { source: 'JSON', path: '$.data.id', as: 'userId', required: true },
          { source: 'HEADER', header: 'x-flow-token', as: 'flowToken', required: true, secret: true },
          { source: 'STATUS', as: 'createStatus' },
        ],
      })

      await request<ApiFlowStep>('PATCH', `/api/api-lab/flow-steps/${createStep.body.id}`, token, {
        requestId: createRequest.id,
        name: 'Create user',
        sortOrder: 0,
        captureRules: [
          { source: 'JSON', path: '$.data.id', as: 'userId', required: true },
          { source: 'HEADER', header: 'x-flow-token', as: 'flowToken', required: true, secret: true },
          { source: 'STATUS', as: 'createStatus' },
        ],
      })
      await request<ApiFlowStep>('PATCH', `/api/api-lab/flow-steps/${readStep.body.id}`, token, {
        requestId: readRequest.id,
        name: 'Read user',
        sortOrder: 1,
      })

      const steps = await request<ApiFlowStep[]>('GET', `/api/api-lab/flows/${flow.body.id}/steps`, token)

      assert.equal(steps.body[0]?.id, createStep.body.id)
      assert.equal(steps.body[1]?.id, readStep.body.id)

      const run = await request<ApiFlowRunResult>('POST', `/api/api-lab/flows/${flow.body.id}/run`, token, {
        environmentId: environment.id,
      })

      assert.equal(run.response.statusCode, 200)
      assert.equal(run.body.flowRun.status, 'PASSED')
      assert.equal(run.body.steps.length, 2)
      assert.equal(run.body.steps[0]?.capturedVariables.userId, 'user-123')
      assert.equal(run.body.steps[0]?.capturedVariables.flowToken, '********')
      assert.match(run.body.steps[1]?.response?.bodyPreview ?? '', /\/users\/user-123/)
      assert.match(run.body.steps[1]?.response?.bodyPreview ?? '', /"fromStatus":"200"/)
      assert.doesNotMatch(run.body.steps[1]?.response?.bodyPreview ?? '', /dynamic-secret/)
      assert.match(run.body.steps[1]?.response?.bodyPreview ?? '', /\*\*\*\*\*\*\*\*/)
      assert.equal(await prisma.apiFlowRun.count(), 1)
      assert.equal(await prisma.apiRequestRun.count({ where: { flowRunId: run.body.flowRun.id } }), 2)
    } finally {
      await internalApi.close()
    }
  })

  test('stops a flow when a required capture is missing and records skipped steps', async () => {
    const internalApi = await startInternalApi((_incomingRequest, response) => {
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ data: {} }))
    })

    try {
      const token = await setupSession()
      const project = await setupProject('MISS', token)
      const environment = await createEnvironment(token, project.id, internalApi.baseUrl)
      const firstRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'Missing capture',
        method: 'GET',
        url: '{{baseUrl}}/missing',
      })
      const secondRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'Should skip',
        method: 'GET',
        url: '{{baseUrl}}/next/{{missingId}}',
      })
      const flow = await request<ApiFlow>('POST', '/api/api-lab/flows', token, {
        projectId: project.id,
        name: 'Missing required capture',
      })

      await request<ApiFlowStep>('POST', `/api/api-lab/flows/${flow.body.id}/steps`, token, {
        requestId: firstRequest.id,
        name: 'Missing capture',
        captureRules: [{ source: 'JSON', path: '$.data.id', as: 'missingId', required: true }],
      })
      await request<ApiFlowStep>('POST', `/api/api-lab/flows/${flow.body.id}/steps`, token, {
        requestId: secondRequest.id,
        name: 'Should skip',
      })

      const run = await request<ApiFlowRunResult>('POST', `/api/api-lab/flows/${flow.body.id}/run`, token, {
        environmentId: environment.id,
      })

      assert.equal(run.response.statusCode, 200)
      assert.equal(run.body.flowRun.status, 'FAILED')
      assert.match(run.body.flowRun.errorMessage ?? '', /Thieu capture bat buoc/)
      assert.equal(run.body.steps[0]?.run.status, 'FAILED')
      assert.equal(run.body.steps[1]?.run.status, 'SKIPPED')
      assert.match(run.body.steps[1]?.run.errorMessage ?? '', /bo qua/)
    } finally {
      await internalApi.close()
    }
  })

  test('passes request assertions for status, JSON, body, header, and duration', async () => {
    const internalApi = await startInternalApi((_incomingRequest, response) => {
      response.setHeader('content-type', 'application/json')
      response.setHeader('x-sample-id', 'sample-001')
      response.end(JSON.stringify({ data: { id: 'sample-001' }, ok: true }))
    })

    try {
      const token = await setupSession()
      const project = await setupProject('ASSERT', token)
      const environment = await createEnvironment(token, project.id, internalApi.baseUrl)
      const apiRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'Assert success',
        method: 'GET',
        url: '{{baseUrl}}/assert',
        assertionRules: [
          { type: 'STATUS_EQUALS', expected: '200', label: 'status 200' },
          { type: 'JSON_PATH_EXISTS', path: '$.data.id', label: 'id exists' },
          { type: 'JSON_PATH_EQUALS', path: '$.data.id', expected: 'sample-001', label: 'id equals' },
          { type: 'BODY_CONTAINS', expected: 'sample-001', label: 'body contains id' },
          { type: 'HEADER_EXISTS', header: 'x-sample-id', label: 'header exists' },
          { type: 'DURATION_BELOW', maxDurationMs: 5000, label: 'fast enough' },
        ],
      })
      const run = await request<ApiRequestRunResult>(
        'POST',
        `/api/api-lab/requests/${apiRequest.id}/run`,
        token,
        { environmentId: environment.id },
      )
      const summary = JSON.parse(run.body.run.assertionSummaryJson) as { total: number; passed: number; failed: number }

      assert.equal(run.response.statusCode, 200)
      assert.equal(run.body.run.status, 'PASSED')
      assert.equal(summary.total, 6)
      assert.equal(summary.passed, 6)
      assert.equal(summary.failed, 0)
    } finally {
      await internalApi.close()
    }
  })

  test('fails a run when a required assertion fails while keeping response visible', async () => {
    const internalApi = await startInternalApi((_incomingRequest, response) => {
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ data: { id: 'actual-id' } }))
    })

    try {
      const token = await setupSession()
      const project = await setupProject('AFAIL', token)
      const environment = await createEnvironment(token, project.id, internalApi.baseUrl)
      const apiRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'Assert failure',
        method: 'GET',
        url: '{{baseUrl}}/assert-fail',
        assertionRules: [
          { type: 'JSON_PATH_EQUALS', path: '$.data.id', expected: 'expected-id', label: 'id must match', required: true },
        ],
      })
      const run = await request<ApiRequestRunResult>(
        'POST',
        `/api/api-lab/requests/${apiRequest.id}/run`,
        token,
        { environmentId: environment.id },
      )
      const summary = JSON.parse(run.body.run.assertionSummaryJson) as { failed: number; requiredFailed: number }

      assert.equal(run.response.statusCode, 200)
      assert.equal(run.body.run.status, 'FAILED')
      assert.equal(summary.failed, 1)
      assert.equal(summary.requiredFailed, 1)
      assert.match(run.body.run.errorMessage ?? '', /khong bang expected-id/)
      assert.match(run.body.response?.bodyPreview ?? '', /actual-id/)
    } finally {
      await internalApi.close()
    }
  })

  test('filters API run history by request, status, and date', async () => {
    const internalApi = await startInternalApi((_incomingRequest, response) => {
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ ok: true }))
    })

    try {
      const token = await setupSession()
      const project = await setupProject('HIST', token)
      const environment = await createEnvironment(token, project.id, internalApi.baseUrl)
      const passingRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'History pass',
        method: 'GET',
        url: '{{baseUrl}}/history-pass',
        assertionRules: [{ type: 'STATUS_EQUALS', expected: '200', label: 'status 200' }],
      })
      const failingRequest = await createApiRequest(token, {
        projectId: project.id,
        name: 'History fail',
        method: 'GET',
        url: '{{baseUrl}}/history-fail',
        assertionRules: [{ type: 'STATUS_EQUALS', expected: '201', label: 'status 201' }],
      })

      await request<ApiRequestRunResult>('POST', `/api/api-lab/requests/${passingRequest.id}/run`, token, {
        environmentId: environment.id,
      })
      await request<ApiRequestRunResult>('POST', `/api/api-lab/requests/${failingRequest.id}/run`, token, {
        environmentId: environment.id,
      })

      const today = new Date().toISOString().slice(0, 10)
      const failedHistory = await request<ApiHistoryItem[]>(
        'GET',
        `/api/api-lab/history?projectId=${project.id}&status=FAILED&requestId=${failingRequest.id}&dateFrom=${today}&dateTo=${today}`,
        token,
      )

      assert.equal(failedHistory.response.statusCode, 200)
      assert.equal(failedHistory.body.length, 1)
      assert.equal(failedHistory.body[0]?.kind, 'REQUEST')
      assert.equal(failedHistory.body[0]?.request?.id, failingRequest.id)
      assert.equal(failedHistory.body[0]?.status, 'FAILED')
    } finally {
      await internalApi.close()
    }
  })
})
