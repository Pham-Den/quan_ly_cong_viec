import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'

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
  createdAt: Date
  updatedAt: Date
}) {
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
    createdAt: repository.createdAt,
    updatedAt: repository.updatedAt,
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

    return context.prisma.project.create({
      data: {
        ownerId: request.authUser?.id,
        code: nextCode,
        name,
        description: nullableText(body.description),
      },
    })
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
      },
    })

    if (!project.defaultRepoId || body.makeDefault === true) {
      await context.prisma.project.update({
        where: { id: project.id },
        data: { defaultRepoId: repository.id },
      })
    }

    return publicRepository(repository)
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
      },
    })

    if (body.makeDefault === true) {
      await context.prisma.project.update({
        where: { id: project.id },
        data: { defaultRepoId: updatedRepository.id },
      })
    }

    return publicRepository(updatedRepository)
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
