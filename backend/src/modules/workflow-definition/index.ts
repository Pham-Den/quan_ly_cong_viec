import type { UnitOfWork } from '../../shared/unit-of-work/index.js'

// Sprint: v1 | Feature: FR-011 | Task Group: 01 Shared contracts
// Contract: API-005/007/011/021/022 WorkflowImpactService | Project: PR-004
// Pack: v1.7.20-canonical-task-group-headings
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
