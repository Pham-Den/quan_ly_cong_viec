import type { UnitOfWork } from '../../shared/unit-of-work/index.js'

// CODE-1: Sprint v1 · TG-01 Shared Contracts · FR-011 · API-005/007/011/021/022 · PR-004
export type WorkflowDisableReason =
  | 'API_DELETED'
  | 'API_METHOD_CHANGED'
  | 'HOST_INACTIVE'
  | 'ENVIRONMENT_REMOVED'

export interface WorkflowImpactService {
  listByHost(hostId: string): Promise<readonly string[]>
  listByApi(apiId: string): Promise<readonly string[]>
  disableImpactedWorkflows(
    workflowIds: readonly string[],
    reason: WorkflowDisableReason,
    unitOfWork: UnitOfWork,
  ): Promise<void>
}
