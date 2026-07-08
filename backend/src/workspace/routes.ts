import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'
import { ensureWorkflowStatuses } from '../workflow/defaults.js'

type WorkspaceRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

type Params = {
  projectId?: string
  taskGroupId?: string
  repositoryId?: string
}

type ProjectBody = {
  code?: unknown
  name?: unknown
  description?: unknown
}

type TaskGroupBody = ProjectBody & {
  enabled?: unknown
}

type RepositoryBody = {
  name?: unknown
  provider?: unknown
  gitlabUrl?: unknown
  gitlabProjectId?: unknown
  gitlabProjectPath?: unknown
  gitlabAccessToken?: unknown
  clearGitlabAccessToken?: unknown
  defaultBranch?: unknown
  productionBranch?: unknown
  releaseBranchPattern?: unknown
  trustSourceBranch?: unknown
  developBranch?: unknown
  featureNamePattern?: unknown
  hotfixNamePattern?: unknown
  featurePlannedTargets?: unknown
  hotfixPlannedTargets?: unknown
  allowCheckoutSourceOverride?: unknown
  allowDirectTaskBranchMainMerge?: unknown
  activeReleaseBranchName?: unknown
  activeReleaseStartDate?: unknown
  activeReleaseEndDate?: unknown
  makeDefault?: unknown
}

function bodyAs<T>(body: unknown) {
  return body && typeof body === 'object' ? (body as T) : ({} as T)
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function nullableText(value: unknown) {
  const nextValue = text(value)

  return nextValue || null
}

function dateOrNull(value: unknown) {
  const nextValue = text(value)

  if (!nextValue) {
    return null
  }

  const date = new Date(nextValue)

  return Number.isNaN(date.getTime()) ? null : date
}

function code(value: unknown) {
  return text(value).toUpperCase().replace(/[^A-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function paramsAs(requestParams: unknown) {
  return bodyAs<Params>(requestParams)
}

function publicRepository(repository: {
  id: string
  projectId: string
  name: string
  provider: string
  gitlabUrl: string | null
  gitlabProjectId: string | null
  gitlabProjectPath: string | null
  gitlabAccessToken: string | null
  defaultBranch: string
  productionBranch: string
  releaseBranchPattern: string
  trustSourceBranch: string
  developBranch: string
  featureNamePattern: string
  hotfixNamePattern: string
  featurePlannedTargets: string
  hotfixPlannedTargets: string
  allowCheckoutSourceOverride: boolean
  allowDirectTaskBranchMainMerge: boolean
  createdAt: Date
  updatedAt: Date
  releaseCycles?: Array<{
    id: string
    name: string
    status: string
    startDate: Date | null
    endDate: Date | null
  }>
}) {
  const activeReleaseCycle = repository.releaseCycles?.[0] ?? null

  return {
    id: repository.id,
    projectId: repository.projectId,
    name: repository.name,
    provider: repository.provider,
    gitlabUrl: repository.gitlabUrl,
    gitlabProjectId: repository.gitlabProjectId,
    gitlabProjectPath: repository.gitlabProjectPath,
    hasGitlabAccessToken: Boolean(repository.gitlabAccessToken),
    defaultBranch: repository.defaultBranch,
    productionBranch: repository.productionBranch,
    releaseBranchPattern: repository.releaseBranchPattern,
    trustSourceBranch: repository.trustSourceBranch,
    developBranch: repository.developBranch,
    featureNamePattern: repository.featureNamePattern,
    hotfixNamePattern: repository.hotfixNamePattern,
    featurePlannedTargets: repository.featurePlannedTargets,
    hotfixPlannedTargets: repository.hotfixPlannedTargets,
    allowCheckoutSourceOverride: repository.allowCheckoutSourceOverride,
    allowDirectTaskBranchMainMerge: repository.allowDirectTaskBranchMainMerge,
    activeReleaseCycle,
    createdAt: repository.createdAt,
    updatedAt: repository.updatedAt,
  }
}

function todayReleaseName(pattern: string) {
  const date = new Date()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())

  return pattern.replace('DD', day).replace('MM', month).replace('YYYY', year)
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
  const existingBranch = await prisma.branch.findUnique({
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
    releaseCycleDate: dateOrNull(releaseCycle.name.replace(/^release\//, '')),
    generatedCheckoutCommand: `git fetch origin && git checkout ${repository.productionBranch} && git pull origin ${repository.productionBranch} && git checkout -b ${releaseCycle.name}`,
  }

  if (existingBranch) {
    if (existingBranch.branchType !== 'RELEASE') {
      throw new Error('RELEASE_BRANCH_NAME_CONFLICT')
    }

    await prisma.branch.update({
      where: { id: existingBranch.id },
      data: {
        ...branchData,
        status: existingBranch.status === 'MERGED_MAIN' ? existingBranch.status : 'MERGED_RELEASE',
      },
    })
    return
  }

  const branch = await prisma.branch.create({
    data: {
      repositoryId: repository.id,
      name: releaseCycle.name,
      status: 'MERGED_RELEASE',
      ...branchData,
    },
  })

  await prisma.branch.update({
    where: { id: branch.id },
    data: { lineageId: branch.id },
  })
}

async function setActiveReleaseCycle(
  prisma: AppPrismaClient,
  repository: {
    id: string
    projectId: string
    releaseBranchPattern: string
    productionBranch: string
  },
  body: RepositoryBody,
) {
  const releaseBranchName = text(body.activeReleaseBranchName) || todayReleaseName(repository.releaseBranchPattern)

  await prisma.releaseCycle.updateMany({
    where: {
      repositoryId: repository.id,
      status: 'ACTIVE',
      name: { not: releaseBranchName },
    },
    data: { status: 'CLOSED' },
  })

  const releaseCycle = await prisma.releaseCycle.upsert({
    where: {
      repositoryId_name: {
        repositoryId: repository.id,
        name: releaseBranchName,
      },
    },
    create: {
      repositoryId: repository.id,
      name: releaseBranchName,
      status: 'ACTIVE',
      startDate: dateOrNull(body.activeReleaseStartDate),
      endDate: dateOrNull(body.activeReleaseEndDate),
    },
    update: {
      status: 'ACTIVE',
      startDate: dateOrNull(body.activeReleaseStartDate),
      endDate: dateOrNull(body.activeReleaseEndDate),
    },
  })

  await ensureReleaseBranchRecord(prisma, repository, releaseCycle)

  return releaseCycle
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

export function registerWorkspaceRoutes(app: FastifyInstance, context: WorkspaceRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.get('/api/projects', { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser?.id ?? ''

    return context.prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { ownerId: null }],
      },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        _count: {
          select: {
            taskGroups: true,
            repositories: true,
            tasks: true,
          },
        },
      },
    })
  })

  app.post('/api/projects', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<ProjectBody>(request.body)
    const nextCode = code(body.code)
    const name = text(body.name)

    if (!nextCode || !name) {
      return reply.code(400).send({ message: 'Can nhap ma va ten du an.' })
    }

    const exists = await context.prisma.project.findUnique({ where: { code: nextCode } })

    if (exists) {
      return reply.code(409).send({ message: 'Ma du an da ton tai.' })
    }

    const project = await context.prisma.project.create({
      data: {
        ownerId: request.authUser?.id,
        code: nextCode,
        name,
        description: nullableText(body.description),
      },
    })

    await ensureWorkflowStatuses(context.prisma, project.id)

    return project
  })

  app.patch('/api/projects/:projectId', { preHandler: requireAuth }, async (request, reply) => {
    const projectId = paramsAs(request.params).projectId ?? ''
    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    const body = bodyAs<ProjectBody>(request.body)
    const nextCode = code(body.code)
    const name = text(body.name)

    if (!nextCode || !name) {
      return reply.code(400).send({ message: 'Can nhap ma va ten du an.' })
    }

    const duplicate = await context.prisma.project.findFirst({
      where: {
        code: nextCode,
        id: { not: project.id },
      },
    })

    if (duplicate) {
      return reply.code(409).send({ message: 'Ma du an da ton tai.' })
    }

    return context.prisma.project.update({
      where: { id: project.id },
      data: {
        code: nextCode,
        name,
        description: nullableText(body.description),
      },
    })
  })

  app.delete('/api/projects/:projectId', { preHandler: requireAuth }, async (request, reply) => {
    const projectId = paramsAs(request.params).projectId ?? ''
    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    await context.prisma.project.update({
      where: { id: project.id },
      data: { defaultRepoId: null },
    })
    await context.prisma.project.delete({ where: { id: project.id } })

    return { ok: true }
  })

  app.get('/api/projects/:projectId/task-groups', { preHandler: requireAuth }, async (request, reply) => {
    const projectId = paramsAs(request.params).projectId ?? ''
    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    return context.prisma.taskGroup.findMany({
      where: { projectId: project.id },
      orderBy: [{ enabled: 'desc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    })
  })

  app.post('/api/projects/:projectId/task-groups', { preHandler: requireAuth }, async (request, reply) => {
    const projectId = paramsAs(request.params).projectId ?? ''
    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    const body = bodyAs<TaskGroupBody>(request.body)
    const nextCode = code(body.code)
    const name = text(body.name)

    if (!nextCode || !name) {
      return reply.code(400).send({ message: 'Can nhap ma va ten nhom task.' })
    }

    const exists = await context.prisma.taskGroup.findUnique({
      where: { projectId_code: { projectId: project.id, code: nextCode } },
    })

    if (exists) {
      return reply.code(409).send({ message: 'Ma nhom task da ton tai trong du an.' })
    }

    return context.prisma.taskGroup.create({
      data: {
        projectId: project.id,
        code: nextCode,
        name,
        description: nullableText(body.description),
      },
    })
  })

  app.patch('/api/task-groups/:taskGroupId', { preHandler: requireAuth }, async (request, reply) => {
    const taskGroupId = paramsAs(request.params).taskGroupId ?? ''
    const taskGroup = await context.prisma.taskGroup.findUnique({ where: { id: taskGroupId } })

    if (!taskGroup) {
      return reply.code(404).send({ message: 'Khong tim thay nhom task.' })
    }

    const project = await ensureProject(context.prisma, taskGroup.projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    const body = bodyAs<TaskGroupBody>(request.body)
    const nextCode = code(body.code)
    const name = text(body.name)

    if (!nextCode || !name) {
      return reply.code(400).send({ message: 'Can nhap ma va ten nhom task.' })
    }

    const duplicate = await context.prisma.taskGroup.findFirst({
      where: {
        projectId: project.id,
        code: nextCode,
        id: { not: taskGroup.id },
      },
    })

    if (duplicate) {
      return reply.code(409).send({ message: 'Ma nhom task da ton tai trong du an.' })
    }

    return context.prisma.taskGroup.update({
      where: { id: taskGroup.id },
      data: {
        code: nextCode,
        name,
        description: nullableText(body.description),
        enabled: typeof body.enabled === 'boolean' ? body.enabled : taskGroup.enabled,
      },
    })
  })

  app.delete('/api/task-groups/:taskGroupId', { preHandler: requireAuth }, async (request, reply) => {
    const taskGroupId = paramsAs(request.params).taskGroupId ?? ''
    const taskGroup = await context.prisma.taskGroup.findUnique({ where: { id: taskGroupId } })

    if (!taskGroup) {
      return reply.code(404).send({ message: 'Khong tim thay nhom task.' })
    }

    const project = await ensureProject(context.prisma, taskGroup.projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    await context.prisma.taskGroup.delete({ where: { id: taskGroup.id } })

    return { ok: true }
  })

  app.get('/api/projects/:projectId/repositories', { preHandler: requireAuth }, async (request, reply) => {
    const projectId = paramsAs(request.params).projectId ?? ''
    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    const repositories = await context.prisma.repository.findMany({
      where: { projectId: project.id },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        releaseCycles: {
          where: { status: 'ACTIVE' },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    })

    return repositories.map(publicRepository)
  })

  app.post('/api/projects/:projectId/repositories', { preHandler: requireAuth }, async (request, reply) => {
    const projectId = paramsAs(request.params).projectId ?? ''
    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    const body = bodyAs<RepositoryBody>(request.body)
    const name = text(body.name)

    if (!name) {
      return reply.code(400).send({ message: 'Can nhap ten repository.' })
    }

    const exists = await context.prisma.repository.findUnique({
      where: { projectId_name: { projectId: project.id, name } },
    })

    if (exists) {
      return reply.code(409).send({ message: 'Repository da ton tai trong du an.' })
    }

    const repository = await context.prisma.repository.create({
      data: {
        projectId: project.id,
        name,
        provider: text(body.provider) || 'GITLAB_SELF_HOSTED',
        gitlabUrl: nullableText(body.gitlabUrl),
        gitlabProjectId: nullableText(body.gitlabProjectId),
        gitlabProjectPath: nullableText(body.gitlabProjectPath),
        gitlabAccessToken: nullableText(body.gitlabAccessToken),
        defaultBranch: text(body.defaultBranch) || 'main',
        productionBranch: text(body.productionBranch) || 'main',
        releaseBranchPattern: text(body.releaseBranchPattern) || 'release/DDMMYYYY',
        trustSourceBranch: text(body.trustSourceBranch) || text(body.defaultBranch) || 'main',
        developBranch: text(body.developBranch) || 'develop',
        featureNamePattern: text(body.featureNamePattern) || 'feature/{jiraCode}',
        hotfixNamePattern: text(body.hotfixNamePattern) || 'hotfix/{jiraCode}-{date}',
        featurePlannedTargets: text(body.featurePlannedTargets) || '{develop},{activeRelease},{production}',
        hotfixPlannedTargets: text(body.hotfixPlannedTargets) || '{activeRelease},{production}',
        allowCheckoutSourceOverride: body.allowCheckoutSourceOverride === true,
        allowDirectTaskBranchMainMerge: body.allowDirectTaskBranchMainMerge === true,
      },
    })

    try {
      await setActiveReleaseCycle(context.prisma, repository, body)
    } catch (error) {
      if (error instanceof Error && error.message === 'RELEASE_BRANCH_NAME_CONFLICT') {
        return reply.code(400).send({ message: 'Ten release branch dang duoc dung boi branch khac.' })
      }

      throw error
    }

    if (!project.defaultRepoId || body.makeDefault === true) {
      await context.prisma.project.update({
        where: { id: project.id },
        data: { defaultRepoId: repository.id },
      })
    }

    const repositoryWithActiveRelease = await context.prisma.repository.findUnique({
      where: { id: repository.id },
      include: {
        releaseCycles: {
          where: { status: 'ACTIVE' },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    })

    return publicRepository(repositoryWithActiveRelease ?? repository)
  })

  app.patch('/api/repositories/:repositoryId', { preHandler: requireAuth }, async (request, reply) => {
    const repositoryId = paramsAs(request.params).repositoryId ?? ''
    const repository = await context.prisma.repository.findUnique({ where: { id: repositoryId } })

    if (!repository) {
      return reply.code(404).send({ message: 'Khong tim thay repository.' })
    }

    const project = await ensureProject(context.prisma, repository.projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    const body = bodyAs<RepositoryBody>(request.body)
    const name = text(body.name)

    if (!name) {
      return reply.code(400).send({ message: 'Can nhap ten repository.' })
    }

    const duplicate = await context.prisma.repository.findFirst({
      where: {
        projectId: project.id,
        name,
        id: { not: repository.id },
      },
    })

    if (duplicate) {
      return reply.code(409).send({ message: 'Repository da ton tai trong du an.' })
    }

    const nextToken =
      body.clearGitlabAccessToken === true
        ? null
        : text(body.gitlabAccessToken) || repository.gitlabAccessToken

    const updatedRepository = await context.prisma.repository.update({
      where: { id: repository.id },
      data: {
        name,
        provider: text(body.provider) || repository.provider,
        gitlabUrl: nullableText(body.gitlabUrl),
        gitlabProjectId: nullableText(body.gitlabProjectId),
        gitlabProjectPath: nullableText(body.gitlabProjectPath),
        gitlabAccessToken: nextToken,
        defaultBranch: text(body.defaultBranch) || repository.defaultBranch,
        productionBranch: text(body.productionBranch) || repository.productionBranch,
        releaseBranchPattern: text(body.releaseBranchPattern) || repository.releaseBranchPattern,
        trustSourceBranch: text(body.trustSourceBranch) || repository.trustSourceBranch,
        developBranch: text(body.developBranch) || repository.developBranch,
        featureNamePattern: text(body.featureNamePattern) || repository.featureNamePattern,
        hotfixNamePattern: text(body.hotfixNamePattern) || repository.hotfixNamePattern,
        featurePlannedTargets: text(body.featurePlannedTargets) || repository.featurePlannedTargets,
        hotfixPlannedTargets: text(body.hotfixPlannedTargets) || repository.hotfixPlannedTargets,
        allowCheckoutSourceOverride:
          typeof body.allowCheckoutSourceOverride === 'boolean'
            ? body.allowCheckoutSourceOverride
            : repository.allowCheckoutSourceOverride,
        allowDirectTaskBranchMainMerge:
          typeof body.allowDirectTaskBranchMainMerge === 'boolean'
            ? body.allowDirectTaskBranchMainMerge
            : repository.allowDirectTaskBranchMainMerge,
      },
    })

    try {
      await setActiveReleaseCycle(context.prisma, updatedRepository, body)
    } catch (error) {
      if (error instanceof Error && error.message === 'RELEASE_BRANCH_NAME_CONFLICT') {
        return reply.code(400).send({ message: 'Ten release branch dang duoc dung boi branch khac.' })
      }

      throw error
    }

    if (body.makeDefault === true) {
      await context.prisma.project.update({
        where: { id: project.id },
        data: { defaultRepoId: updatedRepository.id },
      })
    }

    const repositoryWithActiveRelease = await context.prisma.repository.findUnique({
      where: { id: updatedRepository.id },
      include: {
        releaseCycles: {
          where: { status: 'ACTIVE' },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    })

    return publicRepository(repositoryWithActiveRelease ?? updatedRepository)
  })

  app.delete('/api/repositories/:repositoryId', { preHandler: requireAuth }, async (request, reply) => {
    const repositoryId = paramsAs(request.params).repositoryId ?? ''
    const repository = await context.prisma.repository.findUnique({ where: { id: repositoryId } })

    if (!repository) {
      return reply.code(404).send({ message: 'Khong tim thay repository.' })
    }

    const project = await ensureProject(context.prisma, repository.projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    await context.prisma.repository.delete({ where: { id: repository.id } })

    if (project.defaultRepoId === repository.id) {
      const replacement = await context.prisma.repository.findFirst({
        where: { projectId: project.id },
        orderBy: { createdAt: 'asc' },
      })

      await context.prisma.project.update({
        where: { id: project.id },
        data: { defaultRepoId: replacement?.id ?? null },
      })
    }

    return { ok: true }
  })

  app.get('/api/projects/:projectId/task-code-preview', { preHandler: requireAuth }, async (request, reply) => {
    const projectId = paramsAs(request.params).projectId ?? ''
    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    const url = new URL(request.url, 'http://localhost')
    const taskGroupId = url.searchParams.get('taskGroupId')
    const taskGroup = taskGroupId
      ? await context.prisma.taskGroup.findFirst({
          where: {
            id: taskGroupId,
            projectId: project.id,
          },
        })
      : null
    const nextNumber = taskGroup?.nextTaskNumber ?? project.nextTaskNumber
    const paddedNumber = String(nextNumber).padStart(3, '0')

    return {
      code: taskGroup ? `${project.code}-${taskGroup.code}-${paddedNumber}` : `${project.code}-${paddedNumber}`,
      nextNumber,
    }
  })
}
