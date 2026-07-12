export type TableName =
  | 'User'
  | 'RefreshToken'
  | 'Project'
  | 'TaskGroup'
  | 'Repository'
  | 'ReleaseCycle'
  | 'WorkflowStatus'
  | 'Note'
  | 'Task'
  | 'Branch'
  | 'BranchAlias'
  | 'TaskBranch'
  | 'ApiEnvironment'
  | 'ApiEnvironmentVariable'
  | 'ApiEnvironmentVariableVariant'
  | 'ApiRequest'
  | 'ApiFlow'
  | 'ApiFlowStep'
  | 'ApiFlowRun'
  | 'ApiRequestRun'
  | 'ApiSavedResponse'
  | 'SystemEnvironment'
  | 'SystemHost'
  | 'SystemTopologyBlueprintNode'
  | 'SystemNodeEnvironmentBinding'
  | 'SystemNodeBindingConfigGroup'
  | 'SystemNodeBindingConfigItem'
  | 'SystemTopologyBlueprintDependency'
  | 'SystemDependencyEnvironmentBinding'
  | 'SystemDependencyBindingConfig'
  | 'SystemTopologyNode'
  | 'SystemNodeConfigGroup'
  | 'SystemNodeConfigItem'
  | 'SystemDependency'
  | 'SystemDependencyConfig'
  | 'TimelineEvent'

export type ModelMetadata = {
  table: TableName
  delegate: string
  dateFields: string[]
  booleanFields: string[]
}

const commonTimestampFields = ['createdAt', 'updatedAt']

export const modelMetadata: ModelMetadata[] = [
  {
    table: 'User',
    delegate: 'user',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'RefreshToken',
    delegate: 'refreshToken',
    dateFields: ['expiresAt', 'revokedAt', 'createdAt'],
    booleanFields: [],
  },
  {
    table: 'Project',
    delegate: 'project',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'TaskGroup',
    delegate: 'taskGroup',
    dateFields: commonTimestampFields,
    booleanFields: ['enabled'],
  },
  {
    table: 'Repository',
    delegate: 'repository',
    dateFields: commonTimestampFields,
    booleanFields: ['allowCheckoutSourceOverride', 'allowDirectTaskBranchMainMerge'],
  },
  {
    table: 'ReleaseCycle',
    delegate: 'releaseCycle',
    dateFields: ['startDate', 'endDate', 'createdAt', 'updatedAt'],
    booleanFields: [],
  },
  {
    table: 'WorkflowStatus',
    delegate: 'workflowStatus',
    dateFields: commonTimestampFields,
    booleanFields: ['enabled', 'allowKanbanDrop', 'requiresConfirmation'],
  },
  {
    table: 'Note',
    delegate: 'note',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'Task',
    delegate: 'task',
    dateFields: ['targetDate', 'releaseReadyAt', 'doneAt', 'createdAt', 'updatedAt'],
    booleanFields: [],
  },
  {
    table: 'Branch',
    delegate: 'branch',
    dateFields: ['releaseCycleDate', 'mergedReleaseAt', 'mergedMainAt', 'createdAt', 'updatedAt'],
    booleanFields: ['remoteCreated'],
  },
  {
    table: 'BranchAlias',
    delegate: 'branchAlias',
    dateFields: ['createdAt'],
    booleanFields: [],
  },
  {
    table: 'TaskBranch',
    delegate: 'taskBranch',
    dateFields: commonTimestampFields,
    booleanFields: ['active', 'completionRequired'],
  },
  {
    table: 'ApiEnvironment',
    delegate: 'apiEnvironment',
    dateFields: commonTimestampFields,
    booleanFields: ['enabled'],
  },
  {
    table: 'ApiEnvironmentVariable',
    delegate: 'apiEnvironmentVariable',
    dateFields: commonTimestampFields,
    booleanFields: ['secret'],
  },
  {
    table: 'ApiEnvironmentVariableVariant',
    delegate: 'apiEnvironmentVariableVariant',
    dateFields: commonTimestampFields,
    booleanFields: ['enabled'],
  },
  {
    table: 'ApiRequest',
    delegate: 'apiRequest',
    dateFields: commonTimestampFields,
    booleanFields: ['storeResponseBody'],
  },
  {
    table: 'ApiFlow',
    delegate: 'apiFlow',
    dateFields: commonTimestampFields,
    booleanFields: ['enabled', 'storeResponseBody'],
  },
  {
    table: 'ApiFlowStep',
    delegate: 'apiFlowStep',
    dateFields: commonTimestampFields,
    booleanFields: ['continueOnFailure'],
  },
  {
    table: 'ApiFlowRun',
    delegate: 'apiFlowRun',
    dateFields: ['startedAt', 'finishedAt', 'createdAt'],
    booleanFields: [],
  },
  {
    table: 'ApiRequestRun',
    delegate: 'apiRequestRun',
    dateFields: ['startedAt', 'finishedAt', 'createdAt'],
    booleanFields: ['responseBodySaved'],
  },
  {
    table: 'ApiSavedResponse',
    delegate: 'apiSavedResponse',
    dateFields: ['createdAt'],
    booleanFields: ['truncated'],
  },
  {
    table: 'SystemEnvironment',
    delegate: 'systemEnvironment',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemHost',
    delegate: 'systemHost',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemTopologyBlueprintNode',
    delegate: 'systemTopologyBlueprintNode',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemNodeEnvironmentBinding',
    delegate: 'systemNodeEnvironmentBinding',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemNodeBindingConfigGroup',
    delegate: 'systemNodeBindingConfigGroup',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemNodeBindingConfigItem',
    delegate: 'systemNodeBindingConfigItem',
    dateFields: commonTimestampFields,
    booleanFields: ['secret'],
  },
  {
    table: 'SystemTopologyBlueprintDependency',
    delegate: 'systemTopologyBlueprintDependency',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemDependencyEnvironmentBinding',
    delegate: 'systemDependencyEnvironmentBinding',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemDependencyBindingConfig',
    delegate: 'systemDependencyBindingConfig',
    dateFields: commonTimestampFields,
    booleanFields: ['secret'],
  },
  {
    table: 'SystemTopologyNode',
    delegate: 'systemTopologyNode',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemNodeConfigGroup',
    delegate: 'systemNodeConfigGroup',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemNodeConfigItem',
    delegate: 'systemNodeConfigItem',
    dateFields: commonTimestampFields,
    booleanFields: ['secret'],
  },
  {
    table: 'SystemDependency',
    delegate: 'systemDependency',
    dateFields: commonTimestampFields,
    booleanFields: [],
  },
  {
    table: 'SystemDependencyConfig',
    delegate: 'systemDependencyConfig',
    dateFields: commonTimestampFields,
    booleanFields: ['secret'],
  },
  {
    table: 'TimelineEvent',
    delegate: 'timelineEvent',
    dateFields: ['createdAt'],
    booleanFields: [],
  },
]

export const tableNames = modelMetadata.map((model) => model.table)

export const importOrder: TableName[] = [
  'User',
  'Project',
  'TaskGroup',
  'Repository',
  'ReleaseCycle',
  'WorkflowStatus',
  'Note',
  'Task',
  'Branch',
  'BranchAlias',
  'TaskBranch',
  'ApiEnvironment',
  'ApiEnvironmentVariable',
  'ApiEnvironmentVariableVariant',
  'ApiRequest',
  'ApiFlow',
  'ApiFlowStep',
  'ApiFlowRun',
  'ApiRequestRun',
  'ApiSavedResponse',
  'SystemEnvironment',
  'SystemHost',
  'SystemTopologyBlueprintNode',
  'SystemNodeEnvironmentBinding',
  'SystemNodeBindingConfigGroup',
  'SystemNodeBindingConfigItem',
  'SystemTopologyBlueprintDependency',
  'SystemDependencyEnvironmentBinding',
  'SystemDependencyBindingConfig',
  'SystemTopologyNode',
  'SystemNodeConfigGroup',
  'SystemNodeConfigItem',
  'SystemDependency',
  'SystemDependencyConfig',
  'TimelineEvent',
  'RefreshToken',
]

export function metadataByTable(table: TableName) {
  const metadata = modelMetadata.find((model) => model.table === table)

  if (!metadata) {
    throw new Error(`Missing model metadata for ${table}.`)
  }

  return metadata
}
