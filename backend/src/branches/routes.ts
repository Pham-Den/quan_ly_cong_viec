import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'

type BranchRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

type BranchWriteClient = Pick<AppPrismaClient, 'task' | 'taskBranch' | 'branchAlias' | 'timelineEvent'>

type Params = {
  branchId?: string
  aliasId?: string
  taskId?: string
}

type BranchBody = {
  projectId?: unknown
  repositoryId?: unknown
  sourceBranchId?: unknown
  name?: unknown
  shortName?: unknown
  branchType?: unknown
  status?: unknown
  checkoutSourceBranch?: unknown
  intendedMergeTarget?: unknown
  actualMergedInto?: unknown
  baseBranch?: unknown
  mergeRequestUrl?: unknown
  releaseCycleDate?: unknown
  aliases?: unknown
  taskIds?: unknown
  inheritTaskLinks?: unknown
  completionRequired?: unknown
  createRemote?: unknown
}

type MergeBody = {
  targetBranch?: unknown
  confirmed?: unknown
}

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

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean)
  }

  return text(value)
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

function dateOrNull(value: unknown) {
  const nextValue = text(value)

  if (!nextValue) {
    return null
  }

  const date = new Date(nextValue)

  return Number.isNaN(date.getTime()) ? null : date
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function inferBranchType(name: string, fallback: string) {
  if (/^release\/\d{8}$/i.test(name)) {
    return 'RELEASE'
  }

  if (name.startsWith('hotfix/')) {
    return 'HOTFIX'
  }

  if (name.startsWith('bugfix/')) {
    return 'BUGFIX'
  }

  return fallback || 'FEATURE'
}

function releaseDateFromName(name: string) {
  const match = /^release\/(\d{2})(\d{2})(\d{4})$/i.exec(name)

  if (!match) {
    return null
  }

  const [, day, month, year] = match
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`)

  return Number.isNaN(date.getTime()) ? null : date
}

function checkoutCommand(sourceBranch: string, branchName: string) {
  return [
    'git fetch origin',
    `git checkout ${sourceBranch}`,
    `git pull origin ${sourceBranch}`,
    `git checkout -b ${branchName}`,
  ].join(' && ')
}

function compactBranchName(taskCode: string, title: string, branchType: string) {
  const prefix = branchType === 'HOTFIX' ? 'hotfix' : branchType === 'BUGFIX' ? 'bugfix' : 'feature'

  return `${prefix}/${taskCode}-${slug(title) || 'task'}`
}

async function createRemoteGitLabBranch(
  repository: {
    gitlabUrl: string | null
    gitlabProjectId: string | null
    gitlabProjectPath: string | null
    gitlabAccessToken: string | null
  },
  branchName: string,
  sourceBranch: string,
) {
  if (!repository.gitlabUrl || !repository.gitlabAccessToken) {
    throw new Error('MISSING_GITLAB_CONFIG')
  }

  const projectRef = repository.gitlabProjectId || repository.gitlabProjectPath

  if (!projectRef) {
    throw new Error('MISSING_GITLAB_PROJECT')
  }

  const url = new URL(
    `/api/v4/projects/${encodeURIComponent(projectRef)}/repository/branches`,
    repository.gitlabUrl.replace(/\/$/, ''),
  )
  const body = new URLSearchParams({
    branch: branchName,
    ref: sourceBranch,
  })
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': repository.gitlabAccessToken,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
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

async function ensureRepository(
  prisma: AppPrismaClient,
  repositoryId: string,
  userId: string,
  reply: FastifyReply,
) {
  const repository = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      project: {
        OR: [{ ownerId: userId }, { ownerId: null }],
      },
    },
    include: {
      project: true,
    },
  })

  if (!repository) {
    reply.code(404).send({ message: 'Khong tim thay repository.' })
    return null
  }

  return repository
}

async function ensureBranch(prisma: AppPrismaClient, branchId: string, userId: string, reply: FastifyReply) {
  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      repository: {
        project: {
          OR: [{ ownerId: userId }, { ownerId: null }],
        },
      },
    },
    include: {
      repository: {
        include: {
          project: true,
        },
      },
      sourceBranch: true,
      aliases: true,
      taskLinks: {
        where: { active: true },
        include: {
          task: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
              releaseReadyAt: true,
            },
          },
        },
      },
      timelineEvents: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!branch) {
    reply.code(404).send({ message: 'Khong tim thay branch.' })
    return null
  }

  return branch
}

async function taskIdsInProject(prisma: BranchWriteClient, taskIds: string[], projectId: string) {
  if (!taskIds.length) {
    return []
  }

  const tasks = await prisma.task.findMany({
    where: {
      id: { in: taskIds },
      projectId,
    },
    select: {
      id: true,
      code: true,
      title: true,
    },
  })

  return tasks
}

async function createBranchLinks(
  prisma: BranchWriteClient,
  branchId: string,
  taskIds: string[],
  projectId: string,
  role: string,
  lineageId: string,
  inheritedFromBranchId: string | null,
  completionRequired: boolean,
) {
  const tasks = await taskIdsInProject(prisma, taskIds, projectId)

  await prisma.taskBranch.createMany({
    data: tasks.map((task) => ({
      branchId,
      taskId: task.id,
      inheritedFromBranchId,
      role,
      lineageId,
      completionRequired,
    })),
  })

  return tasks
}

async function syncBranchAliases(prisma: BranchWriteClient, branchId: string, aliases: string[]) {
  await prisma.branchAlias.deleteMany({ where: { branchId } })

  if (!aliases.length) {
    return
  }

  await prisma.branchAlias.createMany({
    data: [...new Set(aliases)].map((alias) => ({ branchId, alias })),
  })
}

async function markTaskDoneIfReady(prisma: BranchWriteClient, taskIds: string[], projectId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      id: { in: [...new Set(taskIds)] },
      projectId,
    },
    include: {
      branchLinks: {
        where: {
          active: true,
          completionRequired: true,
        },
        include: {
          branch: true,
        },
      },
    },
  })

  for (const task of tasks) {
    if (['DONE', 'CANCELLED'].includes(task.status) || !task.branchLinks.length) {
      continue
    }

    const linksByLineage = new Map<string, typeof task.branchLinks>()

    for (const link of task.branchLinks) {
      const lineageId = link.lineageId || link.branch.lineageId || link.branchId
      const links = linksByLineage.get(lineageId) ?? []

      links.push(link)
      linksByLineage.set(lineageId, links)
    }

    const allLineagesReachedMain = [...linksByLineage.values()].every((links) =>
      links.some((link) => link.branch.status === 'MERGED_MAIN' || Boolean(link.branch.mergedMainAt)),
    )

    if (allLineagesReachedMain) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'DONE',
          doneAt: new Date(),
        },
      })
      await prisma.timelineEvent.create({
        data: {
          projectId,
          taskId: task.id,
          eventType: 'TASK_DONE_BY_MAIN_MERGE',
          title: `Hoan tat ${task.code}`,
          description: 'Task duoc danh dau done vi branch lien quan da merge vao main.',
          metadataJson: JSON.stringify({ previousStatus: task.status }),
        },
      })
    }
  }
}

export function registerBranchRoutes(app: FastifyInstance, context: BranchRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.get('/api/branches/name-suggestion', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') || ''
    const taskId = url.searchParams.get('taskId') || ''
    const branchType = url.searchParams.get('branchType') || 'FEATURE'
    const project = await ensureProject(context.prisma, projectId, userId, reply)

    if (!project) {
      return
    }

    const task = await context.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId: project.id,
      },
    })

    if (!task) {
      return reply.code(404).send({ message: 'Khong tim thay task.' })
    }

    return {
      name: compactBranchName(task.code, task.title, branchType),
    }
  })

  app.get('/api/branches', { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') || undefined
    const repositoryId = url.searchParams.get('repositoryId') || undefined
    const status = url.searchParams.get('status') || undefined
    const taskId = url.searchParams.get('taskId') || undefined
    const query = url.searchParams.get('q')?.trim() || undefined

    return context.prisma.branch.findMany({
      where: {
        ...(repositoryId ? { repositoryId } : {}),
        ...(status ? { status } : {}),
        ...(taskId ? { taskLinks: { some: { taskId, active: true } } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { shortName: { contains: query } },
                { aliases: { some: { alias: { contains: query } } } },
                { taskLinks: { some: { task: { code: { contains: query } } } } },
              ],
            }
          : {}),
        repository: {
          ...(projectId ? { projectId } : {}),
          project: {
            OR: [{ ownerId: userId }, { ownerId: null }],
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            defaultBranch: true,
            productionBranch: true,
            releaseBranchPattern: true,
          },
        },
        sourceBranch: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        aliases: true,
        taskLinks: {
          where: { active: true },
          include: {
            task: {
              select: {
                id: true,
                code: true,
                title: true,
                status: true,
                releaseReadyAt: true,
              },
            },
          },
        },
      },
    })
  })

  app.get('/api/branches/:branchId', { preHandler: requireAuth }, async (request, reply) => {
    return ensureBranch(context.prisma, paramsAs(request.params).branchId ?? '', request.authUser?.id ?? '', reply)
  })

  app.post('/api/branches', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<BranchBody>(request.body)
    const userId = request.authUser?.id ?? ''
    const repositoryId = text(body.repositoryId)
    const name = text(body.name)

    if (!repositoryId || !name) {
      return reply.code(400).send({ message: 'Can chon repository va nhap ten branch.' })
    }

    const repository = await ensureRepository(context.prisma, repositoryId, userId, reply)

    if (!repository) {
      return
    }

    const exists = await context.prisma.branch.findUnique({
      where: { repositoryId_name: { repositoryId: repository.id, name } },
    })

    if (exists) {
      return reply.code(409).send({ message: 'Branch da ton tai trong repository.' })
    }

    const sourceBranchId = nullableText(body.sourceBranchId)
    const sourceBranch = sourceBranchId
      ? await context.prisma.branch.findFirst({
          where: {
            id: sourceBranchId,
            repositoryId: repository.id,
          },
          include: {
            taskLinks: {
              where: { active: true },
            },
          },
        })
      : null

    if (sourceBranchId && !sourceBranch) {
      return reply.code(400).send({ message: 'Branch nguon khong thuoc repository da chon.' })
    }

    const checkoutSource = text(body.checkoutSourceBranch) || sourceBranch?.name || repository.defaultBranch
    const branchType = inferBranchType(name, text(body.branchType))
    const generatedCheckoutCommand = checkoutCommand(checkoutSource, name)
    let remoteCreated = false

    if (body.createRemote === true) {
      try {
        await createRemoteGitLabBranch(repository, name, checkoutSource)
        remoteCreated = true
      } catch (error) {
        return reply.code(400).send({
          message: error instanceof Error ? `Khong the tao branch tren GitLab: ${error.message}` : 'Khong the tao branch tren GitLab.',
        })
      }
    }

    return context.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          repositoryId: repository.id,
          sourceBranchId: sourceBranch?.id ?? null,
          name,
          shortName: nullableText(body.shortName),
          branchType,
          status: text(body.status) || 'DRAFT',
          checkoutSourceBranch: checkoutSource,
          intendedMergeTarget: nullableText(body.intendedMergeTarget),
          actualMergedInto: nullableText(body.actualMergedInto),
          baseBranch: nullableText(body.baseBranch) ?? checkoutSource,
          mergeRequestUrl: nullableText(body.mergeRequestUrl),
          releaseCycleDate: dateOrNull(body.releaseCycleDate) ?? releaseDateFromName(name),
          generatedCheckoutCommand,
          remoteCreated,
        },
      })
      const lineageId = sourceBranch?.lineageId || branch.id

      await tx.branch.update({
        where: { id: branch.id },
        data: { lineageId },
      })

      const explicitTaskIds = stringList(body.taskIds)
      const linkedTasks = await createBranchLinks(
        tx,
        branch.id,
        explicitTaskIds,
        repository.projectId,
        'PRIMARY',
        lineageId,
        null,
        body.completionRequired !== false,
      )

      if (sourceBranch && body.inheritTaskLinks === true) {
        const inheritedTaskIds = sourceBranch.taskLinks
          .filter((link) => !explicitTaskIds.includes(link.taskId))
          .map((link) => link.taskId)

        await createBranchLinks(
          tx,
          branch.id,
          inheritedTaskIds,
          repository.projectId,
          'CARRIED_FROM_SOURCE',
          lineageId,
          sourceBranch.id,
          true,
        )
      }

      await syncBranchAliases(tx, branch.id, stringList(body.aliases))
      await tx.timelineEvent.create({
        data: {
          projectId: repository.projectId,
          branchId: branch.id,
          createdById: request.authUser?.id,
          eventType: 'BRANCH_CREATED',
          title: `Tao branch ${name}`,
          description: `Checkout tu ${checkoutSource}${linkedTasks.length ? `, link ${linkedTasks.length} task.` : '.'}`,
          metadataJson: JSON.stringify({ sourceBranchId: sourceBranch?.id ?? null, remoteCreated }),
        },
      })

      return tx.branch.findUnique({
        where: { id: branch.id },
        include: {
          repository: true,
          sourceBranch: true,
          aliases: true,
          taskLinks: {
            where: { active: true },
            include: { task: true },
          },
        },
      })
    })
  })

  app.patch('/api/branches/:branchId', { preHandler: requireAuth }, async (request, reply) => {
    const branch = await ensureBranch(context.prisma, paramsAs(request.params).branchId ?? '', request.authUser?.id ?? '', reply)

    if (!branch) {
      return
    }

    const body = bodyAs<BranchBody>(request.body)
    const name = text(body.name)

    if (!name) {
      return reply.code(400).send({ message: 'Can nhap ten branch.' })
    }

    const duplicate = await context.prisma.branch.findFirst({
      where: {
        repositoryId: branch.repositoryId,
        name,
        id: { not: branch.id },
      },
    })

    if (duplicate) {
      return reply.code(409).send({ message: 'Branch da ton tai trong repository.' })
    }

    const checkoutSource = text(body.checkoutSourceBranch) || branch.checkoutSourceBranch || branch.repository.defaultBranch
    const nextStatus = text(body.status) || branch.status
    const updatedBranch = await context.prisma.branch.update({
      where: { id: branch.id },
      data: {
        name,
        shortName: nullableText(body.shortName),
        branchType: inferBranchType(name, text(body.branchType) || branch.branchType),
        status: nextStatus,
        checkoutSourceBranch: checkoutSource,
        intendedMergeTarget: nullableText(body.intendedMergeTarget),
        actualMergedInto: nullableText(body.actualMergedInto),
        baseBranch: nullableText(body.baseBranch) ?? checkoutSource,
        mergeRequestUrl: nullableText(body.mergeRequestUrl),
        releaseCycleDate: dateOrNull(body.releaseCycleDate) ?? releaseDateFromName(name),
        generatedCheckoutCommand: checkoutCommand(checkoutSource, name),
      },
    })

    await syncBranchAliases(context.prisma, branch.id, stringList(body.aliases))

    if (nextStatus !== branch.status) {
      await context.prisma.timelineEvent.create({
        data: {
          projectId: branch.repository.projectId,
          branchId: branch.id,
          createdById: request.authUser?.id,
          eventType: 'BRANCH_STATUS_CHANGED',
          title: `Doi trang thai branch ${branch.name}`,
          description: `${branch.status} -> ${nextStatus}`,
          metadataJson: JSON.stringify({ from: branch.status, to: nextStatus }),
        },
      })
    }

    return updatedBranch
  })

  app.post('/api/branches/:branchId/link-task', { preHandler: requireAuth }, async (request, reply) => {
    const branch = await ensureBranch(context.prisma, paramsAs(request.params).branchId ?? '', request.authUser?.id ?? '', reply)

    if (!branch) {
      return
    }

    const body = bodyAs<BranchBody>(request.body)
    const taskId = text(body.taskIds)

    if (!taskId) {
      return reply.code(400).send({ message: 'Can chon task de link.' })
    }

    await createBranchLinks(
      context.prisma,
      branch.id,
      [taskId],
      branch.repository.projectId,
      'PRIMARY',
      branch.lineageId || branch.id,
      null,
      body.completionRequired !== false,
    )
    await context.prisma.timelineEvent.create({
      data: {
        projectId: branch.repository.projectId,
        branchId: branch.id,
        taskId,
        createdById: request.authUser?.id,
        eventType: 'TASK_BRANCH_LINKED',
        title: `Link task vao ${branch.name}`,
        metadataJson: JSON.stringify({ branchId: branch.id, taskId }),
      },
    })

    return { ok: true }
  })

  app.delete('/api/branches/:branchId/link-task/:taskId', { preHandler: requireAuth }, async (request, reply) => {
    const params = paramsAs(request.params)
    const branch = await ensureBranch(context.prisma, params.branchId ?? '', request.authUser?.id ?? '', reply)

    if (!branch) {
      return
    }

    await context.prisma.taskBranch.updateMany({
      where: {
        branchId: branch.id,
        taskId: params.taskId ?? '',
      },
      data: { active: false },
    })

    return { ok: true }
  })

  app.post('/api/branches/:branchId/status', { preHandler: requireAuth }, async (request, reply) => {
    const branch = await ensureBranch(context.prisma, paramsAs(request.params).branchId ?? '', request.authUser?.id ?? '', reply)

    if (!branch) {
      return
    }

    const nextStatus = text(bodyAs<BranchBody>(request.body).status)

    if (!nextStatus) {
      return reply.code(400).send({ message: 'Can chon trang thai branch.' })
    }

    const updatedBranch = await context.prisma.branch.update({
      where: { id: branch.id },
      data: { status: nextStatus },
    })

    await context.prisma.timelineEvent.create({
      data: {
        projectId: branch.repository.projectId,
        branchId: branch.id,
        createdById: request.authUser?.id,
        eventType: 'BRANCH_STATUS_CHANGED',
        title: `Doi trang thai branch ${branch.name}`,
        description: `${branch.status} -> ${nextStatus}`,
        metadataJson: JSON.stringify({ from: branch.status, to: nextStatus }),
      },
    })

    return updatedBranch
  })

  app.post('/api/branches/:branchId/mark-merged-release', { preHandler: requireAuth }, async (request, reply) => {
    const branch = await ensureBranch(context.prisma, paramsAs(request.params).branchId ?? '', request.authUser?.id ?? '', reply)

    if (!branch) {
      return
    }

    if (branch.status === 'CLOSED') {
      return reply.code(400).send({ message: 'Branch da dong khong the merge release.' })
    }

    const body = bodyAs<MergeBody>(request.body)
    const targetBranch = text(body.targetBranch) || branch.intendedMergeTarget || branch.repository.releaseBranchPattern
    const taskIds = branch.taskLinks.map((link) => link.task.id)

    return context.prisma.$transaction(async (tx) => {
      const updatedBranch = await tx.branch.update({
        where: { id: branch.id },
        data: {
          status: 'MERGED_RELEASE',
          mergedReleaseAt: new Date(),
          actualMergedInto: targetBranch,
        },
      })

      for (const taskId of taskIds) {
        const task = await tx.task.findUnique({ where: { id: taskId } })

        if (task && !['DONE', 'CANCELLED', 'READY_PROD'].includes(task.status)) {
          await tx.task.update({
            where: { id: task.id },
            data: { status: 'MERGED_RELEASE' },
          })
          await tx.timelineEvent.create({
            data: {
              projectId: branch.repository.projectId,
              taskId: task.id,
              branchId: branch.id,
              createdById: request.authUser?.id,
              eventType: 'TASK_MERGED_RELEASE',
              title: `${task.code} da vao release`,
              description: `${branch.name} merged vao ${targetBranch}.`,
              metadataJson: JSON.stringify({ previousStatus: task.status, targetBranch }),
            },
          })
        }
      }

      await tx.timelineEvent.create({
        data: {
          projectId: branch.repository.projectId,
          branchId: branch.id,
          createdById: request.authUser?.id,
          eventType: 'BRANCH_MERGED_RELEASE',
          title: `${branch.name} merged vao release`,
          description: `Merged vao ${targetBranch}.`,
          metadataJson: JSON.stringify({ targetBranch }),
        },
      })

      return updatedBranch
    })
  })

  app.post('/api/branches/:branchId/mark-merged-main', { preHandler: requireAuth }, async (request, reply) => {
    const branch = await ensureBranch(context.prisma, paramsAs(request.params).branchId ?? '', request.authUser?.id ?? '', reply)

    if (!branch) {
      return
    }

    if (branch.status === 'CLOSED') {
      return reply.code(400).send({ message: 'Branch da dong khong the merge main.' })
    }

    const body = bodyAs<MergeBody>(request.body)
    const targetBranch = text(body.targetBranch) || branch.repository.productionBranch
    const taskIds = branch.taskLinks.map((link) => link.task.id)
    const warnings = branch.taskLinks
      .filter((link) => !link.task.releaseReadyAt && link.task.status !== 'DONE')
      .map((link) => `${link.task.code} chua duoc danh dau san sang main.`)

    return context.prisma.$transaction(async (tx) => {
      const updatedBranch = await tx.branch.update({
        where: { id: branch.id },
        data: {
          status: 'MERGED_MAIN',
          mergedMainAt: new Date(),
          actualMergedInto: targetBranch,
        },
      })

      await tx.timelineEvent.create({
        data: {
          projectId: branch.repository.projectId,
          branchId: branch.id,
          createdById: request.authUser?.id,
          eventType: 'BRANCH_MERGED_MAIN',
          title: `${branch.name} merged vao main`,
          description: `Merged vao ${targetBranch}.`,
          metadataJson: JSON.stringify({ targetBranch, warnings, confirmed: body.confirmed === true }),
        },
      })
      await markTaskDoneIfReady(tx, taskIds, branch.repository.projectId)

      return { branch: updatedBranch, warnings }
    })
  })

  app.post('/api/branches/:branchId/record-merged-into', { preHandler: requireAuth }, async (request, reply) => {
    const branch = await ensureBranch(context.prisma, paramsAs(request.params).branchId ?? '', request.authUser?.id ?? '', reply)

    if (!branch) {
      return
    }

    const targetBranch = text(bodyAs<MergeBody>(request.body).targetBranch)

    if (!targetBranch) {
      return reply.code(400).send({ message: 'Can nhap branch da merge vao.' })
    }

    const updatedBranch = await context.prisma.branch.update({
      where: { id: branch.id },
      data: { actualMergedInto: targetBranch },
    })

    await context.prisma.timelineEvent.create({
      data: {
        projectId: branch.repository.projectId,
        branchId: branch.id,
        createdById: request.authUser?.id,
        eventType: 'BRANCH_MERGED_INTO_RECORDED',
        title: `Ghi nhan ${branch.name} merged vao ${targetBranch}`,
        metadataJson: JSON.stringify({ targetBranch }),
      },
    })

    return updatedBranch
  })
}
