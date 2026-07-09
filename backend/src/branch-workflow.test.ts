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
  name: string
  activeReleaseCycle: {
    id: string
    name: string
  } | null
}

type Task = {
  id: string
  code: string
  status: string
  workStatus: string
  doneAt: string | null
}

type Branch = {
  id: string
  sourceBranchId: string | null
  name: string
  branchType: string
  status: string
  checkoutSourceBranch: string | null
  intendedMergeTarget: string | null
  actualMergedInto: string | null
  lineageId: string | null
  releaseCycleId: string | null
  sortOrder: number
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
    activeReleaseBranchName: 'release/08072026',
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

function testDateToken(date = new Date()) {
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear()),
  ].join('')
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

async function getBranchByName(repositoryId: string, name: string) {
  const branch = await prisma.branch.findUnique({
    where: {
      repositoryId_name: {
        repositoryId,
        name,
      },
    },
  })

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

  test('deletes tasks before prod and keeps branch/audit history', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Xoa task nhap')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    const deletion = await request<{ ok: boolean }>('DELETE', `/api/tasks/${task.id}`, workspace.token)
    const deletedTask = await prisma.task.findUnique({ where: { id: task.id } })
    const branchAfterDelete = await prisma.branch.findUnique({
      where: { id: branch.id },
      include: { taskLinks: true },
    })
    const deletedEvent = await prisma.timelineEvent.findFirst({
      where: {
        projectId: workspace.project.id,
        eventType: 'TASK_DELETED',
      },
    })

    assert.equal(deletion.response.statusCode, 200)
    assert.equal(deletion.body.ok, true)
    assert.equal(deletedTask, null)
    assert.ok(branchAfterDelete)
    assert.equal(branchAfterDelete.taskLinks.length, 0)
    assert.match(deletedEvent?.metadataJson ?? '', new RegExp(task.id))
    assert.match(deletedEvent?.metadataJson ?? '', new RegExp(branch.id))
  })

  test('updates task work status separately from branch-derived status', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Doi trang thai lam viec rieng')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    const update = await request<Task>('PATCH', `/api/tasks/${task.id}/work-status`, workspace.token, {
      workStatus: 'TESTING',
    })
    const updatedTask = await getTask(task.id)
    const event = await prisma.timelineEvent.findFirst({
      where: {
        projectId: workspace.project.id,
        taskId: task.id,
        eventType: 'TASK_WORK_STATUS_CHANGED',
      },
    })

    assert.equal(update.response.statusCode, 200)
    assert.equal(update.body.workStatus, 'TESTING')
    assert.equal(updatedTask.status, 'IN_PROGRESS')
    assert.equal(updatedTask.workStatus, 'TESTING')
    assert.match(event?.metadataJson ?? '', /TESTING/)
    assert.equal((await getBranch(branch.id)).status, 'CODING')
  })

  test('cancels tasks without deleting and restores them to draft before relinking', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Huy task nhung giu tracking')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    const cancellation = await request<Task>('POST', `/api/tasks/${task.id}/cancel`, workspace.token)
    const cancelledTask = await prisma.task.findUnique({ where: { id: task.id } })
    const activeLinksAfterCancel = await prisma.taskBranch.count({
      where: {
        taskId: task.id,
        active: true,
      },
    })
    const cancelledEvent = await prisma.timelineEvent.findFirst({
      where: {
        projectId: workspace.project.id,
        taskId: task.id,
        eventType: 'TASK_CANCELLED',
      },
    })

    assert.equal(cancellation.response.statusCode, 200)
    assert.equal(cancellation.body.status, 'CANCELLED')
    assert.equal(cancelledTask?.status, 'CANCELLED')
    assert.equal(activeLinksAfterCancel, 0)
    assert.match(cancelledEvent?.metadataJson ?? '', new RegExp(branch.id))

    const relinkWhileCancelled = await request<{ message: string }>('PATCH', `/api/branches/${branch.id}`, workspace.token, {
      name: branch.name,
      status: 'CODING',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'develop\nrelease/08072026\nmain',
      taskIds: [task.id],
    })

    assert.equal(relinkWhileCancelled.response.statusCode, 400)
    assert.match(relinkWhileCancelled.body.message, /phuc hoi/)

    const restore = await request<Task>('POST', `/api/tasks/${task.id}/restore-draft`, workspace.token)
    const restoredEvent = await prisma.timelineEvent.findFirst({
      where: {
        projectId: workspace.project.id,
        taskId: task.id,
        eventType: 'TASK_RESTORED_TO_DRAFT',
      },
    })

    assert.equal(restore.response.statusCode, 200)
    assert.equal(restore.body.status, 'PLANNED')
    assert.ok(restoredEvent)

    const relinkAfterRestore = await request<Branch>('PATCH', `/api/branches/${branch.id}`, workspace.token, {
      name: branch.name,
      status: 'CODING',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'develop\nrelease/08072026\nmain',
      taskIds: [task.id],
    })
    const activeLinksAfterRestore = await prisma.taskBranch.count({
      where: {
        taskId: task.id,
        branchId: branch.id,
        active: true,
      },
    })

    assert.equal(relinkAfterRestore.response.statusCode, 200)
    assert.equal(activeLinksAfterRestore, 1)
    assert.equal((await getTask(task.id)).status, 'IN_PROGRESS')
  })
})

describe('branch lifecycle rules', () => {
  test('creates feature branch records from trust source with rule-derived name and targets', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Tao API export')
    const branchA = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'main',
      taskIds: [task.id],
    })

    assert.equal(branchA.checkoutSourceBranch, 'main')
    assert.equal(branchA.intendedMergeTarget, 'develop\nrelease/08072026\nmain')
    assert.equal(branchA.generatedCheckoutCommand?.includes('git checkout main'), true)
    assert.equal(branchA.taskLinks[0]?.task.id, task.id)
    assert.equal((await getTask(task.id)).status, 'IN_PROGRESS')

    const releaseBranch = await getBranchByName(workspace.repo.id, 'release/08072026')

    assert.equal(releaseBranch.branchType, 'RELEASE')
    assert.equal(releaseBranch.status, 'MERGED_RELEASE')
    assert.equal(releaseBranch.checkoutSourceBranch, 'main')
    assert.equal(releaseBranch.baseBranch, 'main')
    assert.equal(releaseBranch.intendedMergeTarget, 'main')
  })

  test('marks feature branch merged to release without completing linked tasks', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Tao API export')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
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
    assert.ok((await getBranch(branch.id)).releaseCycleId)
    assert.equal(updatedTask.status, 'MERGED_RELEASE')
    assert.equal(updatedTask.doneAt, null)
  })

  test('keeps release branches in release status until main merge', async () => {
    const workspace = await setupWorkspace()
    const releaseBranch = await createBranch(workspace, {
      name: 'release/15072026',
      branchType: 'RELEASE',
      status: 'CODING',
      checkoutSourceBranch: 'develop',
    })

    assert.equal(releaseBranch.status, 'MERGED_RELEASE')
    assert.equal(releaseBranch.checkoutSourceBranch, 'main')

    const moveDevelop = await request<{ message: string }>(
      'POST',
      `/api/branches/${releaseBranch.id}/move-status`,
      workspace.token,
      { status: 'MERGED_DEVELOP' },
    )
    const genericStatus = await request<{ message: string }>(
      'POST',
      `/api/branches/${releaseBranch.id}/status`,
      workspace.token,
      { status: 'CODING' },
    )

    assert.equal(moveDevelop.response.statusCode, 400)
    assert.match(moveDevelop.body.message, /Release branch chi duoc nam o release/i)
    assert.equal(genericStatus.response.statusCode, 400)
    assert.match(genericStatus.body.message, /Merge main/i)
  })

  test('can attach a task branch to a different weekly release branch', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Tao API doi release')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    await createBranch(workspace, {
      name: 'release/15072026',
      branchType: 'RELEASE',
      checkoutSourceBranch: 'main',
    })
    const merge = await request<Branch>(
      'POST',
      `/api/branches/${branch.id}/mark-merged-release`,
      workspace.token,
      { targetBranch: 'release/15072026' },
    )
    const releaseBranch = await getBranchByName(workspace.repo.id, 'release/15072026')

    assert.equal(merge.response.statusCode, 200)
    assert.equal(merge.body.actualMergedInto, 'release/15072026')
    assert.equal(merge.body.releaseCycleId, releaseBranch.releaseCycleId)
    assert.equal(releaseBranch.branchType, 'RELEASE')
    assert.equal(releaseBranch.checkoutSourceBranch, 'main')
    assert.equal(releaseBranch.intendedMergeTarget, 'main')
  })

  test('rejects release attachment when release branch was deleted', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Khong gan release da xoa')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    const releaseBranch = await createBranch(workspace, {
      name: 'release/09072026',
      branchType: 'RELEASE',
      checkoutSourceBranch: 'main',
    })
    const deletion = await request<{ ok: boolean }>('DELETE', `/api/branches/${releaseBranch.id}`, workspace.token)
    const merge = await request<{ message: string }>(
      'POST',
      `/api/branches/${branch.id}/mark-merged-release`,
      workspace.token,
      { targetBranch: 'release/09072026' },
    )
    const releaseCycle = await prisma.releaseCycle.findFirst({
      where: {
        repositoryId: workspace.repo.id,
        name: 'release/09072026',
      },
    })

    assert.equal(deletion.response.statusCode, 200)
    assert.equal(deletion.body.ok, true)
    assert.equal(merge.response.statusCode, 400)
    assert.match(merge.body.message, /Release branch chua ton tai/i)
    assert.equal(releaseCycle?.status, 'CLOSED')
  })

  test('rejects release attachment when target name is already a task branch', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Tao API export')
    const otherTask = await createTask(workspace, 'Task branch khac')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    await createBranch(workspace, {
      name: 'feature/OPS-BE-002',
      checkoutSourceBranch: 'main',
      taskIds: [otherTask.id],
    })
    const merge = await request<{ message: string }>(
      'POST',
      `/api/branches/${branch.id}/mark-merged-release`,
      workspace.token,
      { targetBranch: 'feature/OPS-BE-002' },
    )

    assert.equal(merge.response.statusCode, 400)
    assert.match(merge.body.message, /branch rieng/i)
  })

  test('creates hotfix branch from trust source with hotfix name pattern and release targets', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Sua loi production')
    const branch = await createBranch(workspace, {
      name: `hotfix/OPS-BE-001-${testDateToken()}`,
      branchType: 'HOTFIX',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })

    assert.equal(branch.checkoutSourceBranch, 'main')
    assert.equal(branch.intendedMergeTarget, 'release/08072026\nmain')
    assert.equal(branch.branchType, 'HOTFIX')
  })

  test('blocks direct main merge from task branch by default', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Khong merge thang main')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    const merge = await request<{ message: string }>(
      'POST',
      `/api/branches/${branch.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )

    assert.equal(merge.response.statusCode, 400)
    assert.match(merge.body.message, /release/)
    assert.equal((await getTask(task.id)).status, 'IN_PROGRESS')
  })

  test('release branch main merge propagates completion to included task branches', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Tao API export')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })
    await request('POST', `/api/branches/${branch.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })
    const releaseBranch = await getBranchByName(workspace.repo.id, 'release/08072026')
    const merge = await request<{ warnings: string[]; branch: Branch }>(
      'POST',
      `/api/branches/${releaseBranch.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )
    const updatedTask = await getTask(task.id)
    const updatedFeatureBranch = await getBranch(branch.id)

    assert.equal(merge.response.statusCode, 200)
    assert.equal(merge.body.branch.status, 'MERGED_MAIN')
    assert.equal(merge.body.branch.actualMergedInto, 'main')
    assert.deepEqual(merge.body.warnings, [])
    assert.equal(updatedFeatureBranch.status, 'MERGED_MAIN')
    assert.equal(updatedFeatureBranch.actualMergedInto, 'main')
    assert.equal(updatedTask.status, 'DONE')
    assert.ok(updatedTask.doneAt)
  })

  test('rejects deleting tasks that already reached main', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Khong xoa task da len main')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })

    await request('POST', `/api/branches/${branch.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })
    const releaseBranch = await getBranchByName(workspace.repo.id, 'release/08072026')
    await request('POST', `/api/branches/${releaseBranch.id}/mark-merged-main`, workspace.token, {
      targetBranch: 'main',
      confirmed: true,
    })

    const edit = await request<{ message: string }>('PATCH', `/api/tasks/${task.id}`, workspace.token, {
      title: 'Doi sau prod',
    })
    const deletion = await request<{ message: string }>('DELETE', `/api/tasks/${task.id}`, workspace.token)

    assert.equal(edit.response.statusCode, 400)
    assert.match(edit.body.message, /prod|main/i)
    assert.equal(deletion.response.statusCode, 400)
    assert.match(deletion.body.message, /prod|main/i)
    assert.equal((await getTask(task.id)).status, 'DONE')
  })

  test('moves a mistaken release main merge back to release with child branches and tasks', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Rollback release nham')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })

    await request('POST', `/api/branches/${branch.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })
    const releaseBranch = await getBranchByName(workspace.repo.id, 'release/08072026')
    const mainMerge = await request(
      'POST',
      `/api/branches/${releaseBranch.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )
    assert.equal(mainMerge.response.statusCode, 200)
    assert.equal((await getTask(task.id)).status, 'DONE')

    const rollback = await request<Branch>('POST', `/api/branches/${releaseBranch.id}/move-status`, workspace.token, {
      status: 'MERGED_RELEASE',
      confirmed: true,
    })
    const revertedReleaseBranch = await getBranch(releaseBranch.id)
    const revertedFeatureBranch = await getBranch(branch.id)
    const revertedTask = await getTask(task.id)
    const rollbackEvent = await prisma.timelineEvent.findFirst({
      where: {
        branchId: releaseBranch.id,
        eventType: 'BRANCH_MAIN_ROLLBACK_TO_RELEASE',
      },
    })

    assert.equal(rollback.response.statusCode, 200)
    assert.equal(rollback.body.status, 'MERGED_RELEASE')
    assert.equal(revertedReleaseBranch.status, 'MERGED_RELEASE')
    assert.equal(revertedReleaseBranch.mergedMainAt, null)
    assert.equal(revertedFeatureBranch.status, 'MERGED_RELEASE')
    assert.equal(revertedFeatureBranch.actualMergedInto, 'release/08072026')
    assert.equal(revertedFeatureBranch.mergedMainAt, null)
    assert.equal(revertedTask.status, 'MERGED_RELEASE')
    assert.equal(revertedTask.doneAt, null)
    assert.ok(rollbackEvent)
  })

  test('deletes branch records that have not reached main', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Xoa branch nhap')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    const deletion = await request<{ ok: boolean }>('DELETE', `/api/branches/${branch.id}`, workspace.token)
    const deletedBranch = await prisma.branch.findUnique({ where: { id: branch.id } })
    const deletedLinks = await prisma.taskBranch.count({ where: { branchId: branch.id } })
    const deletedEvent = await prisma.timelineEvent.findFirst({
      where: {
        projectId: workspace.project.id,
        eventType: 'BRANCH_DELETED',
      },
    })

    assert.equal(deletion.response.statusCode, 200)
    assert.equal(deletion.body.ok, true)
    assert.equal(deletedBranch, null)
    assert.equal(deletedLinks, 0)
    assert.equal((await getTask(task.id)).status, 'PLANNED')
    assert.match(deletedEvent?.metadataJson ?? '', new RegExp(branch.id))
  })

  test('rejects deleting release parents with children and branches that reached main', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Khong xoa branch da main')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })

    await request('POST', `/api/branches/${branch.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })
    const releaseBranch = await getBranchByName(workspace.repo.id, 'release/08072026')
    const releaseDelete = await request<{ message: string }>('DELETE', `/api/branches/${releaseBranch.id}`, workspace.token)

    assert.equal(releaseDelete.response.statusCode, 400)
    assert.match(releaseDelete.body.message, /nhanh con/i)

    await request('POST', `/api/branches/${releaseBranch.id}/mark-merged-main`, workspace.token, {
      targetBranch: 'main',
      confirmed: true,
    })
    const childDelete = await request<{ message: string }>('DELETE', `/api/branches/${branch.id}`, workspace.token)

    assert.equal(childDelete.response.statusCode, 400)
    assert.match(childDelete.body.message, /vao main/i)
    assert.ok(await getBranch(branch.id))
  })

  test('keeps main child branches attached until release parent is rolled back', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Doi release sau rollback')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })

    await request('POST', `/api/branches/${branch.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })
    const releaseBranch = await getBranchByName(workspace.repo.id, 'release/08072026')
    await request('POST', `/api/branches/${releaseBranch.id}/mark-merged-main`, workspace.token, {
      targetBranch: 'main',
      confirmed: true,
    })

    const changeWhileMain = await request<{ message: string }>(
      'POST',
      `/api/branches/${branch.id}/mark-merged-release`,
      workspace.token,
      { targetBranch: 'release/15072026' },
    )
    const statusWhileMain = await request<{ message: string; blocked: boolean }>(
      'POST',
      `/api/branches/${branch.id}/move-status`,
      workspace.token,
      { status: 'CODING' },
    )

    assert.equal(changeWhileMain.response.statusCode, 400)
    assert.match(changeWhileMain.body.message, /ve release/i)
    assert.equal(statusWhileMain.response.statusCode, 400)
    assert.equal(statusWhileMain.body.blocked, true)
    assert.equal((await getBranch(branch.id)).actualMergedInto, 'main')

    const rollback = await request('POST', `/api/branches/${releaseBranch.id}/move-status`, workspace.token, {
      status: 'MERGED_RELEASE',
      confirmed: true,
    })
    await createBranch(workspace, {
      name: 'release/15072026',
      branchType: 'RELEASE',
      checkoutSourceBranch: 'main',
    })
    const changeAfterRollback = await request<Branch>(
      'POST',
      `/api/branches/${branch.id}/mark-merged-release`,
      workspace.token,
      { targetBranch: 'release/15072026' },
    )
    const deleteAfterRollback = await request<{ ok: boolean }>('DELETE', `/api/branches/${branch.id}`, workspace.token)

    assert.equal(rollback.response.statusCode, 200)
    assert.equal(changeAfterRollback.response.statusCode, 200)
    assert.equal(changeAfterRollback.body.actualMergedInto, 'release/15072026')
    assert.equal(deleteAfterRollback.response.statusCode, 200)
    assert.equal(deleteAfterRollback.body.ok, true)
  })

  test('detaches release child branches by status move before main', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Go nhanh khoi release')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })

    await request('POST', `/api/branches/${branch.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })
    assert.equal((await getTask(task.id)).status, 'MERGED_RELEASE')

    const detach = await request<Branch>('POST', `/api/branches/${branch.id}/move-status`, workspace.token, {
      status: 'CODING',
    })
    const detachedBranch = await getBranch(branch.id)
    const detachedTask = await getTask(task.id)
    const detachEvent = await prisma.timelineEvent.findFirst({
      where: {
        branchId: branch.id,
        eventType: 'BRANCH_RELEASE_DETACHED',
      },
    })

    assert.equal(detach.response.statusCode, 200)
    assert.equal(detach.body.status, 'CODING')
    assert.equal(detachedBranch.releaseCycleId, null)
    assert.equal(detachedBranch.actualMergedInto, null)
    assert.equal(detachedBranch.mergedReleaseAt, null)
    assert.equal(detachedTask.status, 'IN_PROGRESS')
    assert.ok(detachEvent)
  })

  test('detaches release child branches by edit before main', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Edit de go release')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })

    await request('POST', `/api/branches/${branch.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })

    const detach = await request<Branch>('PATCH', `/api/branches/${branch.id}`, workspace.token, {
      name: branch.name,
      status: 'MERGED_DEVELOP',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'develop\nrelease/08072026\nmain',
    })
    const detachedBranch = await getBranch(branch.id)

    assert.equal(detach.response.statusCode, 200)
    assert.equal(detach.body.status, 'MERGED_DEVELOP')
    assert.equal(detachedBranch.releaseCycleId, null)
    assert.equal(detachedBranch.actualMergedInto, null)
    assert.equal((await getTask(task.id)).status, 'IN_PROGRESS')
  })

  test('uses the reassigned active branch as the task completion source', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Dong bo hai module')
    const branchA = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })
    await request('POST', `/api/branches/${branchA.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })

    const nextRelease = await request<Repository>('PATCH', `/api/repositories/${workspace.repo.id}`, workspace.token, {
      name: workspace.repo.name,
      activeReleaseBranchName: 'release/22072026',
      featureNamePattern: 'feature/{jiraCode}-worker',
    })
    assert.equal(nextRelease.response.statusCode, 200)

    const branchB = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-worker',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/22072026',
      taskIds: [task.id],
    })
    assert.notEqual(branchA.id, branchB.id)
    await request('POST', `/api/branches/${branchB.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/22072026',
    })

    const firstReleaseBranch = await getBranchByName(workspace.repo.id, 'release/08072026')
    const firstMerge = await request(
      'POST',
      `/api/branches/${firstReleaseBranch.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )
    assert.equal(firstMerge.response.statusCode, 200)
    assert.equal((await getTask(task.id)).status, 'MERGED_RELEASE')

    const secondReleaseBranch = await getBranchByName(workspace.repo.id, 'release/22072026')
    const secondMerge = await request(
      'POST',
      `/api/branches/${secondReleaseBranch.id}/mark-merged-main`,
      workspace.token,
      { targetBranch: 'main', confirmed: true },
    )
    assert.equal(secondMerge.response.statusCode, 200)
    assert.equal((await getTask(task.id)).status, 'DONE')
  })

  test('inherits only unfinished tasks from the source branch', async () => {
    const workspace = await setupWorkspace()
    const activeTask = await createTask(workspace, 'Task con tiep tuc lam')
    const doneTask = await createTask(workspace, 'Task da done')
    const cancelledTask = await createTask(workspace, 'Task da huy')
    const sourceBranch = await createBranch(workspace, {
      name: 'bugfix/OPS-BE-001-source',
      branchType: 'BUGFIX',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'main',
      taskIds: [activeTask.id, doneTask.id, cancelledTask.id],
    })

    await prisma.task.update({
      where: { id: doneTask.id },
      data: {
        status: 'DONE',
        doneAt: new Date(),
      },
    })
    await prisma.task.update({
      where: { id: cancelledTask.id },
      data: { status: 'CANCELLED' },
    })

    const childBranch = await createBranch(workspace, {
      name: 'support/OPS-BE-001-child',
      branchType: 'SUPPORT',
      sourceBranchId: sourceBranch.id,
      checkoutSourceBranch: sourceBranch.name,
      intendedMergeTarget: 'main',
      inheritTaskLinks: true,
    })

    assert.deepEqual(
      childBranch.taskLinks.map((link) => link.task.id),
      [activeTask.id],
    )
  })

  test('rejects creating task branch from another branch when source override is disabled', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Sua loi export')
    const branchA = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'release/08072026',
      taskIds: [task.id],
    })
    const branchB = await request<{ message: string }>('POST', '/api/branches', workspace.token, {
      repositoryId: workspace.repo.id,
      name: 'feature/OPS-BE-001-fix',
      sourceBranchId: branchA.id,
      intendedMergeTarget: 'main',
      inheritTaskLinks: true,
    })
    const updatedTask = await getTask(task.id)

    assert.equal(branchB.response.statusCode, 400)
    assert.match(branchB.body.message, /checkout tu main/)
    assert.equal(updatedTask.status, 'IN_PROGRESS')
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
    assert.match(updatedBranch.intendedMergeTarget ?? '', /release\/08072026/)
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
      status: 'MERGED_DEVELOP',
    })
    const updatedBranch = await getBranch(branch.id)
    const event = await prisma.timelineEvent.findFirst({
      where: {
        branchId: branch.id,
        eventType: 'BRANCH_STATUS_CHANGED',
      },
    })

    assert.equal(move.response.statusCode, 200)
    assert.equal(updatedBranch.status, 'MERGED_DEVELOP')
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
    assert.equal(updatedBranch.status, 'CODING')
  })

  test('reorders top-level branch cards within the same Kanban status', async () => {
    const workspace = await setupWorkspace()
    const taskA = await createTask(workspace, 'Tao API export')
    const taskB = await createTask(workspace, 'Sua validate export')
    const branchA = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [taskA.id],
    })
    const branchB = await createBranch(workspace, {
      name: 'feature/OPS-BE-002',
      checkoutSourceBranch: 'main',
      taskIds: [taskB.id],
    })
    const reorder = await request<{ ok: boolean }>('POST', '/api/branches/reorder', workspace.token, {
      branchIds: [branchB.id, branchA.id],
    })
    const list = await request<Branch[]>('GET', `/api/branches?projectId=${workspace.project.id}&status=CODING`, workspace.token)

    assert.equal(reorder.response.statusCode, 200)
    assert.equal(reorder.body.ok, true)
    assert.deepEqual(
      list.body.filter((branch) => [branchA.id, branchB.id].includes(branch.id)).map((branch) => branch.id),
      [branchB.id, branchA.id],
    )
  })

  test('reorders release child branches inside the same release parent', async () => {
    const workspace = await setupWorkspace()
    const taskA = await createTask(workspace, 'Tao API export')
    const taskB = await createTask(workspace, 'Sua validate export')
    const branchA = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [taskA.id],
    })
    const branchB = await createBranch(workspace, {
      name: 'feature/OPS-BE-002',
      checkoutSourceBranch: 'main',
      taskIds: [taskB.id],
    })

    await request('POST', `/api/branches/${branchA.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })
    await request('POST', `/api/branches/${branchB.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })

    const reorder = await request<{ ok: boolean }>('POST', '/api/branches/reorder', workspace.token, {
      branchIds: [branchB.id, branchA.id],
    })
    const releaseBranch = await getBranchByName(workspace.repo.id, 'release/08072026')
    const list = await request<Branch[]>(
      'GET',
      `/api/branches?projectId=${workspace.project.id}&status=MERGED_RELEASE`,
      workspace.token,
    )

    assert.equal(reorder.response.statusCode, 200)
    assert.equal(reorder.body.ok, true)
    assert.deepEqual(
      list.body
        .filter((branch) => branch.releaseCycleId === releaseBranch.releaseCycleId && branch.branchType !== 'RELEASE')
        .map((branch) => branch.id),
      [branchB.id, branchA.id],
    )
  })

  test('rejects deprecated branch statuses from Kanban', async () => {
    const workspace = await setupWorkspace()
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-old',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'main',
    })
    const move = await request<{ message: string }>(
      'POST',
      `/api/branches/${branch.id}/move-status`,
      workspace.token,
      { status: 'CLOSED' },
    )

    assert.equal(move.response.statusCode, 400)
    assert.match(move.body.message, /khong hop le|dang tat/)
    assert.equal((await getBranch(branch.id)).status, 'CODING')
  })

  test('does not complete tasks from develop status moves', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Merge vao develop')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'develop',
      taskIds: [task.id],
    })
    const move = await request<Branch>(
      'POST',
      `/api/branches/${branch.id}/move-status`,
      workspace.token,
      { status: 'MERGED_DEVELOP' },
    )
    const updatedTask = await getTask(task.id)

    assert.equal(move.response.statusCode, 200)
    assert.equal(move.body.status, 'MERGED_DEVELOP')
    assert.equal(updatedTask.status, 'IN_PROGRESS')
    assert.equal(updatedTask.doneAt, null)
  })

  test('keeps only one active branch link per task', async () => {
    const workspace = await setupWorkspace()
    const task = await createTask(workspace, 'Doi branch dang gan')
    const branchA = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    const patternChange = await request<Repository>('PATCH', `/api/repositories/${workspace.repo.id}`, workspace.token, {
      name: workspace.repo.name,
      featureNamePattern: 'feature/{jiraCode}-rework',
    })
    assert.equal(patternChange.response.statusCode, 200)

    const branchB = await createBranch(workspace, {
      name: 'feature/OPS-BE-001-rework',
      checkoutSourceBranch: 'main',
      taskIds: [task.id],
    })
    const activeLinks = await prisma.taskBranch.findMany({
      where: {
        taskId: task.id,
        active: true,
      },
    })

    assert.notEqual(branchA.id, branchB.id)
    assert.equal(activeLinks.length, 1)
    assert.equal(activeLinks[0]?.branchId, branchB.id)
    assert.equal((await getTask(task.id)).status, 'IN_PROGRESS')
  })

  test('allows adding tasks to coding and develop branches from branch edit', async () => {
    const workspace = await setupWorkspace()
    const taskA = await createTask(workspace, 'Task da co trong branch')
    const taskB = await createTask(workspace, 'Task them khi dang code')
    const taskC = await createTask(workspace, 'Task them khi o develop')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [taskA.id],
    })
    const addWhileCoding = await request<Branch>('PATCH', `/api/branches/${branch.id}`, workspace.token, {
      name: branch.name,
      status: 'CODING',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'develop\nrelease/08072026\nmain',
      taskIds: [taskA.id, taskB.id],
    })
    const moveDevelop = await request<Branch>('POST', `/api/branches/${branch.id}/move-status`, workspace.token, {
      status: 'MERGED_DEVELOP',
    })
    const addWhileDevelop = await request<Branch>('PATCH', `/api/branches/${branch.id}`, workspace.token, {
      name: branch.name,
      status: 'MERGED_DEVELOP',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'develop\nrelease/08072026\nmain',
      taskIds: [taskA.id, taskB.id, taskC.id],
    })
    const activeLinks = await prisma.taskBranch.findMany({
      where: {
        taskId: { in: [taskA.id, taskB.id, taskC.id] },
        branchId: branch.id,
        active: true,
      },
    })

    assert.equal(addWhileCoding.response.statusCode, 200)
    assert.equal(moveDevelop.response.statusCode, 200)
    assert.equal(addWhileDevelop.response.statusCode, 200)
    assert.equal(activeLinks.length, 3)
    assert.equal((await getTask(taskB.id)).status, 'IN_PROGRESS')
    assert.equal((await getTask(taskC.id)).status, 'IN_PROGRESS')
  })

  test('rejects task link edits after a branch reaches release', async () => {
    const workspace = await setupWorkspace()
    const taskA = await createTask(workspace, 'Task da vao release')
    const taskB = await createTask(workspace, 'Task khong duoc chen vao release')
    const branch = await createBranch(workspace, {
      name: 'feature/OPS-BE-001',
      checkoutSourceBranch: 'main',
      taskIds: [taskA.id],
    })

    await request('POST', `/api/branches/${branch.id}/mark-merged-release`, workspace.token, {
      targetBranch: 'release/08072026',
    })

    const edit = await request<{ message: string }>('PATCH', `/api/branches/${branch.id}`, workspace.token, {
      name: branch.name,
      status: 'MERGED_RELEASE',
      checkoutSourceBranch: 'main',
      intendedMergeTarget: 'develop\nrelease/08072026\nmain',
      taskIds: [taskA.id, taskB.id],
    })
    const rejectedLink = await prisma.taskBranch.findFirst({
      where: {
        taskId: taskB.id,
        branchId: branch.id,
        active: true,
      },
    })

    assert.equal(edit.response.statusCode, 400)
    assert.match(edit.body.message, /dang tien hanh|develop/i)
    assert.equal(rejectedLink, null)
    assert.equal((await getTask(taskB.id)).status, 'PLANNED')
  })
})
