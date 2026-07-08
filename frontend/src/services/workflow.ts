export type WorkflowScope = 'TASK' | 'BRANCH'

export type WorkflowStatusRecord = {
  id: string
  projectId: string | null
  scope: WorkflowScope
  key: string
  label: string
  color: string
  sortOrder: number
  enabled: boolean
  allowKanbanDrop: boolean | null
  dropBlockReason: string | null
  requiresConfirmation: boolean | null
}

export const fallbackTaskStatuses = [
  { label: 'Chưa làm', value: 'PLANNED', color: '#64748b' },
  { label: 'Đang tiến hành', value: 'IN_PROGRESS', color: '#1677ff' },
  { label: 'Đang review', value: 'IN_REVIEW', color: '#13c2c2' },
  { label: 'Đang test', value: 'TESTING', color: '#faad14' },
  { label: 'Sẵn sàng release', value: 'READY_RELEASE', color: '#722ed1' },
  { label: 'Đã vào release', value: 'MERGED_RELEASE', color: '#9254de' },
  { label: 'Sẵn sàng main', value: 'READY_PROD', color: '#2f54eb' },
  { label: 'Done', value: 'DONE', color: '#52c41a' },
  { label: 'Blocked', value: 'BLOCKED', color: '#f5222d' },
  { label: 'Cancelled', value: 'CANCELLED', color: '#595959' },
]

export const fallbackBranchStatuses = [
  { label: 'Nháp', value: 'DRAFT', color: '#8c8c8c' },
  { label: 'Đang code', value: 'CODING', color: '#1677ff' },
  { label: 'Chờ review', value: 'READY_REVIEW', color: '#13c2c2' },
  { label: 'Đang review', value: 'REVIEWING', color: '#08979c' },
  { label: 'Chờ test', value: 'READY_TEST', color: '#faad14' },
  { label: 'Đang test', value: 'TESTING', color: '#d48806' },
  { label: 'Sẵn sàng release', value: 'READY_RELEASE', color: '#722ed1' },
  { label: 'Đã vào release', value: 'MERGED_RELEASE', color: '#9254de' },
  { label: 'Sẵn sàng main', value: 'READY_MAIN', color: '#2f54eb' },
  { label: 'Đã vào main', value: 'MERGED_MAIN', color: '#52c41a' },
  { label: 'Đóng', value: 'CLOSED', color: '#595959' },
]

export const defaultBranchKanbanDropRules: Record<
  string,
  { allowKanbanDrop: boolean; dropBlockReason: string | null; requiresConfirmation: boolean }
> = {
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

export const noteStatusMeta: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Đang chờ', color: '#1677ff' },
  ARCHIVED: { label: 'Đã lưu trữ', color: '#8c8c8c' },
  CONVERTED: { label: 'Đã thành task', color: '#52c41a' },
}

function fallbackOptions(scope: WorkflowScope) {
  return scope === 'TASK' ? fallbackTaskStatuses : fallbackBranchStatuses
}

export function workflowOptions(statuses: WorkflowStatusRecord[], scope: WorkflowScope) {
  const scoped = statuses
    .filter((status) => status.scope === scope && status.enabled)
    .sort((left, right) => left.sortOrder - right.sortOrder)

  if (!scoped.length) {
    return fallbackOptions(scope)
  }

  return scoped.map((status) => ({
    label: status.label,
    value: status.key,
    color: status.color,
  }))
}

export function statusMeta(statuses: WorkflowStatusRecord[], scope: WorkflowScope, key: string) {
  const configured = statuses.find((status) => status.scope === scope && status.key === key)

  if (configured) {
    return {
      label: configured.label,
      color: configured.color,
    }
  }

  const fallback = fallbackOptions(scope).find((status) => status.value === key)

  return {
    label: fallback?.label ?? key,
    color: fallback?.color ?? 'default',
  }
}

export function branchKanbanDropRule(statuses: WorkflowStatusRecord[], statusKey: string) {
  const fallback = defaultBranchKanbanDropRules[statusKey] ?? {
    allowKanbanDrop: true,
    dropBlockReason: null,
    requiresConfirmation: false,
  }

  if (statusKey === 'MERGED_RELEASE' || statusKey === 'MERGED_MAIN') {
    return fallback
  }

  const configured = statuses.find((status) => status.scope === 'BRANCH' && status.key === statusKey)

  return {
    allowKanbanDrop: configured?.allowKanbanDrop ?? fallback.allowKanbanDrop,
    dropBlockReason: configured?.dropBlockReason ?? fallback.dropBlockReason,
    requiresConfirmation: configured?.requiresConfirmation ?? fallback.requiresConfirmation,
  }
}
