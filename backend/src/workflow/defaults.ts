import type { AppPrismaClient } from '../db.js'

export type BranchKanbanDropRule = {
  allowKanbanDrop: boolean
  dropBlockReason: string | null
  requiresConfirmation: boolean
}

export const defaultTaskStatuses = [
  ['INBOX', 'Inbox', '#8c8c8c'],
  ['PLANNED', 'Chưa làm', '#64748b'],
  ['IN_PROGRESS', 'Đang tiến hành', '#1677ff'],
  ['IN_REVIEW', 'Đang review', '#13c2c2'],
  ['TESTING', 'Đang test', '#faad14'],
  ['READY_RELEASE', 'Sẵn sàng release', '#722ed1'],
  ['MERGED_RELEASE', 'Đã vào release', '#9254de'],
  ['READY_PROD', 'Sẵn sàng main', '#2f54eb'],
  ['DONE', 'Done', '#52c41a'],
  ['BLOCKED', 'Blocked', '#f5222d'],
  ['CANCELLED', 'Cancelled', '#595959'],
] as const

export const defaultBranchStatuses = [
  ['DRAFT', 'Nháp', '#8c8c8c'],
  ['CODING', 'Đang code', '#1677ff'],
  ['READY_REVIEW', 'Chờ review', '#13c2c2'],
  ['REVIEWING', 'Đang review', '#08979c'],
  ['READY_TEST', 'Chờ test', '#faad14'],
  ['TESTING', 'Đang test', '#d48806'],
  ['READY_RELEASE', 'Sẵn sàng release', '#722ed1'],
  ['MERGED_RELEASE', 'Đã vào release', '#9254de'],
  ['READY_MAIN', 'Sẵn sàng main', '#2f54eb'],
  ['MERGED_MAIN', 'Đã vào main', '#52c41a'],
  ['CLOSED', 'Đóng', '#595959'],
] as const

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
  CLOSED: {
    allowKanbanDrop: true,
    dropBlockReason: null,
    requiresConfirmation: true,
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

      if (record.allowKanbanDrop === null || record.requiresConfirmation === null || (record.dropBlockReason === null && dropRule.dropBlockReason)) {
        await prisma.workflowStatus.update({
          where: { id: record.id },
          data: {
            allowKanbanDrop: record.allowKanbanDrop ?? dropRule.allowKanbanDrop,
            dropBlockReason: record.dropBlockReason ?? dropRule.dropBlockReason,
            requiresConfirmation: record.requiresConfirmation ?? dropRule.requiresConfirmation,
          },
        })
      }
    }
  }
}
