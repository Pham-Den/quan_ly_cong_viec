import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'

type TimelineRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

type TimelineBody = {
  projectId?: unknown
  taskId?: unknown
  branchId?: unknown
  title?: unknown
  description?: unknown
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

function dateOrUndefined(value: string | null) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date
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

async function ensureTaskInProject(
  prisma: AppPrismaClient,
  taskId: string | null,
  projectId: string,
  reply: FastifyReply,
) {
  if (!taskId) {
    return null
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
  })

  if (!task) {
    reply.code(400).send({ message: 'Task khong thuoc du an da chon.' })
    return false
  }

  return task
}

async function ensureBranchInProject(
  prisma: AppPrismaClient,
  branchId: string | null,
  projectId: string,
  reply: FastifyReply,
) {
  if (!branchId) {
    return null
  }

  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      repository: { projectId },
    },
  })

  if (!branch) {
    reply.code(400).send({ message: 'Branch khong thuoc du an da chon.' })
    return false
  }

  return branch
}

export function registerTimelineRoutes(app: FastifyInstance, context: TimelineRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.get('/api/timeline', { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') || undefined
    const taskId = url.searchParams.get('taskId') || undefined
    const branchId = url.searchParams.get('branchId') || undefined
    const eventType = url.searchParams.get('eventType') || undefined
    const dateFrom = dateOrUndefined(url.searchParams.get('dateFrom'))
    const dateToValue = dateOrUndefined(url.searchParams.get('dateTo'))
    const dateTo = dateToValue ? new Date(dateToValue.getTime() + 24 * 60 * 60 * 1000 - 1) : undefined

    return context.prisma.timelineEvent.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(taskId ? { taskId } : {}),
        ...(branchId ? { branchId } : {}),
        ...(eventType ? { eventType } : {}),
        ...(dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
        project: {
          OR: [{ ownerId: userId }, { ownerId: null }],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, code: true, title: true, status: true } },
        branch: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })
  })

  app.post('/api/timeline/comment', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<TimelineBody>(request.body)
    const projectId = text(body.projectId)
    const description = text(body.description)
    const taskId = nullableText(body.taskId)
    const branchId = nullableText(body.branchId)

    if (!projectId || !description) {
      return reply.code(400).send({ message: 'Can chon du an va nhap noi dung ghi chu.' })
    }

    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    const task = await ensureTaskInProject(context.prisma, taskId, project.id, reply)

    if (task === false) {
      return
    }

    const branch = await ensureBranchInProject(context.prisma, branchId, project.id, reply)

    if (branch === false) {
      return
    }

    return context.prisma.timelineEvent.create({
      data: {
        projectId: project.id,
        taskId,
        branchId,
        createdById: request.authUser?.id,
        eventType: 'TIMELINE_COMMENT',
        title: text(body.title) || 'Ghi chu',
        description,
        metadataJson: JSON.stringify({ source: 'manual-comment' }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, code: true, title: true, status: true } },
        branch: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })
  })
}
