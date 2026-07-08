import type { FastifyInstance, FastifyReply } from 'fastify'

import { createAuthGuard } from '../auth/guard.js'
import type { AppPrismaClient } from '../db.js'
import type { AppEnv } from '../env.js'

type VisibilityRoutesContext = {
  env: AppEnv
  prisma: AppPrismaClient
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

function taskBucket(status: string) {
  if (status === 'PLANNED') return 'notStarted'
  if (status === 'IN_PROGRESS') return 'inProgress'
  if (['IN_REVIEW', 'TESTING'].includes(status)) return 'waiting'
  if (['READY_RELEASE', 'MERGED_RELEASE'].includes(status)) return 'inRelease'
  if (status === 'READY_PROD') return 'readyMain'
  if (status === 'DONE') return 'done'
  if (status === 'BLOCKED') return 'blocked'
  if (status === 'CANCELLED') return 'cancelled'

  return 'inProgress'
}

export function registerVisibilityRoutes(app: FastifyInstance, context: VisibilityRoutesContext) {
  const requireAuth = createAuthGuard(context)

  app.get('/api/visibility/dashboard', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') || ''
    const project = await ensureProject(context.prisma, projectId, userId, reply)

    if (!project) {
      return
    }

    const now = new Date()
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const [tasks, branches, inboxNotes, recentTimeline] = await Promise.all([
      context.prisma.task.findMany({
        where: { projectId: project.id },
        orderBy: { updatedAt: 'desc' },
        take: 200,
        include: {
          taskGroup: { select: { code: true, name: true } },
          branchLinks: {
            where: { active: true },
            include: {
              branch: { select: { id: true, name: true, status: true, actualMergedInto: true } },
            },
          },
        },
      }),
      context.prisma.branch.findMany({
        where: { repository: { projectId: project.id } },
        orderBy: { updatedAt: 'desc' },
        take: 120,
        include: {
          repository: { select: { name: true, productionBranch: true } },
          taskLinks: {
            where: { active: true },
            include: { task: { select: { code: true, title: true, status: true } } },
          },
        },
      }),
      context.prisma.note.findMany({
        where: {
          projectId: project.id,
          status: { in: ['NEW', 'ARCHIVED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      context.prisma.timelineEvent.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          task: { select: { code: true, title: true } },
          branch: { select: { name: true } },
        },
      }),
    ])
    const bucketCounts = tasks.reduce<Record<string, number>>((counts, task) => {
      const bucket = taskBucket(task.status)

      counts[bucket] = (counts[bucket] ?? 0) + 1

      return counts
    }, {})
    const dueTasks = tasks.filter((task) => task.targetDate && task.status !== 'DONE' && task.status !== 'CANCELLED' && task.targetDate <= soon)

    return {
      bucketCounts,
      activeTasks: tasks.filter((task) => ['PLANNED', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING'].includes(task.status)).slice(0, 8),
      blockedTasks: tasks.filter((task) => task.status === 'BLOCKED').slice(0, 8),
      dueTasks: dueTasks.slice(0, 8),
      inboxNotes,
      branchesReady: branches.filter((branch) => ['READY_TEST', 'TESTING', 'READY_RELEASE', 'MERGED_RELEASE', 'READY_MAIN'].includes(branch.status)).slice(0, 8),
      branchesNotMain: branches.filter((branch) => branch.status !== 'MERGED_MAIN' && branch.status !== 'CLOSED').slice(0, 8),
      recentTimeline,
    }
  })

  app.get('/api/search', { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser?.id ?? ''
    const url = new URL(request.url, 'http://localhost')
    const projectId = url.searchParams.get('projectId') || undefined
    const query = url.searchParams.get('q')?.trim() || ''

    if (!query) {
      return []
    }

    const [tasks, branches, notes] = await Promise.all([
      context.prisma.task.findMany({
        where: {
          ...(projectId ? { projectId } : {}),
          OR: [
            { code: { contains: query } },
            { title: { contains: query } },
            { taskGroup: { code: { contains: query } } },
            { branchLinks: { some: { branch: { name: { contains: query } } } } },
          ],
          project: { OR: [{ ownerId: userId }, { ownerId: null }] },
        },
        take: 8,
        include: {
          taskGroup: { select: { code: true, name: true } },
          branchLinks: {
            where: { active: true },
            include: { branch: { select: { name: true, status: true } } },
          },
        },
      }),
      context.prisma.branch.findMany({
        where: {
          ...(projectId ? { repository: { projectId } } : {}),
          OR: [
            { name: { contains: query } },
            { shortName: { contains: query } },
            { aliases: { some: { alias: { contains: query } } } },
            { taskLinks: { some: { task: { code: { contains: query } } } } },
          ],
          repository: {
            ...(projectId ? { projectId } : {}),
            project: { OR: [{ ownerId: userId }, { ownerId: null }] },
          },
        },
        take: 8,
        include: {
          repository: { select: { name: true } },
          taskLinks: {
            where: { active: true },
            include: { task: { select: { code: true, title: true } } },
          },
        },
      }),
      context.prisma.note.findMany({
        where: {
          ...(projectId ? { projectId } : {}),
          content: { contains: query },
          OR: [
            { projectId: null },
            { project: { OR: [{ ownerId: userId }, { ownerId: null }] } },
          ],
        },
        take: 5,
      }),
    ])

    return [
      ...tasks.map((task) => ({
        type: 'task',
        id: task.id,
        label: `${task.code} - ${task.title}`,
        description: `${task.status}${task.branchLinks.length ? ` - ${task.branchLinks.map((link) => link.branch.name).join(', ')}` : ''}`,
      })),
      ...branches.map((branch) => ({
        type: 'branch',
        id: branch.id,
        label: branch.name,
        description: `${branch.status} - ${branch.repository.name}${branch.taskLinks.length ? ` - ${branch.taskLinks.map((link) => link.task.code).join(', ')}` : ''}`,
      })),
      ...notes.map((note) => ({
        type: 'note',
        id: note.id,
        label: note.content,
        description: `Inbox - ${note.status}`,
      })),
    ]
  })
}
