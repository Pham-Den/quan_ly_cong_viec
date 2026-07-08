import type { AppPrismaClient } from '../db.js'

type TaskSyncClient = Pick<AppPrismaClient, 'task' | 'taskBranch' | 'timelineEvent'>

type LinkedBranch = {
  status: string
  mergedMainAt?: Date | string | null
}

export function taskStatusFromBranches(branches: LinkedBranch[]) {
  if (!branches.length) {
    return 'PLANNED'
  }

  if (branches.some((branch) => branch.status === 'MERGED_MAIN' || Boolean(branch.mergedMainAt))) {
    return 'DONE'
  }

  if (branches.some((branch) => branch.status === 'MERGED_RELEASE')) {
    return 'MERGED_RELEASE'
  }

  return 'IN_PROGRESS'
}

export async function syncTasksWithLinkedBranches(
  prisma: TaskSyncClient,
  taskIds: string[],
  projectId: string,
  createdById?: string,
) {
  const uniqueTaskIds = [...new Set(taskIds)].filter(Boolean)

  if (!uniqueTaskIds.length) {
    return
  }

  const tasks = await prisma.task.findMany({
    where: {
      id: { in: uniqueTaskIds },
      projectId,
    },
    include: {
      branchLinks: {
        where: { active: true },
        include: {
          branch: {
            select: {
              status: true,
              mergedMainAt: true,
            },
          },
        },
      },
    },
  })

  for (const task of tasks) {
    if (task.status === 'CANCELLED') {
      continue
    }

    const nextStatus = taskStatusFromBranches(task.branchLinks.map((link) => link.branch))
    const shouldSetDoneAt = nextStatus === 'DONE' && !task.doneAt
    const shouldClearDoneAt = nextStatus !== 'DONE' && Boolean(task.doneAt)

    if (task.status === nextStatus && !shouldSetDoneAt && !shouldClearDoneAt) {
      continue
    }

    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: nextStatus,
        doneAt: nextStatus === 'DONE' ? task.doneAt ?? new Date() : null,
      },
    })

    await prisma.timelineEvent.create({
      data: {
        projectId,
        taskId: task.id,
        createdById,
        eventType: 'TASK_STATUS_SYNCED_FROM_BRANCH',
        title: `Dong bo trang thai ${task.code}`,
        description: `${task.status} -> ${nextStatus}`,
        metadataJson: JSON.stringify({
          from: task.status,
          to: nextStatus,
          activeBranchCount: task.branchLinks.length,
        }),
      },
    })
  }
}

export async function syncAllProjectTasksWithLinkedBranches(
  prisma: TaskSyncClient,
  projectId: string,
  createdById?: string,
) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { id: true },
  })

  await syncTasksWithLinkedBranches(
    prisma,
    tasks.map((task) => task.id),
    projectId,
    createdById,
  )
}

export async function keepSingleActiveBranchPerTask(
  prisma: Pick<AppPrismaClient, 'taskBranch'>,
  taskIds: string[],
  branchId: string,
) {
  const uniqueTaskIds = [...new Set(taskIds)].filter(Boolean)

  if (!uniqueTaskIds.length) {
    return
  }

  await prisma.taskBranch.updateMany({
    where: {
      taskId: { in: uniqueTaskIds },
      active: true,
      branchId: { not: branchId },
    },
    data: { active: false },
  })
}
