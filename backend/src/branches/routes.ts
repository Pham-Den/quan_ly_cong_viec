import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'
import { branchKanbanDropRule, ensureWorkflowStatuses } from '../workflow/defaults.js'

type BranchRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

type BranchWriteClient = Pick<AppPrismaClient, 'branch' | 'task' | 'taskBranch' | 'branchAlias' | 'timelineEvent'>

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
  status?: unknown
}

type ReorderBody = {
  branchIds?: unknown
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

function uniqueStringList(value: unknown) {
  return Array.from(new Set(stringList(value)))
}

function nullableStringListText(value: unknown) {
  const values = uniqueStringList(value)

  return values.length ? values.join('\n') : null
}

function firstIntendedMergeTarget(value: string | null, fallback: string) {
  const targets = uniqueStringList(value)
  const releaseTarget = targets.find((target) => target.startsWith('release/'))

  return releaseTarget ?? targets[0] ?? fallback
}

function dateToken(date = new Date()) {
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear()),
  ].join('')
}

function todayReleaseName(pattern: string) {
  const token = dateToken()

  return pattern
    .replace('DDMMYYYY', token)
    .replace('DD', token.slice(0, 2))
    .replace('MM', token.slice(2, 4))
    .replace('YYYY', token.slice(4))
}

function branchDateFromToken(value: string) {
  const match = /^(\d{2})(\d{2})(\d{4})$/.exec(value)

  if (!match) {
    return null
  }

  const [, day, month, year] = match
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`)

  return Number.isNaN(date.getTime()) ? null : date
}

function isRuleDrivenBranchType(branchType: string) {
  return branchType === 'FEATURE' || branchType === 'HOTFIX'
}

function isReleaseLifecycleStatus(status: string) {
  return status === 'MERGED_RELEASE' || status === 'MERGED_MAIN'
}

function applyBranchNamePattern(pattern: string, taskCode: string, title: string, date = new Date()) {
  return pattern
    .replaceAll('{jiraCode}', taskCode)
    .replaceAll('{taskCode}', taskCode)
    .replaceAll('{slug}', slug(title) || 'task')
    .replaceAll('{date}', dateToken(date))
}

function materializePlannedTargets(
  value: string,
  repository: {
    developBranch: string
    productionBranch: string
  },
  activeReleaseName: string,
) {
  return uniqueStringList(value).map((target) =>
    target
      .replaceAll('{develop}', repository.developBranch)
      .replaceAll('{activeRelease}', activeReleaseName)
      .replaceAll('{production}', repository.productionBranch)
      .replaceAll('{main}', repository.productionBranch),
  )
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

function releasePatternToRegex(pattern: string) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const source = escaped
    .replaceAll('DDMMYYYY', '\\d{8}')
    .replaceAll('DD', '\\d{2}')
    .replaceAll('MM', '\\d{2}')
    .replaceAll('YYYY', '\\d{4}')

  return new RegExp(`^${source}$`, 'i')
}

function isReleaseBranchName(name: string, pattern: string) {
  return releasePatternToRegex(pattern).test(name) || /^release\/\d{8}$/i.test(name)
}

function checkoutCommand(sourceBranch: string, branchName: string) {
  return [
    'git fetch origin',
    `git checkout ${sourceBranch}`,
    `git pull origin ${sourceBranch}`,
    `git checkout -b ${branchName}`,
  ].join(' && ')
}

function compactBranchName(
  taskCode: string,
  title: string,
  branchType: string,
  repository?: {
    featureNamePattern: string
    hotfixNamePattern: string
  } | null,
) {
  if (branchType === 'HOTFIX') {
    return applyBranchNamePattern(repository?.hotfixNamePattern || 'hotfix/{jiraCode}-{date}', taskCode, title)
  }

  if (branchType === 'FEATURE') {
    return applyBranchNamePattern(repository?.featureNamePattern || 'feature/{jiraCode}', taskCode, title)
  }

  const prefix = branchType === 'BUGFIX' ? 'bugfix' : 'feature'

  return `${prefix}/${taskCode}-${slug(title) || 'task'}`
}

async function activeReleaseCycle(prisma: AppPrismaClient, repositoryId: string) {
  return prisma.releaseCycle.findFirst({
    where: {
      repositoryId,
      status: 'ACTIVE',
    },
    orderBy: { updatedAt: 'desc' },
  })
}

async function ensureReleaseBranchRecord(
  prisma: AppPrismaClient,
  repository: {
    id: string
    projectId: string
    productionBranch: string
  },
  releaseCycle: {
    id: string
    name: string
  },
) {
  const existing = await prisma.branch.findUnique({
    where: {
      repositoryId_name: {
        repositoryId: repository.id,
        name: releaseCycle.name,
      },
    },
  })
  const branchData = {
    branchType: 'RELEASE',
    checkoutSourceBranch: repository.productionBranch,
    baseBranch: repository.productionBranch,
    intendedMergeTarget: repository.productionBranch,
    releaseCycleId: releaseCycle.id,
    generatedCheckoutCommand: checkoutCommand(repository.productionBranch, releaseCycle.name),
  }

  if (existing) {
    if (existing.branchType !== 'RELEASE') {
      throw new Error('RELEASE_BRANCH_NAME_CONFLICT')
    }

    await prisma.branch.update({
      where: { id: existing.id },
      data: {
        ...branchData,
        status: existing.status === 'MERGED_MAIN' ? existing.status : 'MERGED_RELEASE',
      },
    })

    return existing.id
  }

  const branch = await prisma.branch.create({
    data: {
      repositoryId: repository.id,
      name: releaseCycle.name,
      status: 'MERGED_RELEASE',
      sortOrder: await nextBranchSortOrder(prisma, repository.id, 'MERGED_RELEASE'),
      ...branchData,
    },
  })

  await prisma.branch.update({
    where: { id: branch.id },
    data: { lineageId: branch.id },
  })

  return branch.id
}

async function selectReleaseCycleForTarget(
  prisma: AppPrismaClient,
  repository: {
    id: string
    projectId: string
    productionBranch: string
    releaseBranchPattern: string
  },
  targetBranch: string,
  currentBranchId: string,
) {
  const existingTargetBranch = await prisma.branch.findUnique({
    where: {
      repositoryId_name: {
        repositoryId: repository.id,
        name: targetBranch,
      },
    },
  })

  if (existingTargetBranch?.id === currentBranchId) {
    return { error: 'Khong the gan branch vao chinh no.' }
  }

  if (existingTargetBranch && existingTargetBranch.branchType !== 'RELEASE') {
    return { error: 'Branch release phai la branch rieng, khong duoc trung voi feature/hotfix branch.' }
  }

  if (!existingTargetBranch && !isReleaseBranchName(targetBranch, repository.releaseBranchPattern)) {
    return { error: `Ten release branch phai theo pattern ${repository.releaseBranchPattern}.` }
  }

  await prisma.releaseCycle.updateMany({
    where: {
      repositoryId: repository.id,
      status: 'ACTIVE',
      name: { not: targetBranch },
    },
    data: { status: 'CLOSED' },
  })

  const releaseCycle = await prisma.releaseCycle.upsert({
    where: {
      repositoryId_name: {
        repositoryId: repository.id,
        name: targetBranch,
      },
    },
    create: {
      repositoryId: repository.id,
      name: targetBranch,
      status: 'ACTIVE',
      startDate: releaseDateFromName(targetBranch),
      endDate: null,
    },
    update: {
      status: 'ACTIVE',
      endDate: null,
    },
  })
  const releaseBranchId = await ensureReleaseBranchRecord(prisma, repository, releaseCycle)

  return { releaseCycle, releaseBranchId }
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
      releaseCycle: true,
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

async function nextBranchSortOrder(prisma: Pick<AppPrismaClient, 'branch'>, repositoryId: string, status: string) {
  const result = await prisma.branch.aggregate({
    where: {
      repositoryId,
      status,
    },
    _max: {
      sortOrder: true,
    },
  })

  return (result._max.sortOrder ?? 0) + 1
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

async function revertTasksToReleaseAfterMainRollback(
  prisma: Pick<AppPrismaClient, 'task' | 'timelineEvent'>,
  taskIds: string[],
  projectId: string,
  rollbackBranchIds: Set<string>,
  createdById?: string,
) {
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
    if (task.status !== 'DONE' || !task.branchLinks.length) {
      continue
    }

    const linksByLineage = new Map<string, typeof task.branchLinks>()

    for (const link of task.branchLinks) {
      const lineageId = link.lineageId || link.branch.lineageId || link.branchId
      const links = linksByLineage.get(lineageId) ?? []

      links.push(link)
      linksByLineage.set(lineageId, links)
    }

    const allLineagesStillReachedMain = [...linksByLineage.values()].every((links) =>
      links.some(
        (link) =>
          !rollbackBranchIds.has(link.branchId) &&
          (link.branch.status === 'MERGED_MAIN' || Boolean(link.branch.mergedMainAt)),
      ),
    )

    if (!allLineagesStillReachedMain) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'MERGED_RELEASE',
          doneAt: null,
        },
      })
      await prisma.timelineEvent.create({
        data: {
          projectId,
          taskId: task.id,
          createdById,
          eventType: 'TASK_MAIN_ROLLBACK_TO_RELEASE',
          title: `${task.code} quay ve release`,
          description: 'Task duoc dua ve release vi release branch bi keo nguoc tu main.',
          metadataJson: JSON.stringify({
            previousStatus: task.status,
            rollbackBranchIds: [...rollbackBranchIds],
          }),
        },
      })
    }
  }
}

async function rollbackReleaseBranchToRelease(
  prisma: AppPrismaClient,
  branch: {
    id: string
    name: string
    repositoryId: string
    releaseCycleId: string | null
    repository: {
      projectId: string
    }
  },
  createdById?: string,
) {
  const releaseCycle =
    branch.releaseCycleId
      ? await prisma.releaseCycle.findFirst({
          where: {
            id: branch.releaseCycleId,
            repositoryId: branch.repositoryId,
          },
        })
      : await prisma.releaseCycle.findFirst({
          where: {
            repositoryId: branch.repositoryId,
            name: branch.name,
          },
        })

  if (!releaseCycle) {
    throw new Error('MISSING_RELEASE_CYCLE')
  }

  const childBranches = await prisma.branch.findMany({
    where: {
      repositoryId: branch.repositoryId,
      releaseCycleId: releaseCycle.id,
      id: { not: branch.id },
      branchType: { in: ['FEATURE', 'HOTFIX', 'BUGFIX'] },
    },
    include: {
      taskLinks: {
        where: { active: true },
        include: {
          task: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
        },
      },
    },
  })
  const childBranchIds = childBranches.map((childBranch) => childBranch.id)
  const rollbackBranchIds = new Set(childBranchIds)
  const taskIds = childBranches.flatMap((childBranch) => childBranch.taskLinks.map((link) => link.task.id))

  rollbackBranchIds.add(branch.id)

  return prisma.$transaction(async (tx) => {
    const updatedBranch = await tx.branch.update({
      where: { id: branch.id },
      data: {
        status: 'MERGED_RELEASE',
        mergedMainAt: null,
        actualMergedInto: null,
        sortOrder: await nextBranchSortOrder(tx, branch.repositoryId, 'MERGED_RELEASE'),
      },
    })

    await tx.releaseCycle.updateMany({
      where: {
        repositoryId: branch.repositoryId,
        status: 'ACTIVE',
        id: { not: releaseCycle.id },
      },
      data: { status: 'CLOSED' },
    })
    await tx.releaseCycle.update({
      where: { id: releaseCycle.id },
      data: {
        status: 'ACTIVE',
        endDate: null,
      },
    })

    if (childBranchIds.length) {
      await tx.branch.updateMany({
        where: {
          id: { in: childBranchIds },
          status: { not: 'CLOSED' },
        },
        data: {
          status: 'MERGED_RELEASE',
          mergedMainAt: null,
          actualMergedInto: branch.name,
        },
      })
    }

    await tx.timelineEvent.create({
      data: {
        projectId: branch.repository.projectId,
        branchId: branch.id,
        createdById,
        eventType: 'BRANCH_MAIN_ROLLBACK_TO_RELEASE',
        title: `${branch.name} quay ve release`,
        description: `Release ${branch.name} duoc keo nguoc tu main ve release, keo theo ${childBranches.length} branch.`,
        metadataJson: JSON.stringify({
          releaseCycleId: releaseCycle.id,
          revertedBranchIds: childBranchIds,
          source: 'kanban',
        }),
      },
    })

    if (childBranches.length) {
      await tx.timelineEvent.createMany({
        data: childBranches.map((childBranch) => ({
          projectId: branch.repository.projectId,
          branchId: childBranch.id,
          createdById,
          eventType: 'BRANCH_RELEASE_ROLLBACK_FROM_MAIN',
          title: `${childBranch.name} quay ve release`,
          description: `Release ${branch.name} bi keo nguoc tu main ve release.`,
          metadataJson: JSON.stringify({
            releaseBranchId: branch.id,
            releaseBranchName: branch.name,
            releaseCycleId: releaseCycle.id,
          }),
        })),
      })
    }

    await revertTasksToReleaseAfterMainRollback(tx, taskIds, branch.repository.projectId, rollbackBranchIds, createdById)

    return updatedBranch
  })
}

export function registerBranchRoutes(app: FastifyInstance, context: BranchRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.get('/api/branches/name-suggestion', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') || ''
    const taskId = url.searchParams.get('taskId') || ''
    const repositoryId = url.searchParams.get('repositoryId') || ''
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

    const repository = await context.prisma.repository.findFirst({
      where: {
        projectId: project.id,
        ...(repositoryId ? { id: repositoryId } : project.defaultRepoId ? { id: project.defaultRepoId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    })

    return {
      name: compactBranchName(task.code, task.title, branchType, repository),
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
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            defaultBranch: true,
            productionBranch: true,
            releaseBranchPattern: true,
            trustSourceBranch: true,
            developBranch: true,
            featureNamePattern: true,
            hotfixNamePattern: true,
            featurePlannedTargets: true,
            hotfixPlannedTargets: true,
            allowCheckoutSourceOverride: true,
            allowDirectTaskBranchMainMerge: true,
          },
        },
        releaseCycle: true,
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

  app.post('/api/branches/reorder', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const branchIds = stringList(bodyAs<ReorderBody>(request.body).branchIds)
    const uniqueBranchIds = [...new Set(branchIds)]

    if (uniqueBranchIds.length < 2) {
      return { ok: true }
    }

    const branches = await context.prisma.branch.findMany({
      where: {
        id: { in: uniqueBranchIds },
        repository: {
          project: {
            OR: [{ ownerId: userId }, { ownerId: null }],
          },
        },
      },
      select: {
        id: true,
        repositoryId: true,
        status: true,
        releaseCycleId: true,
        branchType: true,
      },
    })

    if (branches.length !== uniqueBranchIds.length) {
      return reply.code(400).send({ message: 'Danh sach branch reorder khong hop le.' })
    }

    const firstBranch = branches[0]
    const sameRepositoryStatus = branches.every(
      (branch) => branch.repositoryId === firstBranch.repositoryId && branch.status === firstBranch.status,
    )
    const releaseChildCycleIds = new Set(
      branches
        .filter((branch) => branch.branchType !== 'RELEASE' && branch.releaseCycleId)
        .map((branch) => branch.releaseCycleId),
    )
    const mixesReleaseChildGroup =
      releaseChildCycleIds.size > 0 &&
      (releaseChildCycleIds.size > 1 ||
        branches.some((branch) => branch.branchType === 'RELEASE' || !branch.releaseCycleId))

    if (!sameRepositoryStatus || mixesReleaseChildGroup) {
      return reply.code(400).send({ message: 'Chi duoc sap xep cac branch trong cung mot nhom hien thi.' })
    }

    await context.prisma.$transaction(
      uniqueBranchIds.map((branchId, index) =>
        context.prisma.branch.update({
          where: { id: branchId },
          data: { sortOrder: index + 1 },
        }),
      ),
    )

    return { ok: true }
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

    const branchType = inferBranchType(name, text(body.branchType))
    const explicitTaskIds = stringList(body.taskIds)
    const linkedTaskCandidates = await taskIdsInProject(context.prisma, explicitTaskIds, repository.projectId)
    const firstTask = linkedTaskCandidates[0] ?? null
    const ruleDrivenBranch = isRuleDrivenBranchType(branchType)
    let releaseCycleForBranch: { id: string; name: string } | null = null

    if (ruleDrivenBranch && !repository.allowCheckoutSourceOverride) {
      const requestedSource = text(body.checkoutSourceBranch) || sourceBranch?.name || repository.trustSourceBranch

      if (requestedSource !== repository.trustSourceBranch || sourceBranch) {
        return reply.code(400).send({
          message: `Branch ${branchType.toLowerCase()} phai checkout tu ${repository.trustSourceBranch}.`,
        })
      }
    }

    if (ruleDrivenBranch) {
      releaseCycleForBranch = await activeReleaseCycle(context.prisma, repository.id)

      if (!releaseCycleForBranch) {
        return reply.code(400).send({ message: 'Chua cau hinh active release branch cho repository.' })
      }

      try {
        await ensureReleaseBranchRecord(context.prisma, repository, releaseCycleForBranch)
      } catch (error) {
        if (error instanceof Error && error.message === 'RELEASE_BRANCH_NAME_CONFLICT') {
          return reply.code(400).send({ message: 'Ten release branch dang duoc dung boi branch khac.' })
        }

        throw error
      }

      if (firstTask) {
        const pattern = branchType === 'HOTFIX' ? repository.hotfixNamePattern : repository.featureNamePattern
        const expectedName = applyBranchNamePattern(pattern, firstTask.code, firstTask.title)

        if (name !== expectedName) {
          return reply.code(400).send({
            message: `Ten branch ${branchType.toLowerCase()} phai theo rule: ${expectedName}.`,
          })
        }
      }
    }

    if (branchType === 'RELEASE') {
      await context.prisma.releaseCycle.updateMany({
        where: {
          repositoryId: repository.id,
          status: 'ACTIVE',
          name: { not: name },
        },
        data: { status: 'CLOSED' },
      })

      releaseCycleForBranch = await context.prisma.releaseCycle.upsert({
        where: {
          repositoryId_name: {
            repositoryId: repository.id,
            name,
          },
        },
        create: {
          repositoryId: repository.id,
          name,
          status: 'ACTIVE',
          startDate: dateOrNull(body.releaseCycleDate),
          endDate: null,
        },
        update: {
          status: 'ACTIVE',
          startDate: dateOrNull(body.releaseCycleDate),
        },
      })
    }

    const checkoutSource =
      branchType === 'RELEASE'
        ? repository.productionBranch
        : ruleDrivenBranch && !repository.allowCheckoutSourceOverride
          ? repository.trustSourceBranch
          : text(body.checkoutSourceBranch) || sourceBranch?.name || repository.defaultBranch
    const intendedMergeTargets = ruleDrivenBranch
      ? materializePlannedTargets(
          branchType === 'HOTFIX' ? repository.hotfixPlannedTargets : repository.featurePlannedTargets,
          repository,
          releaseCycleForBranch?.name ?? todayReleaseName(repository.releaseBranchPattern),
        )
      : uniqueStringList(body.intendedMergeTarget)
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
      const branchStatus = branchType === 'RELEASE' ? 'MERGED_RELEASE' : text(body.status) || 'CODING'
      const branch = await tx.branch.create({
        data: {
          repositoryId: repository.id,
          sourceBranchId: branchType === 'RELEASE' ? null : sourceBranch?.id ?? null,
          name,
          shortName: nullableText(body.shortName),
          branchType,
          status: branchStatus,
          checkoutSourceBranch: checkoutSource,
          intendedMergeTarget: nullableStringListText(intendedMergeTargets),
          actualMergedInto: nullableText(body.actualMergedInto),
          baseBranch: nullableText(body.baseBranch) ?? checkoutSource,
          mergeRequestUrl: nullableText(body.mergeRequestUrl),
          releaseCycleDate: dateOrNull(body.releaseCycleDate) ?? releaseDateFromName(name),
          releaseCycleId: branchType === 'RELEASE' ? releaseCycleForBranch?.id ?? null : null,
          generatedCheckoutCommand,
          remoteCreated,
          sortOrder: await nextBranchSortOrder(tx, repository.id, branchStatus),
        },
      })
      const lineageId = sourceBranch?.lineageId || branch.id

      await tx.branch.update({
        where: { id: branch.id },
        data: { lineageId },
      })

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

    const nextBranchType = inferBranchType(name, text(body.branchType) || branch.branchType)
    const checkoutSource =
      nextBranchType === 'RELEASE'
        ? branch.repository.productionBranch
        : text(body.checkoutSourceBranch) || branch.checkoutSourceBranch || branch.repository.defaultBranch
    const nextStatus = text(body.status) || branch.status

    if (nextBranchType === 'RELEASE') {
      if (!isReleaseLifecycleStatus(nextStatus)) {
        return reply.code(400).send({ message: 'Release branch chi duoc nam o release hoac main.' })
      }

      if (nextStatus !== branch.status) {
        return reply.code(400).send({ message: 'Hay keo release branch vao main hoac dung Merge main de cap nhat dung luong.' })
      }
    }

    if (
      branch.branchType !== 'RELEASE' &&
      branch.releaseCycleId &&
      isReleaseLifecycleStatus(branch.status) &&
      nextStatus !== branch.status
    ) {
      return reply.code(400).send({
        message: 'Nhanh con trong release khong doi trang thai rieng. Hay doi release hoac xoa khi release parent dang o release.',
      })
    }

    const updatedBranch = await context.prisma.branch.update({
      where: { id: branch.id },
      data: {
        name,
        shortName: nullableText(body.shortName),
        branchType: nextBranchType,
        status: nextStatus,
        checkoutSourceBranch: checkoutSource,
        intendedMergeTarget: nullableStringListText(body.intendedMergeTarget),
        actualMergedInto: nullableText(body.actualMergedInto),
        baseBranch: nullableText(body.baseBranch) ?? checkoutSource,
        mergeRequestUrl: nullableText(body.mergeRequestUrl),
        releaseCycleDate: dateOrNull(body.releaseCycleDate) ?? releaseDateFromName(name),
        generatedCheckoutCommand: checkoutCommand(checkoutSource, name),
        ...(nextStatus !== branch.status
          ? { sortOrder: await nextBranchSortOrder(context.prisma, branch.repositoryId, nextStatus) }
          : {}),
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

  app.delete('/api/branches/:branchId', { preHandler: requireAuth }, async (request, reply) => {
    const branch = await ensureBranch(context.prisma, paramsAs(request.params).branchId ?? '', request.authUser?.id ?? '', reply)

    if (!branch) {
      return
    }

    if (branch.status === 'MERGED_MAIN') {
      return reply.code(400).send({
        message: 'Branch da vao main khong the xoa. Neu keo nham, hay dua release parent ve release truoc.',
      })
    }

    if (branch.branchType === 'RELEASE') {
      const releaseCycle =
        branch.releaseCycleId ||
        (
          await context.prisma.releaseCycle.findFirst({
            where: {
              repositoryId: branch.repositoryId,
              name: branch.name,
            },
            select: { id: true },
          })
        )?.id
      const childBranchCount = releaseCycle
        ? await context.prisma.branch.count({
            where: {
              repositoryId: branch.repositoryId,
              releaseCycleId: releaseCycle,
              id: { not: branch.id },
              branchType: { not: 'RELEASE' },
            },
          })
        : 0

      if (childBranchCount > 0) {
        return reply.code(400).send({
          message: 'Release branch dang co nhanh con. Hay xoa hoac doi release cho cac nhanh con truoc.',
        })
      }
    }

    await context.prisma.timelineEvent.create({
      data: {
        projectId: branch.repository.projectId,
        branchId: branch.id,
        createdById: request.authUser?.id,
        eventType: 'BRANCH_DELETED',
        title: `Xoa branch ${branch.name}`,
        description: 'Branch chua vao main duoc xoa khoi app.',
        metadataJson: JSON.stringify({
          branchId: branch.id,
          name: branch.name,
          status: branch.status,
          branchType: branch.branchType,
          releaseCycleId: branch.releaseCycleId,
          taskIds: branch.taskLinks.map((link) => link.task.id),
        }),
      },
    })

    await context.prisma.branch.delete({
      where: { id: branch.id },
    })

    return { ok: true }
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

    if (branch.branchType === 'RELEASE') {
      return reply.code(400).send({ message: 'Release branch chi chuyen main bang thao tac Merge main.' })
    }

    if (branch.releaseCycleId && isReleaseLifecycleStatus(branch.status) && nextStatus !== branch.status) {
      return reply.code(400).send({
        message: 'Nhanh con trong release khong doi trang thai rieng. Hay doi release hoac xoa khi release parent dang o release.',
      })
    }

    const updatedBranch = await context.prisma.branch.update({
      where: { id: branch.id },
      data: {
        status: nextStatus,
        sortOrder: await nextBranchSortOrder(context.prisma, branch.repositoryId, nextStatus),
      },
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

  app.post('/api/branches/:branchId/move-status', { preHandler: requireAuth }, async (request, reply) => {
    const branch = await ensureBranch(context.prisma, paramsAs(request.params).branchId ?? '', request.authUser?.id ?? '', reply)

    if (!branch) {
      return
    }

    const body = bodyAs<MergeBody>(request.body)
    const nextStatus = text(body.status)

    if (!nextStatus) {
      return reply.code(400).send({ message: 'Can chon trang thai branch.' })
    }

    if (branch.status === nextStatus) {
      return branch
    }

    if (branch.branchType !== 'RELEASE' && branch.releaseCycleId && isReleaseLifecycleStatus(branch.status)) {
      return reply.code(400).send({
        message: 'Nhanh con trong release se di theo release branch, khong keo rieng.',
        blocked: true,
      })
    }

    if (branch.branchType === 'RELEASE') {
      if (branch.status === 'MERGED_MAIN' && nextStatus === 'MERGED_RELEASE') {
        try {
          return await rollbackReleaseBranchToRelease(context.prisma, branch, request.authUser?.id)
        } catch (error) {
          if (error instanceof Error && error.message === 'MISSING_RELEASE_CYCLE') {
            return reply.code(400).send({ message: 'Release branch chua gan release cycle.' })
          }

          throw error
        }
      }

      if (nextStatus === 'MERGED_MAIN') {
        return reply.code(400).send({
          message: 'Dung thao tac Merge main de keo release branch vao main.',
          blocked: true,
        })
      }

      return reply.code(400).send({
        message: 'Release branch chi duoc nam o release va sau do vao main.',
        blocked: true,
      })
    }

    if (['MERGED_RELEASE', 'MERGED_MAIN'].includes(nextStatus)) {
      const rule = branchKanbanDropRule(nextStatus)

      return reply.code(400).send({
        message: rule.dropBlockReason ?? 'Trang thai nay can dung action rieng.',
        blocked: true,
      })
    }

    await ensureWorkflowStatuses(context.prisma, branch.repository.projectId)

    const workflowStatus = await context.prisma.workflowStatus.findFirst({
      where: {
        projectId: branch.repository.projectId,
        scope: 'BRANCH',
        key: nextStatus,
        enabled: true,
      },
    })

    if (!workflowStatus) {
      return reply.code(400).send({ message: 'Trang thai branch khong hop le hoac dang tat.' })
    }

    const dropRule = branchKanbanDropRule(nextStatus, workflowStatus)

    if (!dropRule.allowKanbanDrop) {
      return reply.code(400).send({
        message: dropRule.dropBlockReason ?? 'Khong the keo branch vao trang thai nay.',
        blocked: true,
      })
    }

    if (dropRule.requiresConfirmation && body.confirmed !== true) {
      return reply.code(409).send({
        message: 'Can xac nhan truoc khi chuyen branch vao trang thai nay.',
        requiresConfirmation: true,
      })
    }

    const updatedBranch = await context.prisma.branch.update({
      where: { id: branch.id },
      data: {
        status: nextStatus,
        sortOrder: await nextBranchSortOrder(context.prisma, branch.repositoryId, nextStatus),
      },
    })

    await context.prisma.timelineEvent.create({
      data: {
        projectId: branch.repository.projectId,
        branchId: branch.id,
        createdById: request.authUser?.id,
        eventType: 'BRANCH_STATUS_CHANGED',
        title: `Keo branch ${branch.name}`,
        description: `${branch.status} -> ${nextStatus}`,
        metadataJson: JSON.stringify({ from: branch.status, to: nextStatus, source: 'kanban' }),
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

    if (branch.branchType === 'RELEASE') {
      return reply.code(400).send({ message: 'Release branch khong can merge vao release.' })
    }

    if (branch.status === 'MERGED_MAIN') {
      return reply.code(400).send({
        message: 'Branch dang o main nen khong the doi release. Hay keo release parent ve release truoc.',
      })
    }

    const body = bodyAs<MergeBody>(request.body)
    const fallbackReleaseCycle = await activeReleaseCycle(context.prisma, branch.repositoryId)
    const targetBranch = text(body.targetBranch) || fallbackReleaseCycle?.name || ''

    if (!targetBranch) {
      return reply.code(400).send({ message: 'Can chon release branch de merge vao.' })
    }

    const selectedRelease = await selectReleaseCycleForTarget(context.prisma, branch.repository, targetBranch, branch.id)

    if ('error' in selectedRelease) {
      return reply.code(400).send({ message: selectedRelease.error })
    }

    const taskIds = branch.taskLinks.map((link) => link.task.id)
    const { releaseCycle, releaseBranchId } = selectedRelease

    return context.prisma.$transaction(async (tx) => {
      const updatedBranch = await tx.branch.update({
        where: { id: branch.id },
        data: {
          status: 'MERGED_RELEASE',
          mergedReleaseAt: new Date(),
          actualMergedInto: targetBranch,
          releaseCycleId: releaseCycle.id,
          sortOrder: await nextBranchSortOrder(tx, branch.repositoryId, 'MERGED_RELEASE'),
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
              metadataJson: JSON.stringify({
                previousStatus: task.status,
                targetBranch,
                releaseCycleId: releaseCycle.id,
                releaseBranchId,
              }),
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
          metadataJson: JSON.stringify({ targetBranch, releaseCycleId: releaseCycle.id, releaseBranchId }),
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

    if (branch.branchType !== 'RELEASE' && !branch.repository.allowDirectTaskBranchMainMerge) {
      return reply.code(400).send({
        message: 'Hay merge main tren branch release de app cap nhat cac task branch trong release do.',
      })
    }

    if (branch.branchType !== 'RELEASE') {
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
            sortOrder: await nextBranchSortOrder(tx, branch.repositoryId, 'MERGED_MAIN'),
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
            metadataJson: JSON.stringify({ targetBranch, warnings, confirmed: body.confirmed === true, direct: true }),
          },
        })
        await markTaskDoneIfReady(tx, taskIds, branch.repository.projectId)

        return { branch: updatedBranch, warnings }
      })
    }

    const releaseCycle =
      branch.releaseCycleId
        ? await context.prisma.releaseCycle.findFirst({
            where: {
              id: branch.releaseCycleId,
              repositoryId: branch.repositoryId,
            },
          })
        : await context.prisma.releaseCycle.findFirst({
            where: {
              repositoryId: branch.repositoryId,
              name: branch.name,
            },
          })

    if (!releaseCycle) {
      return reply.code(400).send({ message: 'Release branch chua gan release cycle.' })
    }

    const childBranches = await context.prisma.branch.findMany({
      where: {
        repositoryId: branch.repositoryId,
        releaseCycleId: releaseCycle.id,
        id: { not: branch.id },
        branchType: { in: ['FEATURE', 'HOTFIX', 'BUGFIX'] },
      },
      include: {
        taskLinks: {
          where: { active: true },
          include: {
            task: {
              select: {
                id: true,
                code: true,
                status: true,
                releaseReadyAt: true,
              },
            },
          },
        },
      },
    })
    const taskIds = childBranches.flatMap((childBranch) => childBranch.taskLinks.map((link) => link.task.id))
    const warnings = childBranches
      .flatMap((childBranch) => childBranch.taskLinks)
      .filter((link) => !link.task.releaseReadyAt && link.task.status !== 'DONE')
      .map((link) => `${link.task.code} chua duoc danh dau san sang main.`)

    return context.prisma.$transaction(async (tx) => {
      const updatedBranch = await tx.branch.update({
        where: { id: branch.id },
        data: {
          status: 'MERGED_MAIN',
          mergedMainAt: new Date(),
          actualMergedInto: targetBranch,
          sortOrder: await nextBranchSortOrder(tx, branch.repositoryId, 'MERGED_MAIN'),
        },
      })

      await tx.releaseCycle.update({
        where: { id: releaseCycle.id },
        data: {
          status: 'CLOSED',
          endDate: new Date(),
        },
      })

      await tx.branch.updateMany({
        where: {
          id: { in: childBranches.map((childBranch) => childBranch.id) },
          status: { not: 'CLOSED' },
        },
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
          description: `Release ${branch.name} merged vao ${targetBranch}, keo theo ${childBranches.length} branch.`,
          metadataJson: JSON.stringify({
            targetBranch,
            warnings,
            confirmed: body.confirmed === true,
            releaseCycleId: releaseCycle.id,
            propagatedBranchIds: childBranches.map((childBranch) => childBranch.id),
          }),
        },
      })

      if (childBranches.length) {
        await tx.timelineEvent.createMany({
          data: childBranches.map((childBranch) => ({
            projectId: branch.repository.projectId,
            branchId: childBranch.id,
            createdById: request.authUser?.id,
            eventType: 'BRANCH_MAIN_PROPAGATED_FROM_RELEASE',
            title: `${childBranch.name} da vao main qua ${branch.name}`,
            description: `Release ${branch.name} merged vao ${targetBranch}.`,
            metadataJson: JSON.stringify({
              releaseBranchId: branch.id,
              releaseBranchName: branch.name,
              targetBranch,
              releaseCycleId: releaseCycle.id,
            }),
          })),
        })
      }

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
