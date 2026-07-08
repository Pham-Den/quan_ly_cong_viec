import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'

type PlanningRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
}

type Params = {
  noteId?: string
  taskId?: string
}

type NoteBody = {
  projectId?: unknown
  content?: unknown
  source?: unknown
  status?: unknown
}

type TaskBody = {
  projectId?: unknown
  taskGroupId?: unknown
  sourceNoteId?: unknown
  title?: unknown
  description?: unknown
  status?: unknown
  priority?: unknown
  type?: unknown
  targetDate?: unknown
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

function dateOrNull(value: unknown) {
  const nextValue = text(value)

  if (!nextValue) {
    return null
  }

  const date = new Date(nextValue)

  return Number.isNaN(date.getTime()) ? null : date
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

async function ensureTask(prisma: AppPrismaClient, taskId: string, userId: string, reply: FastifyReply) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        OR: [{ ownerId: userId }, { ownerId: null }],
      },
    },
    include: {
      project: true,
      taskGroup: true,
      sourceNote: true,
      timelineEvents: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!task) {
    reply.code(404).send({ message: 'Khong tim thay task.' })
    return null
  }

  return task
}

async function createTaskCode(
  prisma: AppPrismaClient,
  projectId: string,
  taskGroupId: string | null,
) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({ where: { id: projectId } })

    if (!project) {
      throw new Error('PROJECT_NOT_FOUND')
    }

    if (taskGroupId) {
      const taskGroup = await tx.taskGroup.findFirst({
        where: {
          id: taskGroupId,
          projectId,
        },
      })

      if (!taskGroup) {
        throw new Error('TASK_GROUP_NOT_FOUND')
      }

      const taskCode = `${project.code}-${taskGroup.code}-${String(taskGroup.nextTaskNumber).padStart(3, '0')}`

      await tx.taskGroup.update({
        where: { id: taskGroup.id },
        data: { nextTaskNumber: { increment: 1 } },
      })

      return taskCode
    }

    const taskCode = `${project.code}-${String(project.nextTaskNumber).padStart(3, '0')}`

    await tx.project.update({
      where: { id: project.id },
      data: { nextTaskNumber: { increment: 1 } },
    })

    return taskCode
  })
}

export function registerPlanningRoutes(app: FastifyInstance, context: PlanningRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.get('/api/notes', { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') || undefined
    const status = url.searchParams.get('status') || 'ACTIONABLE'
    const query = url.searchParams.get('q')?.trim() || undefined
    const statusFilter =
      status === 'ALL'
        ? {}
        : status === 'ACTIONABLE'
          ? { status: { in: ['NEW', 'ARCHIVED'] } }
          : { status }

    return context.prisma.note.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...statusFilter,
        ...(query ? { content: { contains: query } } : {}),
        OR: [
          { projectId: null },
          {
            project: {
              OR: [{ ownerId: userId }, { ownerId: null }],
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        convertedTask: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    })
  })

  app.post('/api/notes', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<NoteBody>(request.body)
    const content = text(body.content)
    const projectId = nullableText(body.projectId)

    if (!content) {
      return reply.code(400).send({ message: 'Can nhap noi dung note.' })
    }

    if (projectId && !(await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply))) {
      return
    }

    const note = await context.prisma.note.create({
      data: {
        projectId,
        content,
        source: nullableText(body.source),
        status: 'NEW',
      },
    })

    if (projectId) {
      await context.prisma.timelineEvent.create({
        data: {
          projectId,
          createdById: request.authUser?.id,
          eventType: 'NOTE_CREATED',
          title: 'Them note inbox',
          description: content,
          metadataJson: JSON.stringify({ noteId: note.id, source: note.source }),
        },
      })
    }

    return note
  })

  app.patch('/api/notes/:noteId', { preHandler: requireAuth }, async (request, reply) => {
    const noteId = paramsAs(request.params).noteId ?? ''
    const note = await context.prisma.note.findFirst({
      where: {
        id: noteId,
        OR: [
          { projectId: null },
          {
            project: {
              OR: [{ ownerId: request.authUser?.id }, { ownerId: null }],
            },
          },
        ],
      },
    })

    if (!note) {
      return reply.code(404).send({ message: 'Khong tim thay note.' })
    }

    const body = bodyAs<NoteBody>(request.body)
    const content = text(body.content)

    if (!content) {
      return reply.code(400).send({ message: 'Can nhap noi dung note.' })
    }

    const updatedNote = await context.prisma.note.update({
      where: { id: note.id },
      data: {
        content,
        source: nullableText(body.source),
      },
    })

    if (note.projectId) {
      await context.prisma.timelineEvent.create({
        data: {
          projectId: note.projectId,
          createdById: request.authUser?.id,
          eventType: 'NOTE_UPDATED',
          title: 'Cap nhat note inbox',
          description: content,
          metadataJson: JSON.stringify({ noteId: note.id }),
        },
      })
    }

    return updatedNote
  })

  app.post('/api/notes/:noteId/archive', { preHandler: requireAuth }, async (request, reply) => {
    const noteId = paramsAs(request.params).noteId ?? ''
    const note = await context.prisma.note.findFirst({
      where: {
        id: noteId,
        OR: [
          { projectId: null },
          {
            project: {
              OR: [{ ownerId: request.authUser?.id }, { ownerId: null }],
            },
          },
        ],
      },
    })

    if (!note) {
      return reply.code(404).send({ message: 'Khong tim thay note.' })
    }

    if (note.status === 'CONVERTED') {
      return reply.code(400).send({ message: 'Note da chuyen thanh task, khong the luu tru lai.' })
    }

    const archivedNote = await context.prisma.note.update({
      where: { id: note.id },
      data: { status: 'ARCHIVED' },
    })

    if (note.projectId) {
      await context.prisma.timelineEvent.create({
        data: {
          projectId: note.projectId,
          createdById: request.authUser?.id,
          eventType: 'NOTE_ARCHIVED',
          title: 'Luu tru note inbox',
          description: note.content,
          metadataJson: JSON.stringify({ noteId: note.id, previousStatus: note.status }),
        },
      })
    }

    return archivedNote
  })

  app.post('/api/notes/:noteId/convert-to-task', { preHandler: requireAuth }, async (request, reply) => {
    const noteId = paramsAs(request.params).noteId ?? ''
    const note = await context.prisma.note.findFirst({
      where: {
        id: noteId,
        status: { in: ['NEW', 'ARCHIVED'] },
        OR: [
          { projectId: null },
          {
            project: {
              OR: [{ ownerId: request.authUser?.id }, { ownerId: null }],
            },
          },
        ],
      },
    })

    if (!note) {
      return reply.code(404).send({ message: 'Khong tim thay note co the chuyen task.' })
    }

    const body = bodyAs<TaskBody>(request.body)
    const projectId = text(body.projectId || note.projectId)
    const title = text(body.title) || note.content.slice(0, 120)
    const taskGroupId = nullableText(body.taskGroupId)

    if (!projectId || !title) {
      return reply.code(400).send({ message: 'Can chon du an va nhap tieu de task.' })
    }

    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    if (taskGroupId) {
      const taskGroup = await context.prisma.taskGroup.findFirst({
        where: { id: taskGroupId, projectId: project.id },
      })

      if (!taskGroup) {
        return reply.code(400).send({ message: 'Nhom task khong thuoc du an da chon.' })
      }
    }

    const taskCode = await createTaskCode(context.prisma, project.id, taskGroupId)
    const task = await context.prisma.task.create({
      data: {
        projectId: project.id,
        taskGroupId,
        sourceNoteId: note.id,
        code: taskCode,
        title,
        description: nullableText(body.description) ?? note.content,
        priority: text(body.priority) || 'MEDIUM',
        type: text(body.type) || 'FEATURE',
        targetDate: dateOrNull(body.targetDate),
      },
    })

    await context.prisma.note.update({
      where: { id: note.id },
      data: {
        projectId: project.id,
        status: 'CONVERTED',
      },
    })
    await context.prisma.timelineEvent.create({
      data: {
        projectId: project.id,
        taskId: task.id,
        createdById: request.authUser?.id,
        eventType: 'TASK_CREATED',
        title: `Tao task ${task.code}`,
        description: `Task duoc tao tu note inbox.`,
        metadataJson: JSON.stringify({ sourceNoteId: note.id }),
      },
    })
    await context.prisma.timelineEvent.create({
      data: {
        projectId: project.id,
        taskId: task.id,
        createdById: request.authUser?.id,
        eventType: 'NOTE_CONVERTED',
        title: 'Chuyen note thanh task',
        description: note.content,
        metadataJson: JSON.stringify({ sourceNoteId: note.id, taskId: task.id }),
      },
    })

    return task
  })

  app.get('/api/tasks', { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') || undefined
    const taskGroupId = url.searchParams.get('taskGroupId') || undefined
    const status = url.searchParams.get('status') || undefined
    const priority = url.searchParams.get('priority') || undefined
    const type = url.searchParams.get('type') || undefined
    const branch = url.searchParams.get('branch')?.trim() || undefined
    const query = url.searchParams.get('q')?.trim() || undefined

    return context.prisma.task.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(taskGroupId ? { taskGroupId } : {}),
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(type ? { type } : {}),
        ...(branch
          ? {
              branchLinks: {
                some: {
                  branch: {
                    name: { contains: branch },
                  },
                },
              },
            }
          : {}),
        ...(query
          ? {
              OR: [{ code: { contains: query } }, { title: { contains: query } }],
            }
          : {}),
        project: {
          OR: [{ ownerId: userId }, { ownerId: null }],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, code: true, name: true } },
        taskGroup: { select: { id: true, code: true, name: true } },
        sourceNote: { select: { id: true, content: true } },
        branchLinks: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    })
  })

  app.get('/api/tasks/:taskId', { preHandler: requireAuth }, async (request, reply) => {
    return ensureTask(context.prisma, paramsAs(request.params).taskId ?? '', request.authUser?.id ?? '', reply)
  })

  app.post('/api/tasks', { preHandler: requireAuth }, async (request, reply) => {
    const body = bodyAs<TaskBody>(request.body)
    const projectId = text(body.projectId)
    const taskGroupId = nullableText(body.taskGroupId)
    const title = text(body.title)

    if (!projectId || !title) {
      return reply.code(400).send({ message: 'Can chon du an va nhap tieu de task.' })
    }

    const project = await ensureProject(context.prisma, projectId, request.authUser?.id ?? '', reply)

    if (!project) {
      return
    }

    if (taskGroupId) {
      const taskGroup = await context.prisma.taskGroup.findFirst({
        where: { id: taskGroupId, projectId: project.id },
      })

      if (!taskGroup) {
        return reply.code(400).send({ message: 'Nhom task khong thuoc du an da chon.' })
      }
    }

    const taskCode = await createTaskCode(context.prisma, project.id, taskGroupId)
    const task = await context.prisma.task.create({
      data: {
        projectId: project.id,
        taskGroupId,
        code: taskCode,
        title,
        description: nullableText(body.description),
        priority: text(body.priority) || 'MEDIUM',
        type: text(body.type) || 'FEATURE',
        targetDate: dateOrNull(body.targetDate),
      },
    })

    await context.prisma.timelineEvent.create({
      data: {
        projectId: project.id,
        taskId: task.id,
        createdById: request.authUser?.id,
        eventType: 'TASK_CREATED',
        title: `Tao task ${task.code}`,
        description: 'Task duoc tao thu cong.',
        metadataJson: JSON.stringify({ source: 'manual' }),
      },
    })

    return task
  })

  app.patch('/api/tasks/:taskId', { preHandler: requireAuth }, async (request, reply) => {
    const taskId = paramsAs(request.params).taskId ?? ''
    const task = await ensureTask(context.prisma, taskId, request.authUser?.id ?? '', reply)

    if (!task) {
      return
    }

    const body = bodyAs<TaskBody>(request.body)
    const nextStatus = text(body.status) || task.status
    const taskGroupId = nullableText(body.taskGroupId)

    if (taskGroupId) {
      const taskGroup = await context.prisma.taskGroup.findFirst({
        where: { id: taskGroupId, projectId: task.projectId },
      })

      if (!taskGroup) {
        return reply.code(400).send({ message: 'Nhom task khong thuoc du an cua task.' })
      }
    }

    const updatedTask = await context.prisma.task.update({
      where: { id: task.id },
      data: {
        taskGroupId,
        title: text(body.title) || task.title,
        description: nullableText(body.description),
        status: nextStatus,
        priority: text(body.priority) || task.priority,
        type: text(body.type) || task.type,
        targetDate: dateOrNull(body.targetDate),
      },
    })

    if (nextStatus !== task.status) {
      const eventType =
        nextStatus === 'BLOCKED' ? 'TASK_BLOCKED' : task.status === 'BLOCKED' ? 'TASK_UNBLOCKED' : 'TASK_STATUS_CHANGED'

      await context.prisma.timelineEvent.create({
        data: {
          projectId: task.projectId,
          taskId: task.id,
          createdById: request.authUser?.id,
          eventType,
          title: `Doi trang thai ${task.code}`,
          description: `${task.status} -> ${nextStatus}`,
          metadataJson: JSON.stringify({ from: task.status, to: nextStatus }),
        },
      })
    }

    return updatedTask
  })

  app.post('/api/tasks/:taskId/mark-ready-prod', { preHandler: requireAuth }, async (request, reply) => {
    const taskId = paramsAs(request.params).taskId ?? ''
    const task = await ensureTask(context.prisma, taskId, request.authUser?.id ?? '', reply)

    if (!task) {
      return
    }

    const nextStatus = ['DONE', 'CANCELLED'].includes(task.status) ? task.status : 'READY_PROD'
    const updatedTask = await context.prisma.task.update({
      where: { id: task.id },
      data: {
        status: nextStatus,
        releaseReadyAt: new Date(),
      },
    })

    await context.prisma.timelineEvent.create({
      data: {
        projectId: task.projectId,
        taskId: task.id,
        createdById: request.authUser?.id,
        eventType: 'TASK_READY_PROD',
        title: `Danh dau san sang main ${task.code}`,
        description: 'Day la tin hieu lap ke hoach, khong phai dieu kien bat buoc de done.',
        metadataJson: JSON.stringify({ previousStatus: task.status, nextStatus }),
      },
    })

    return updatedTask
  })
}
