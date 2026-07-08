import { PrismaClient } from '@prisma/client'
import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, test } from 'node:test'

import { buildServer } from './server.js'
import type { AppEnv } from './env.js'

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

type TaskGroup = {
  id: string
}

type Repository = {
  id: string
}

type Task = {
  id: string
  code: string
  status: string
  doneAt: string | null
  releaseReadyAt: string | null
}

type Branch = {
  id: string
  sourceBranchId: string | null
  name: string
  status: string
  checkoutSourceBranch: string | null
  intendedMergeTarget: string | null
  actualMergedInto: string | null
  lineageId: string | null
  generatedCheckoutCommand: string | null
  taskLinks: Array<{
    role: string
    lineageId: string | null
    inheritedFromBranchId: string | null
    task: Task
  }>
}

type Workspace = {
  token: string
  project: Project
  group: TaskGroup
  repo: Repository
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
  await prisma.refreshToken.deleteMany()
  await prisma.timelineEvent.deleteMany()
  await prisma.taskBranch.deleteMany()
  await prisma.branchAlias.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.task.deleteMany()
  await prisma.note.deleteMany()
  await prisma.project.updateMany({ data: { defaultRepoId: null } })
  await prisma.repository.deleteMany()
  await prisma.workflowStatus.deleteMany()
  await prisma.taskGroup.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
}

async function setupWorkspace(): Promise<Workspace> {
  const setup = await request<Session>('POST', '/api/auth/setup', undefined, {
    name: 'Khanh Test',
    email: 'khanh.test@example.com',
    password: 'password123',
  })
  assert.equal(setup.response.statusCode, 200)

  const token = setup.body.accessToken
  const project = await request<Project>('POST', '/api/projects', token, {
    code: 'OPS',
    name: 'Van hanh',
  })
  assert.equal(project.response.statusCode, 200)

  const group = await request<TaskGroup>('POST', `/api/projects/${project.body.id}/task-groups`, token, {
    code: 'BE',
    name: 'Backend',
  })
  assert.equal(group.response.statusCode, 200)

  const repo = await request<Repository>('POST', `/api/projects/${project.body.id}/repositories`, token, {
    name: 'backend-api',
    gitlabUrl: 'https://gitlab.local',
    gitlabProjectPath: 'team/backend-api',
    defaultBranch: 'main',
    productionBranch: 'main',
    releaseBranchPattern: 'release/DDMMYYYY',
  })
  assert.equal(repo.response.statusCode, 200)

  return {
    token,
    project: project.body,
    group: group.body,
    repo: repo.body,
  }
}

async function createTask(workspace: Workspace, title: string, taskGroupId: string | null = workspace.group.id) {
  const result = await request<Task>('POST', '/api/tasks', workspace.token, {
    projectId: workspace.project.id,
    taskGroupId,
    title,
    priority: 'MEDIUM',
    type: 'FEATURE',
  })
  assert.equal(result.response.statusCode, 200)

  return result.body
}

async function createBranch(workspace: Workspace, payload: Record<string, unknown>) {
  const result = await request<Branch>('POST', '/api/branches', workspace.token, {
    repositoryId: workspace.repo.id,
    ...payload,
  })
  assert.equal(result.response.statusCode, 200)

  return result.body
}

async function getTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })

  assert.ok(task)
  return task
}

async function getBranch(branchId: string) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } })

  assert.ok(branch)
  return branch
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

describe('protected backend APIs', () => {
  test('reject unauthenticated access before protected data is exposed', async () => {
    const projects = await request<{ message: string }>('GET', '/api/projects')
    assert.equal(projects.response.statusCode, 401)
    assert.match(projects.body.message, /dang nhap/)

    const createProject = await request<{ message: string }>('POST', '/api/projects', undefined, {
      code: 'NOPE',
      name: 'Khong duoc tao',
    })
    assert.equal(createProject.response.statusCode, 401)
    assert.equal(await prisma.project.count(), 0)
  })
})

describe('task planning rules', () => {
  test('generates project task codes and grouped task codes independently', async () => {
    const workspace = await setupWorkspace()
    const firstGroupTask = await createTask(workspace, 'Tao API export')
    const secondGroupTask = await createTask(workspace, 'Sua validate export')
    const projectTask = await createTask(workspace, 'Cap nhat README', null)

    assert.equal(firstGroupTask.code, 'OPS-BE-001')
    assert.equal(secondGroupTask.code, 'OPS-BE-002')
    assert.equal(projectTask.code, 'OPS-001')
  })
})

describe('branch lifecycle rules', () => {
  test('creates app branch records with checkout source, target, command, and inherited task links', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Tao API export')
    const branchA = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-export',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })
    const branchB = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-export-fix',
      sourceBranchId: branchA.id,
      intendedMergeTarget: 'main',
      inheritTaskLinks: true,
    })

    assert.equal(branchA.checkoutSourceBranch, 'main')
    assert.equal(branchA.intendedMergeTarget, 'release/08072026')
    assert.equal(branchA.generatedCheckoutCommand?.includes('git checkout main'), true)
    assert.equal(branchA.taskLinks[0]?.task.id, task.id)
    assert.equal(branchB.sourceBranchId, branchA.id)
    assert.equal(branchB.checkoutSourceBranch, branchA.name)
    assert.equal(branchB.lineageId, branchA.lineageId)
    assert.equal(branchB.taskLinks[0]?.role, 'CARRIED_FROM_SOURCE')
    assert.equal(branchB.taskLinks[0]?.inheritedFromBranchId, branchA.id)
  })

  test('marks feature branch merged to release without completing linked tasks', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Tao API export')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-export',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })
    const merge = await request<Branch>(
      'POST',
      `/api/branches/${branch.id}/mark-merged-release`,
      workspace.token,
      { targetBranch: 'release/08072026' },
    )
    const updatedTask = await getTask(task.id)

    assert.equal(merge.response.statusCode, 200)
    assert.equal(merge.body.status, 'MERGED_RELEASE')
    assert.equal(merge.body.actualMergedInto, 'release/08072026')
    assert.equal(updatedTask.status, 'MERGED_RELEASE')
    assert.equal(updatedTask.doneAt, null)
  })

  test('warns on main merge without readiness but still records real completion', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Tao API export')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-export',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'main',
      taskIds: [task.id],
    })
    const merge = await request<{ warnings: string[]; branch: Branch }>(
      'POST',
      `/api/branches/${branch.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )
    const updatedTask = await getTask(task.id)

    assert.equal(merge.response.statusCode, 200)
    assert.equal(merge.body.branch.status, 'MERGED_MAIN')
    assert.equal(merge.body.branch.actualMergedInto, 'main')
    assert.equal(merge.body.warnings.length, 1)
    assert.match(merge.body.warnings[0] ?? '', /OPS-BE-001/)
    assert.equal(updatedTask.status, 'DONE')
    assert.ok(updatedTask.doneAt)
  })

  test('waits for every independent required branch lineage before completing a task', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Dong bo hai module')
    const branchA = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-api',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'main',
      taskIds: [task.id],
    })
    const branchB = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-worker',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'main',
      taskIds: [task.id],
    })

    const firstMerge = await request(
      'POST',
      `/api/branches/${branchA.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )
    assert.equal(firstMerge.response.statusCode, 200)
    assert.equal((await getTask(task.id)).status, 'PLANNED')

    const secondMerge = await request(
      'POST',
      `/api/branches/${branchB.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )
    assert.equal(secondMerge.response.statusCode, 200)
    assert.equal((await getTask(task.id)).status, 'DONE')
  })

  test('lets a derived branch complete the carried task when it reaches main', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Sua loi export')
    const branchA = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-export',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })
    const branchB = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-export-fix',
      sourceBranchId: branchA.id,
      intendedMergeTarget: 'main',
      inheritTaskLinks: true,
    })
    const merge = await request(
      'POST',
      `/api/branches/${branchB.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )
    const sourceBranch = await getBranch(branchA.id)
    const updatedTask = await getTask(task.id)

    assert.equal(merge.response.statusCode, 200)
    assert.equal(sourceBranch.status, 'DRAFT')
    assert.equal(sourceBranch.mergedMainAt, null)
    assert.equal(updatedTask.status, 'DONE')
  })

  test('records actual merge destination without overwriting intended target', async () => {
    const workspace = await setupWorkspace()
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-export',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
    })
    const record = await request<Branch>(
      'POST',
      `/api/branches/${branch.id}/record-merged-into`,
      workspace.token,
      { targetBranch: 'release/22072026' },
    )
    const updatedBranch = await getBranch(branch.id)

    assert.equal(record.response.statusCode, 200)
    assert.equal(updatedBranch.intendedMergeTarget, 'release/08072026')
    assert.equal(updatedBranch.actualMergedInto, 'release/22072026')
  })

  test('moves branch status from Kanban when the target status allows drop', async () => {
    const workspace = await setupWorkspace()
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-export',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
    })
    const move = await request<Branch>('POST', `/api/branches/${branch.id}/move-status`, workspace.token, {
      status: 'READY_REVIEW',
    })
    const updatedBranch = await getBranch(branch.id)
    const event = await prisma.timelineEvent.findFirst({
      where: {
        branchId: branch.id,
        eventType: 'BRANCH_STATUS_CHANGED',
      },
    })

    assert.equal(move.response.statusCode, 200)
    assert.equal(updatedBranch.status, 'READY_REVIEW')
    assert.match(event?.metadataJson ?? '', /kanban/)
  })

  test('rejects Kanban drops into merge-derived statuses', async () => {
    const workspace = await setupWorkspace()
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-export',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'main',
    })
    const move = await request<{ message: string; blocked: boolean }>(
      'POST',
      `/api/branches/${branch.id}/move-status`,
      workspace.token,
      { status: 'MERGED_MAIN' },
    )
    const updatedBranch = await getBranch(branch.id)

    assert.equal(move.response.statusCode, 400)
    assert.equal(move.body.blocked, true)
    assert.match(move.body.message, /Merge main/)
    assert.equal(updatedBranch.status, 'DRAFT')
  })

  test('requires confirmation before moving a branch to closed from Kanban', async () => {
    const workspace = await setupWorkspace()
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-old',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'main',
    })
    const unconfirmed = await request<{ requiresConfirmation: boolean }>(
      'POST',
      `/api/branches/${branch.id}/move-status`,
      workspace.token,
      { status: 'CLOSED' },
    )
    const confirmed = await request<Branch>('POST', `/api/branches/${branch.id}/move-status`, workspace.token, {
      status: 'CLOSED',
      confirmed: true,
    })

    assert.equal(unconfirmed.response.statusCode, 409)
    assert.equal(unconfirmed.body.requiresConfirmation, true)
    assert.equal(confirmed.response.statusCode, 200)
    assert.equal((await getBranch(branch.id)).status, 'CLOSED')
  })

  test('does not complete tasks from closed branches', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Huy branch cu')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-old',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'main',
      taskIds: [task.id],
    })
    const close = await request<Branch>('POST', `/api/branches/${branch.id}/status`, workspace.token, {
      status: 'CLOSED',
    })
    const merge = await request<{ message: string }>(
      'POST',
      `/api/branches/${branch.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )
    const updatedTask = await getTask(task.id)

    assert.equal(close.response.statusCode, 200)
    assert.equal(close.body.status, 'CLOSED')
    assert.equal(merge.response.statusCode, 400)
    assert.equal(updatedTask.status, 'PLANNED')
    assert.equal(updatedTask.doneAt, null)
  })
})
