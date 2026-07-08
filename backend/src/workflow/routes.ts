import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'
import { branchKanbanDropRule, ensureWorkflowStatuses } from './defaults.js'

type WorkflowRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

type Params = {
  statusId?: string
}

type WorkflowStatusBody = {
  label?: unknown
  color?: unknown
  sortOrder?: unknown
  enabled?: unknown
  allowKanbanDrop?: unknown
  dropBlockReason?: unknown
  requiresConfirmation?: unknown
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

export function registerWorkflowRoutes(app: FastifyInstance, context: WorkflowRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.get('/api/workflow-statuses', { preHandler: requireAuth }, async (request, reply) => {
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') || ''
    const scope = url.searchParams.get('scope') || undefined
    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    await ensureWorkflowStatuses(context.prisma, project.id)

    return context.prisma.workflowStatus.findMany({
      where: {
        projectId: project.id,
        ...(scope ? { scope } : {}),
      },
      orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }],
    })
  })

  app.patch('/api/workflow-statuses/:statusId', { preHandler: requireAuth }, async (request, reply) => {
    const statusId = paramsAs(request.params).statusId ?? ''
    const status = await context.prisma.workflowStatus.findFirst({
      where: {
        id: statusId,
        project: {
          OR: [{ ownerId: request.authUser?.id }, { ownerId: null }],
        },
      },
    })

    if (!status) {
      return reply.code(404).send({ message: 'Khong tim thay workflow status.' })
    }

    const body = bodyAs<WorkflowStatusBody>(request.body)
    const label = text(body.label)
    const color = text(body.color)
    const sortOrder = Number(body.sortOrder)

    if (!label || !color) {
      return reply.code(400).send({ message: 'Can nhap label va mau.' })
    }

    return context.prisma.workflowStatus.update({
      where: { id: status.id },
      data: {
        label,
        color,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : status.sortOrder,
        enabled: typeof body.enabled === 'boolean' ? body.enabled : status.enabled,
        ...(status.scope === 'BRANCH'
          ? {
              allowKanbanDrop: typeof body.allowKanbanDrop === 'boolean' ? body.allowKanbanDrop : status.allowKanbanDrop,
              dropBlockReason: text(body.dropBlockReason) || branchKanbanDropRule(status.key).dropBlockReason,
              requiresConfirmation:
                typeof body.requiresConfirmation === 'boolean' ? body.requiresConfirmation : status.requiresConfirmation,
            }
          : {}),
      },
    })
  })
}
