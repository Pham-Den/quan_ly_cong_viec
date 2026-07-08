import type { AppPrismaClient } from '../db.js'

export type BranchKanbanDropRule = {
  allowKanbanDrop: boolean
  dropBlockReason: string | null
  requiresConfirmation: boolean
}

export const defaultTaskStatuses = [
  ['PLANNED', 'Chưa làm', '#64748b'],
  ['IN_PROGRESS', 'Đang tiến hành', '#1677ff'],
  ['MERGED_RELEASE', 'Đang ở release', '#9254de'],
  ['DONE', 'Lên prod', '#52c41a'],
  ['CANCELLED', 'Đã hủy', '#8c8c8c'],
] as const

export const defaultBranchStatuses = [
  ['CODING', 'Đang tiến hành', '#1677ff'],
  ['MERGED_DEVELOP', 'Vào develop', '#13c2c2'],
  ['MERGED_RELEASE', 'Release', '#9254de'],
  ['MERGED_MAIN', 'Main', '#52c41a'],
] as const

const deprecatedTaskStatuses = [
  'INBOX',
  'IN_REVIEW',
  'TESTING',
  'READY_RELEASE',
  'READY_PROD',
  'BLOCKED',
]

const deprecatedBranchStatuses = [
  'DRAFT',
  'READY_REVIEW',
  'REVIEWING',
  'READY_TEST',
  'TESTING',
  'READY_RELEASE',
  'READY_MAIN',
  'CLOSED',
]

const branchStatusMigrationTargets: Record<string, string> = {
  DRAFT: 'CODING',
  READY_REVIEW: 'CODING',
  REVIEWING: 'CODING',
  READY_TEST: 'CODING',
  TESTING: 'CODING',
  READY_RELEASE: 'CODING',
  READY_MAIN: 'CODING',
  CLOSED: 'CODING',
}

const oldDefaultTaskLabels: Record<string, string[]> = {
  MERGED_RELEASE: ['Đã vào release'],
  DONE: ['Done'],
}

export const defaultBranchKanbanDropRules: Record<string, BranchKanbanDropRule> = {
  MERGED_RELEASE: {
    allowKanbanDrop: false,
    dropBlockReason: 'Dùng nút Merge release để cập nhật release, task và timeline.',
    requiresConfirmation: false,
  },
  MERGED_MAIN: {
    allowKanbanDrop: false,
    dropBlockReason: 'Dùng nút Merge main để tính done task theo branch lineage.',
    requiresConfirmation: false,
  },
}

export function branchKanbanDropRule(
  statusKey: string,
  configured?: {
    allowKanbanDrop: boolean | null
    dropBlockReason: string | null
    requiresConfirmation: boolean | null
  } | null,
) {
  const fallback = defaultBranchKanbanDropRules[statusKey] ?? {
    allowKanbanDrop: true,
    dropBlockReason: null,
    requiresConfirmation: false,
  }

  if (statusKey === 'MERGED_RELEASE' || statusKey === 'MERGED_MAIN') {
    return fallback
  }

  return {
    allowKanbanDrop: configured?.allowKanbanDrop ?? fallback.allowKanbanDrop,
    dropBlockReason: configured?.dropBlockReason ?? fallback.dropBlockReason,
    requiresConfirmation: configured?.requiresConfirmation ?? fallback.requiresConfirmation,
  }
}

export async function ensureWorkflowStatuses(prisma: AppPrismaClient, projectId: string) {
  const records = [
    ...defaultTaskStatuses.map(([key, label, color], index) => ({
      projectId,
      scope: 'TASK',
      key,
      label,
      color,
      sortOrder: index + 1,
    })),
    ...defaultBranchStatuses.map(([key, label, color], index) => {
      const dropRule = branchKanbanDropRule(key)

      return {
        projectId,
        scope: 'BRANCH',
        key,
        label,
        color,
        sortOrder: index + 1,
        ...dropRule,
      }
    }),
  ]

  for (const status of records) {
    const record = await prisma.workflowStatus.upsert({
      where: {
        projectId_scope_key: {
          projectId: status.projectId,
          scope: status.scope,
          key: status.key,
        },
      },
      create: status,
      update: {},
    })

    if (record.scope === 'BRANCH') {
      const dropRule = branchKanbanDropRule(record.key)

      await prisma.workflowStatus.update({
        where: { id: record.id },
        data: {
          label: status.label,
          sortOrder: status.sortOrder,
          enabled: true,
          allowKanbanDrop: record.allowKanbanDrop ?? dropRule.allowKanbanDrop,
          dropBlockReason: record.dropBlockReason ?? dropRule.dropBlockReason,
          requiresConfirmation: record.requiresConfirmation ?? dropRule.requiresConfirmation,
        },
      })
    }

    if (record.scope === 'TASK' && (oldDefaultTaskLabels[record.key] ?? []).includes(record.label)) {
      await prisma.workflowStatus.update({
        where: { id: record.id },
        data: {
          label: status.label,
          color: status.color,
          sortOrder: status.sortOrder,
          enabled: true,
        },
      })
    }
  }

  await prisma.workflowStatus.deleteMany({
    where: {
      projectId,
      scope: 'TASK',
      key: { in: deprecatedTaskStatuses },
    },
  })

  await prisma.workflowStatus.deleteMany({
    where: {
      projectId,
      scope: 'BRANCH',
      key: { in: deprecatedBranchStatuses },
    },
  })

  for (const [from, to] of Object.entries(branchStatusMigrationTargets)) {
    await prisma.branch.updateMany({
      where: {
        status: from,
        repository: { projectId },
      },
      data: { status: to },
    })
  }
}
