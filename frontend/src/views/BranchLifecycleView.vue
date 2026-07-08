<script setup lang="ts">
import axios from 'axios'
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppKanbanBoard from '../core/components/AppKanbanBoard.vue'
import { api } from '../services/api'
import { branchKanbanDropRule, statusMeta, workflowOptions, type WorkflowStatusRecord } from '../services/workflow'
import { useSessionStore } from '../stores/session'

type RepositoryRecord = {
  id: string
  name: string
  defaultBranch: string
  productionBranch: string
  releaseBranchPattern: string
  trustSourceBranch: string
  developBranch: string
  featureNamePattern: string
  hotfixNamePattern: string
  featurePlannedTargets: string
  hotfixPlannedTargets: string
  allowCheckoutSourceOverride: boolean
  allowDirectTaskBranchMainMerge: boolean
  activeReleaseCycle: ReleaseCycleRecord | null
  hasGitlabAccessToken?: boolean
}

type ReleaseCycleRecord = {
  id: string
  name: string
  status: string
  startDate: string | null
  endDate: string | null
}

type TaskRecord = {
  id: string
  code: string
  title: string
  status: string
  releaseReadyAt: string | null
}

type BranchTaskLink = {
  id: string
  role: string
  inheritedFromBranchId: string | null
  task: TaskRecord
}

type BranchAlias = {
  id: string
  alias: string
}

type TimelineEventRecord = {
  id: string
  eventType: string
  title: string
  description: string | null
  createdAt: string
}

type BranchRecord = {
  id: string
  repositoryId: string
  sourceBranchId: string | null
  name: string
  shortName: string | null
  branchType: string
  status: string
  checkoutSourceBranch: string | null
  intendedMergeTarget: string | null
  actualMergedInto: string | null
  baseBranch: string | null
  mergeRequestUrl: string | null
  releaseCycleDate: string | null
  releaseCycleId: string | null
  generatedCheckoutCommand: string | null
  remoteCreated: boolean
  mergedReleaseAt: string | null
  mergedMainAt: string | null
  sortOrder: number
  createdAt: string
  lineageId: string | null
  repository: RepositoryRecord
  releaseCycle?: ReleaseCycleRecord | null
  sourceBranch?: {
    id: string
    name: string
    status: string
  } | null
  aliases: BranchAlias[]
  taskLinks: BranchTaskLink[]
  timelineEvents?: TimelineEventRecord[]
}

const session = useSessionStore()
const route = useRoute()
const loading = ref(false)
const branchDrawerOpen = ref(false)
const repositories = ref<RepositoryRecord[]>([])
const tasks = ref<TaskRecord[]>([])
const branches = ref<BranchRecord[]>([])
const workflowStatuses = ref<WorkflowStatusRecord[]>([])
const editingBranch = ref<BranchRecord | null>(null)
const repositoryFilter = ref('')
const statusFilter = ref('')
const branchQuery = ref('')
const branchViewMode = ref<'table' | 'kanban'>('table')
const selectedProjectId = computed(() => session.selectedProjectId)
const selectedRepository = computed(() =>
  repositories.value.find((repository) => repository.id === branchForm.repositoryId) ?? null,
)
const branchSourceLocked = computed(
  () =>
    Boolean(selectedRepository.value) &&
    isRuleDrivenBranchType(branchForm.branchType) &&
    !selectedRepository.value?.allowCheckoutSourceOverride,
)
const ruleDrivenBranchHint = computed(() => {
  if (!selectedRepository.value || !isRuleDrivenBranchType(branchForm.branchType)) {
    return ''
  }

  return `Rule: checkout từ ${checkoutSourceForType(selectedRepository.value, branchForm.branchType)}, merge theo kế hoạch ${intendedTargetsForType(selectedRepository.value, branchForm.branchType).join(' -> ')}.`
})
const repositoryOptions = computed(() =>
  repositories.value.map((repository) => ({
    label: repository.name,
    value: repository.id,
  })),
)
const taskOptions = computed(() =>
  tasks.value.map((task) => ({
    label: `${task.code} - ${task.title}`,
    value: task.id,
  })),
)
const sourceBranchOptions = computed(() =>
  branches.value
    .filter((branch) => branch.repositoryId === branchForm.repositoryId && branch.id !== branchForm.id)
    .map((branch) => ({
      label: branch.name,
      value: branch.id,
    })),
)
const branchNameOptions = computed(() => {
  const names = new Set<string>()
  const repository = selectedRepository.value

  if (repository) {
    names.add(repository.defaultBranch)
    names.add(repository.productionBranch)
    names.add(repository.trustSourceBranch)
    names.add(repository.developBranch)
    names.add(activeReleaseName(repository))
  }

  for (const branch of branches.value) {
    if (branch.repositoryId === branchForm.repositoryId && branch.id !== branchForm.id) {
      names.add(branch.name)
      if (branch.checkoutSourceBranch) names.add(branch.checkoutSourceBranch)
      for (const target of branchIntendedMergeTargets(branch)) {
        names.add(target)
      }
      if (branch.actualMergedInto) names.add(branch.actualMergedInto)
    }
  }

  for (const value of [
    branchForm.checkoutSourceBranch,
    branchForm.actualMergedInto,
    branchForm.baseBranch,
    ...branchForm.intendedMergeTargets,
  ]) {
    if (value) {
      names.add(value)
    }
  }

  return Array.from(names)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .map((name) => ({
      label: name,
      value: name,
    }))
})
const branchColumns = [
  { title: 'Branch', key: 'branch' },
  { title: 'Repo', key: 'repository', width: 150 },
  { title: 'Trạng thái', key: 'status', width: 150 },
  { title: 'Task', key: 'tasks', width: 220 },
  { title: 'Luồng', key: 'path', width: 260 },
  { title: '', key: 'actions', width: 260 },
]
const branchViewModeOptions = [
  { label: 'Bảng', value: 'table' },
  { label: 'Kanban', value: 'kanban' },
]
const branchStatusOptions = computed(() => workflowOptions(workflowStatuses.value, 'BRANCH'))
const releaseBranchStatusKeys = ['MERGED_RELEASE', 'MERGED_MAIN']
const branchFormStatusOptions = computed(() => {
  if (branchForm.branchType === 'RELEASE') {
    return branchStatusOptions.value.filter((status) => releaseBranchStatusKeys.includes(status.value))
  }

  return branchStatusOptions.value
})
const branchStatusLocked = computed(() =>
  branchForm.branchType === 'RELEASE' || Boolean(editingBranch.value && isReleaseChildBranch(editingBranch.value)),
)
const branchTypeOptions = [
  { label: 'Feature', value: 'FEATURE' },
  { label: 'Bugfix', value: 'BUGFIX' },
  { label: 'Hotfix', value: 'HOTFIX' },
  { label: 'Release', value: 'RELEASE' },
  { label: 'Support', value: 'SUPPORT' },
]
const branchKanbanColumns = computed(() =>
  branchStatusOptions.value.map((status) => {
    const dropRule = kanbanDropRule(status.value)
    const mainAcceptsReleaseBranch = status.value === 'MERGED_MAIN'
    const releaseAcceptsRollback = status.value === 'MERGED_RELEASE'

    return {
      key: status.value,
      label: status.label,
      color: status.color,
      items: kanbanItemsForStatus(status.value),
      dropDisabled: !dropRule.allowKanbanDrop && !mainAcceptsReleaseBranch && !releaseAcceptsRollback,
      hint: mainAcceptsReleaseBranch
        ? 'Kéo release'
        : releaseAcceptsRollback
          ? 'Có thể trả nhầm'
          : !dropRule.allowKanbanDrop
            ? 'Cần action'
            : dropRule.requiresConfirmation
              ? 'Cần xác nhận'
              : '',
      emptyText: 'Không có branch',
    }
  }),
)
const branchesNotMain = computed(() =>
  branches.value.filter((branch) => branch.status !== 'MERGED_MAIN'),
)
const branchForm = reactive({
  id: '',
  repositoryId: '',
  sourceBranchId: null as string | null,
  name: '',
  shortName: '',
  branchType: 'FEATURE',
  status: 'CODING',
  checkoutSourceBranch: 'main',
  intendedMergeTargets: [] as string[],
  actualMergedInto: '',
  baseBranch: '',
  mergeRequestUrl: '',
  releaseCycleDate: '',
  aliasesText: '',
  taskIds: [] as string[],
  inheritTaskLinks: true,
  createRemote: false,
})
const releaseActionOpen = ref(false)
const releaseActionSaving = ref(false)
const releaseActionBranch = ref<BranchRecord | null>(null)
const releaseActionTarget = ref('')
const draggedReleaseChildId = ref('')
const releaseActionTitle = computed(() =>
  releaseActionBranch.value?.status === 'MERGED_RELEASE' ? 'Đổi release branch' : 'Gắn release branch',
)
const releaseActionOptions = computed(() => {
  const branch = releaseActionBranch.value

  if (!branch) {
    return []
  }

  const names = new Set<string>()

  names.add(activeReleaseName(branch.repository))

  for (const target of branchIntendedMergeTargets(branch)) {
    if (target.startsWith('release/')) {
      names.add(target)
    }
  }

  if (branch.actualMergedInto?.startsWith('release/')) {
    names.add(branch.actualMergedInto)
  }

  for (const releaseBranch of branches.value) {
    if (releaseBranch.repositoryId === branch.repositoryId && releaseBranch.branchType === 'RELEASE') {
      names.add(releaseBranch.name)
    }
  }

  return Array.from(names)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .map((name) => ({ value: name, label: name }))
})

function dateValue(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function todayReleaseName(pattern: string) {
  const date = new Date()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())

  return pattern.replace('DD', day).replace('MM', month).replace('YYYY', year)
}

function dateToken(date = new Date()) {
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear()),
  ].join('')
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
}

function splitBranchTargets(value: string | null) {
  return uniqueValues((value ?? '').split(/[\n,]/g))
}

function activeReleaseName(repository: RepositoryRecord | null) {
  if (!repository) {
    return ''
  }

  return repository.activeReleaseCycle?.name || todayReleaseName(repository.releaseBranchPattern)
}

function isRuleDrivenBranchType(branchType: string) {
  return branchType === 'FEATURE' || branchType === 'HOTFIX'
}

function materializeTargets(value: string, repository: RepositoryRecord) {
  return splitBranchTargets(value)
    .map((target) =>
      target
        .replaceAll('{develop}', repository.developBranch)
        .replaceAll('{activeRelease}', activeReleaseName(repository))
        .replaceAll('{production}', repository.productionBranch)
        .replaceAll('{main}', repository.productionBranch),
    )
    .filter(Boolean)
}

function defaultIntendedMergeTargets(repository: RepositoryRecord | null) {
  if (!repository) {
    return []
  }

  return materializeTargets(repository.featurePlannedTargets, repository)
}

function intendedTargetsForType(repository: RepositoryRecord | null, branchType: string) {
  if (!repository) {
    return []
  }

  if (branchType === 'HOTFIX') {
    return materializeTargets(repository.hotfixPlannedTargets, repository)
  }

  if (branchType === 'FEATURE') {
    return materializeTargets(repository.featurePlannedTargets, repository)
  }

  if (branchType === 'RELEASE') {
    return [repository.productionBranch]
  }

  return defaultIntendedMergeTargets(repository)
}

function checkoutSourceForType(repository: RepositoryRecord | null, branchType: string) {
  if (!repository) {
    return 'main'
  }

  if (isRuleDrivenBranchType(branchType) && !repository.allowCheckoutSourceOverride) {
    return repository.trustSourceBranch
  }

  if (branchType === 'RELEASE') {
    return repository.productionBranch
  }

  return repository.defaultBranch
}

function branchNameFromPattern(pattern: string, task: TaskRecord) {
  return pattern
    .replaceAll('{jiraCode}', task.code)
    .replaceAll('{taskCode}', task.code)
    .replaceAll('{slug}', slug(task.title) || 'task')
    .replaceAll('{date}', dateToken())
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function branchAliasText(branch: BranchRecord) {
  return branch.aliases.map((alias) => alias.alias).join(', ')
}

function branchSourceText(branch: BranchRecord) {
  return branch.sourceBranch?.name ?? branch.checkoutSourceBranch ?? branch.baseBranch ?? '-'
}

function branchIntendedMergeTargets(branch: BranchRecord) {
  return splitBranchTargets(branch.intendedMergeTarget)
}

function branchActualTargetText(branch: BranchRecord) {
  return branch.actualMergedInto || 'Chưa merge'
}

function branchReleaseTarget(branch: BranchRecord) {
  const targets = branchIntendedMergeTargets(branch)

  return targets.find((target) => target.startsWith('release/')) ?? targets[0] ?? todayReleaseName(branch.repository.releaseBranchPattern)
}

function branchStatusLabel(status: string) {
  return statusMeta(workflowStatuses.value, 'BRANCH', status).label
}

function branchStatusColor(status: string) {
  return statusMeta(workflowStatuses.value, 'BRANCH', status).color
}

function branchTypeTagColor(branchType: string) {
  return branchType === 'RELEASE' ? 'gold' : undefined
}

function sortBranchesByManualOrder(branchList: BranchRecord[]) {
  return [...branchList].sort((left, right) => {
    const orderDelta = (left.sortOrder ?? 0) - (right.sortOrder ?? 0)

    if (orderDelta !== 0) {
      return orderDelta
    }

    return left.createdAt.localeCompare(right.createdAt) || left.name.localeCompare(right.name)
  })
}

function isReleaseBranch(branch: BranchRecord) {
  return branch.branchType === 'RELEASE'
}

function isReleaseChildStatus(status: string) {
  return status === 'MERGED_RELEASE' || status === 'MERGED_MAIN'
}

function isReleaseChildBranch(branch: BranchRecord) {
  return !isReleaseBranch(branch) && Boolean(branch.releaseCycleId) && isReleaseChildStatus(branch.status)
}

function isChildOfReleaseParent(branch: BranchRecord, parentBranch: BranchRecord) {
  return (
    isReleaseBranch(parentBranch) &&
    isReleaseChildBranch(branch) &&
    branch.id !== parentBranch.id &&
    branch.releaseCycleId === parentBranch.releaseCycleId &&
    branch.status === parentBranch.status
  )
}

function hasVisibleReleaseParent(branch: BranchRecord) {
  if (!isReleaseChildBranch(branch)) {
    return false
  }

  return branches.value.some((parentBranch) => isChildOfReleaseParent(branch, parentBranch))
}

function releaseChildBranches(parentBranch: BranchRecord) {
  return sortBranchesByManualOrder(branches.value.filter((branch) => isChildOfReleaseParent(branch, parentBranch)))
}

function releaseChildSummary(parentBranch: BranchRecord) {
  const childBranches = releaseChildBranches(parentBranch)

  if (!childBranches.length) {
    return 'Chưa có nhánh con'
  }

  return `${childBranches.length} nhánh con`
}

function kanbanItemsForStatus(status: string) {
  return sortBranchesByManualOrder(branches.value.filter((branch) => branch.status === status && !hasVisibleReleaseParent(branch)))
}

function canMergeRelease(branch: BranchRecord) {
  return branch.branchType !== 'RELEASE' && branch.status !== 'MERGED_MAIN'
}

function canMergeMain(branch: BranchRecord) {
  return branch.branchType === 'RELEASE' || branch.repository.allowDirectTaskBranchMainMerge
}

function canDeleteBranch(branch: BranchRecord) {
  if (branch.status === 'MERGED_MAIN') {
    return false
  }

  return !isReleaseBranch(branch) || releaseChildBranches(branch).length === 0
}

function branchStatusOptionsForBranch(branch: BranchRecord) {
  if (branch.branchType === 'RELEASE') {
    return branchStatusOptions.value.filter((status) => releaseBranchStatusKeys.includes(status.value))
  }

  return branchStatusOptions.value
}

function releaseActionLabel(branch: BranchRecord) {
  return branch.status === 'MERGED_RELEASE' ? 'Đổi release' : 'Gắn release'
}

function taskStatusLabel(status: string) {
  return statusMeta(workflowStatuses.value, 'TASK', status).label
}

function kanbanDropRule(status: string) {
  return branchKanbanDropRule(workflowStatuses.value, status)
}

function toErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message
    }
  }

  return fallback
}

function resetBranchForm() {
  const defaultRepository =
    repositories.value.find((repository) => repository.id === session.selectedProject?.defaultRepoId) ??
    repositories.value[0] ??
    null

  branchForm.id = ''
  branchForm.repositoryId = defaultRepository?.id ?? ''
  branchForm.sourceBranchId = null
  branchForm.name = ''
  branchForm.shortName = ''
  branchForm.branchType = 'FEATURE'
  branchForm.status = 'CODING'
  branchForm.checkoutSourceBranch = checkoutSourceForType(defaultRepository, branchForm.branchType)
  branchForm.intendedMergeTargets = intendedTargetsForType(defaultRepository, branchForm.branchType)
  branchForm.actualMergedInto = ''
  branchForm.baseBranch = branchForm.checkoutSourceBranch
  branchForm.mergeRequestUrl = ''
  branchForm.releaseCycleDate = ''
  branchForm.aliasesText = ''
  branchForm.taskIds = []
  branchForm.inheritTaskLinks = true
  branchForm.createRemote = false
  editingBranch.value = null
}

function applyRepositoryDefaults() {
  if (!selectedRepository.value || branchForm.id) {
    return
  }

  branchForm.checkoutSourceBranch = checkoutSourceForType(selectedRepository.value, branchForm.branchType)
  branchForm.baseBranch = branchForm.checkoutSourceBranch
  branchForm.intendedMergeTargets = intendedTargetsForType(selectedRepository.value, branchForm.branchType)
}

function applyBranchRuleDefaults() {
  if (!selectedRepository.value || branchForm.id) {
    return
  }

  branchForm.checkoutSourceBranch = checkoutSourceForType(selectedRepository.value, branchForm.branchType)
  branchForm.baseBranch = branchForm.checkoutSourceBranch
  branchForm.intendedMergeTargets = intendedTargetsForType(selectedRepository.value, branchForm.branchType)

  if (branchSourceLocked.value) {
    branchForm.sourceBranchId = null
  }

  if (branchForm.branchType === 'RELEASE' && !branchForm.name) {
    branchForm.name = activeReleaseName(selectedRepository.value)
  }

  if (branchForm.branchType === 'RELEASE') {
    branchForm.status = 'MERGED_RELEASE'
  }
}

function openCreateBranchDrawer() {
  resetBranchForm()
  branchDrawerOpen.value = true
}

async function openBranchDrawer(branch: BranchRecord) {
  const { data } = await api.get<BranchRecord>(`/api/branches/${branch.id}`)

  editingBranch.value = data
  branchForm.id = data.id
  branchForm.repositoryId = data.repositoryId
  branchForm.sourceBranchId = data.sourceBranchId
  branchForm.name = data.name
  branchForm.shortName = data.shortName ?? ''
  branchForm.branchType = data.branchType
  branchForm.status = data.status
  branchForm.checkoutSourceBranch = data.checkoutSourceBranch ?? data.repository.defaultBranch
  branchForm.intendedMergeTargets = branchIntendedMergeTargets(data)
  branchForm.actualMergedInto = data.actualMergedInto ?? ''
  branchForm.baseBranch = data.baseBranch ?? branchForm.checkoutSourceBranch
  branchForm.mergeRequestUrl = data.mergeRequestUrl ?? ''
  branchForm.releaseCycleDate = dateValue(data.releaseCycleDate)
  branchForm.aliasesText = data.aliases.map((alias) => alias.alias).join('\n')
  branchForm.taskIds = data.taskLinks.map((link) => link.task.id)
  branchForm.inheritTaskLinks = true
  branchForm.createRemote = false
  branchDrawerOpen.value = true
}

async function openBranchById(branchId: string) {
  const { data } = await api.get<BranchRecord>(`/api/branches/${branchId}`)

  editingBranch.value = data
  branchForm.id = data.id
  branchForm.repositoryId = data.repositoryId
  branchForm.sourceBranchId = data.sourceBranchId
  branchForm.name = data.name
  branchForm.shortName = data.shortName ?? ''
  branchForm.branchType = data.branchType
  branchForm.status = data.status
  branchForm.checkoutSourceBranch = data.checkoutSourceBranch ?? data.repository.defaultBranch
  branchForm.intendedMergeTargets = branchIntendedMergeTargets(data)
  branchForm.actualMergedInto = data.actualMergedInto ?? ''
  branchForm.baseBranch = data.baseBranch ?? branchForm.checkoutSourceBranch
  branchForm.mergeRequestUrl = data.mergeRequestUrl ?? ''
  branchForm.releaseCycleDate = dateValue(data.releaseCycleDate)
  branchForm.aliasesText = data.aliases.map((alias) => alias.alias).join('\n')
  branchForm.taskIds = data.taskLinks.map((link) => link.task.id)
  branchForm.inheritTaskLinks = true
  branchForm.createRemote = false
  branchDrawerOpen.value = true
}

async function loadRepositories() {
  if (!selectedProjectId.value) {
    repositories.value = []
    return
  }

  const { data } = await api.get<RepositoryRecord[]>(`/api/projects/${selectedProjectId.value}/repositories`)

  repositories.value = data
}

async function loadTasks() {
  if (!selectedProjectId.value) {
    tasks.value = []
    return
  }

  const { data } = await api.get<TaskRecord[]>(`/api/tasks?projectId=${selectedProjectId.value}`)

  tasks.value = data
}

async function loadWorkflowStatuses() {
  if (!selectedProjectId.value) {
    workflowStatuses.value = []
    return
  }

  try {
    const { data } = await api.get<WorkflowStatusRecord[]>(`/api/workflow-statuses?projectId=${selectedProjectId.value}`)

    workflowStatuses.value = data
  } catch (error) {
    workflowStatuses.value = []
    message.error(toErrorMessage(error, 'Không tải được cấu hình workflow, tạm dùng trạng thái mặc định.'))
  }
}

async function loadBranches() {
  const params = new URLSearchParams()

  if (selectedProjectId.value) {
    params.set('projectId', selectedProjectId.value)
  }

  if (repositoryFilter.value) {
    params.set('repositoryId', repositoryFilter.value)
  }

  if (statusFilter.value) {
    params.set('status', statusFilter.value)
  }

  if (branchQuery.value) {
    params.set('q', branchQuery.value)
  }

  const { data } = await api.get<BranchRecord[]>(`/api/branches?${params.toString()}`)

  branches.value = data
}

async function refreshBranches() {
  loading.value = true

  try {
    await Promise.all([loadRepositories(), loadTasks(), loadWorkflowStatuses(), loadBranches()])

    if (!branchForm.repositoryId) {
      resetBranchForm()
    }
  } finally {
    loading.value = false
  }
}

async function suggestBranchName() {
  const taskId = branchForm.taskIds[0]
  const task = tasks.value.find((item) => item.id === taskId)

  if (!task) {
    return
  }

  try {
    const { data } = await api.get<{ name: string }>(
      `/api/branches/name-suggestion?projectId=${selectedProjectId.value}&repositoryId=${branchForm.repositoryId}&taskId=${task.id}&branchType=${branchForm.branchType}`,
    )

    branchForm.name = data.name
  } catch {
    if (selectedRepository.value && branchForm.branchType === 'HOTFIX') {
      branchForm.name = branchNameFromPattern(selectedRepository.value.hotfixNamePattern, task)
      return
    }

    if (selectedRepository.value && branchForm.branchType === 'FEATURE') {
      branchForm.name = branchNameFromPattern(selectedRepository.value.featureNamePattern, task)
      return
    }

    const prefix = branchForm.branchType === 'BUGFIX' ? 'bugfix' : 'feature'
    branchForm.name = `${prefix}/${task.code}-${slug(task.title) || 'task'}`
  }
}

function handleSourceBranchChange(sourceBranchId: string | null) {
  if (branchSourceLocked.value) {
    branchForm.sourceBranchId = null
    branchForm.checkoutSourceBranch = checkoutSourceForType(selectedRepository.value, branchForm.branchType)
    branchForm.baseBranch = branchForm.checkoutSourceBranch
    return
  }

  const sourceBranch = branches.value.find((branch) => branch.id === sourceBranchId)

  branchForm.sourceBranchId = sourceBranchId

  if (sourceBranch) {
    branchForm.checkoutSourceBranch = sourceBranch.name
    branchForm.baseBranch = sourceBranch.name
    branchForm.intendedMergeTargets = branchIntendedMergeTargets(sourceBranch)
    if (!branchForm.intendedMergeTargets.length) {
      branchForm.intendedMergeTargets = defaultIntendedMergeTargets(selectedRepository.value)
    }
  }
}

function handleCheckoutSourceBranchChange(value: unknown) {
  if (branchSourceLocked.value) {
    branchForm.checkoutSourceBranch = checkoutSourceForType(selectedRepository.value, branchForm.branchType)
    branchForm.baseBranch = branchForm.checkoutSourceBranch
    return
  }

  const branchName = typeof value === 'string' ? value : ''

  branchForm.checkoutSourceBranch = branchName
  branchForm.baseBranch = branchName

  const sourceBranch = branches.value.find(
    (branch) => branch.repositoryId === branchForm.repositoryId && branch.name === branchName && branch.id !== branchForm.id,
  )

  branchForm.sourceBranchId = sourceBranch?.id ?? null
}

function handleIntendedMergeTargetChange(value: unknown) {
  branchForm.intendedMergeTargets = Array.isArray(value) ? uniqueValues(value.map((item) => (typeof item === 'string' ? item : ''))) : []
}

function handleActualMergedIntoChange(value: unknown) {
  branchForm.actualMergedInto = typeof value === 'string' ? value : ''
}

async function submitBranch() {
  if (!branchForm.repositoryId || !branchForm.name.trim()) {
    return
  }

  const payload = {
    repositoryId: branchForm.repositoryId,
    sourceBranchId: branchForm.sourceBranchId,
    name: branchForm.name,
    shortName: branchForm.shortName,
    branchType: branchForm.branchType,
    status: branchForm.status,
    checkoutSourceBranch: branchForm.checkoutSourceBranch,
    intendedMergeTarget: branchForm.intendedMergeTargets,
    actualMergedInto: branchForm.actualMergedInto,
    baseBranch: branchForm.baseBranch,
    mergeRequestUrl: branchForm.mergeRequestUrl,
    releaseCycleDate: branchForm.releaseCycleDate,
    aliases: branchForm.aliasesText,
    taskIds: branchForm.taskIds,
    inheritTaskLinks: branchForm.inheritTaskLinks,
    createRemote: branchForm.createRemote,
  }

  if (branchForm.id) {
    await api.patch(`/api/branches/${branchForm.id}`, payload)
  } else {
    await api.post('/api/branches', payload)
  }

  branchDrawerOpen.value = false
  resetBranchForm()
  await refreshBranches()
}

function openReleaseAction(branch: BranchRecord) {
  releaseActionBranch.value = branch
  releaseActionTarget.value = branch.actualMergedInto?.startsWith('release/')
    ? branch.actualMergedInto
    : branchReleaseTarget(branch) || activeReleaseName(branch.repository)
  releaseActionOpen.value = true
}

async function submitReleaseAction() {
  const branch = releaseActionBranch.value
  const targetBranch = releaseActionTarget.value.trim()

  if (!branch || !targetBranch) {
    message.warning('Chọn release branch trước khi gắn.')
    return
  }

  try {
    releaseActionSaving.value = true
    await api.post(`/api/branches/${branch.id}/mark-merged-release`, { targetBranch })
    releaseActionOpen.value = false
    releaseActionBranch.value = null
    releaseActionTarget.value = ''
    await refreshBranches()
    if (editingBranch.value?.id === branch.id) {
      await openBranchById(branch.id)
    }
  } catch (error) {
    message.error(toErrorMessage(error, 'Không thể merge release.'))
  } finally {
    releaseActionSaving.value = false
  }
}

async function markMergedMain(branch: BranchRecord) {
  const warnings =
    branch.branchType === 'RELEASE'
      ? []
      : branch.taskLinks
          .filter((link) => !link.task.releaseReadyAt && link.task.status !== 'DONE')
          .map((link) => `${link.task.code} chưa được đánh dấu sẵn sàng main.`)

  if (warnings.length && !window.confirm(`${warnings.join('\n')}\nVẫn ghi nhận merge main?`)) {
    return
  }

  try {
    await api.post(`/api/branches/${branch.id}/mark-merged-main`, {
      targetBranch: branch.repository.productionBranch,
      confirmed: true,
    })
    await refreshBranches()
    await loadTasks()
  } catch (error) {
    message.error(toErrorMessage(error, 'Không thể merge main.'))
  }
}

async function deleteBranch(branch: BranchRecord, closeActions?: () => void) {
  if (!canDeleteBranch(branch)) {
    message.warning('Branch này chưa thể xóa.')
    return
  }

  if (!window.confirm(`Xóa branch ${branch.name}? Branch đã vào main sẽ không được xóa.`)) {
    return
  }

  try {
    await api.delete(`/api/branches/${branch.id}`)
    closeActions?.()
    message.success(`Đã xóa ${branch.name}.`)

    if (editingBranch.value?.id === branch.id) {
      branchDrawerOpen.value = false
      editingBranch.value = null
      resetBranchForm()
    }

    await refreshBranches()
    await loadTasks()
  } catch (error) {
    message.error(toErrorMessage(error, 'Không thể xóa branch.'))
  }
}

function branchKanbanItemKey(item: Record<string, unknown>) {
  return String(item.id)
}

function branchKanbanColumnTestId(column: { key: string }) {
  return `kanban-column-${column.key}`
}

function branchKanbanCardTestId(item: Record<string, unknown>) {
  return `branch-card-${String(item.name)}`
}

function branchKanbanCardClass(item: Record<string, unknown>) {
  return isReleaseBranch(branchFromKanban(item)) ? 'app-kanban-card-branch-release' : ''
}

function branchFromKanban(item: Record<string, unknown>) {
  return item as unknown as BranchRecord
}

function openBranchFromKanban(payload: { item: Record<string, unknown> }) {
  void openBranchDrawer(branchFromKanban(payload.item))
}

function moveBranchBefore(branchList: BranchRecord[], movingBranchId: string, targetBranchId: string) {
  const movingBranch = branchList.find((branch) => branch.id === movingBranchId)

  if (!movingBranch) {
    return branchList
  }

  const nextBranches = branchList.filter((branch) => branch.id !== movingBranchId)
  const targetIndex = nextBranches.findIndex((branch) => branch.id === targetBranchId)

  if (targetIndex === -1) {
    return branchList
  }

  nextBranches.splice(targetIndex, 0, movingBranch)

  return nextBranches
}

async function reorderBranches(branchIds: string[], successText: string) {
  if (branchIds.length < 2) {
    return
  }

  try {
    await api.post('/api/branches/reorder', { branchIds })
    await refreshBranches()
    message.success(successText)
  } catch (error) {
    message.error(toErrorMessage(error, 'Không thể cập nhật thứ tự branch.'))
  }
}

function branchKanbanColumnByStatus(status: string) {
  return branchKanbanColumns.value.find((column) => column.key === status) ?? null
}

function showBlockedKanbanDrop(payload: { column: { key: string } }) {
  const rule = kanbanDropRule(payload.column.key)

  message.warning(rule.dropBlockReason ?? 'Không thể kéo branch vào trạng thái này.')
}

async function moveBranchFromAction(item: Record<string, unknown>, statusValue: unknown, closeActions: () => void) {
  if (typeof statusValue !== 'string') {
    return
  }

  const column = branchKanbanColumnByStatus(statusValue)

  if (!column) {
    return
  }

  await dropBranchIntoStatus({ item, column })
  closeActions()
}

async function reorderKanbanItem(payload: {
  item: Record<string, unknown>
  targetItem: Record<string, unknown>
  column: { key: string; items: Record<string, unknown>[] }
}) {
  const branch = branchFromKanban(payload.item)
  const targetBranch = branchFromKanban(payload.targetItem)

  if (branch.id === targetBranch.id) {
    return
  }

  if (branch.status !== targetBranch.status || branch.status !== payload.column.key) {
    return
  }

  if (isReleaseChildBranch(branch) || isReleaseChildBranch(targetBranch)) {
    message.warning('Nhánh con chỉ sắp xếp bên trong release branch.')
    return
  }

  const orderedBranches = moveBranchBefore(payload.column.items.map(branchFromKanban), branch.id, targetBranch.id)

  await reorderBranches(orderedBranches.map((item) => item.id), 'Đã cập nhật thứ tự branch.')
}

function startReleaseChildDrag(childBranch: BranchRecord, event: DragEvent) {
  draggedReleaseChildId.value = childBranch.id
  event.dataTransfer?.setData('text/plain', childBranch.id)

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function clearReleaseChildDrag() {
  draggedReleaseChildId.value = ''
}

async function dropReleaseChildBefore(parentBranch: BranchRecord, targetChildBranch: BranchRecord, event: DragEvent) {
  const draggedBranchId = event.dataTransfer?.getData('text/plain') || draggedReleaseChildId.value

  if (!draggedBranchId || draggedBranchId === targetChildBranch.id) {
    clearReleaseChildDrag()
    return
  }

  const childBranches = releaseChildBranches(parentBranch)
  const movingBranch = childBranches.find((branch) => branch.id === draggedBranchId)

  if (!movingBranch || movingBranch.releaseCycleId !== targetChildBranch.releaseCycleId) {
    clearReleaseChildDrag()
    return
  }

  const orderedBranches = moveBranchBefore(childBranches, draggedBranchId, targetChildBranch.id)

  await reorderBranches(orderedBranches.map((branch) => branch.id), 'Đã cập nhật thứ tự nhánh con.')
  clearReleaseChildDrag()
}

async function dropBranchIntoStatus(payload: { item: Record<string, unknown>; column: { key: string } }) {
  const branch = payload.item as unknown as BranchRecord
  const status = payload.column.key
  const rule = kanbanDropRule(status)

  if (branch.status === status) {
    return
  }

  if (isReleaseChildBranch(branch)) {
    message.warning('Nhánh con trong release sẽ đi theo release branch, không kéo riêng.')
    return
  }

  if (branch.branchType === 'RELEASE') {
    if (branch.status === 'MERGED_MAIN' && status === 'MERGED_RELEASE') {
      try {
        await api.post(`/api/branches/${branch.id}/move-status`, {
          status,
          confirmed: true,
        })
        message.success(`Đã đưa ${branch.name} về release.`)
        await refreshBranches()
        await loadTasks()
      } catch (error) {
        message.error(toErrorMessage(error, 'Không thể đưa release branch về release.'))
      }
      return
    }

    if (status !== 'MERGED_MAIN') {
      message.warning('Release branch chỉ nằm ở release, sau đó kéo vào main.')
      return
    }

    await markMergedMain(branch)
    return
  }

  if (!rule.allowKanbanDrop) {
    message.warning(rule.dropBlockReason ?? 'Không thể kéo branch vào trạng thái này.')
    return
  }

  const confirmed = rule.requiresConfirmation
    ? window.confirm(`Chuyển ${branch.name} sang ${branchStatusLabel(status)}?`)
    : true

  if (!confirmed) {
    return
  }

  try {
    await api.post(`/api/branches/${branch.id}/move-status`, {
      status,
      confirmed,
    })
    message.success(`Đã chuyển ${branch.name} sang ${branchStatusLabel(status)}.`)
    await refreshBranches()
  } catch (error) {
    message.error(toErrorMessage(error, 'Không thể chuyển trạng thái branch.'))
  }
}

watch(selectedProjectId, refreshBranches)
watch([repositoryFilter, statusFilter, branchQuery], loadBranches)
watch(() => branchForm.repositoryId, applyRepositoryDefaults)
watch(
  () => [branchForm.repositoryId, branchForm.branchType],
  applyBranchRuleDefaults,
)
watch(
  () => [branchForm.repositoryId, branchForm.branchType, branchForm.taskIds[0]],
  () => {
    if (!branchForm.id && branchForm.taskIds[0] && isRuleDrivenBranchType(branchForm.branchType)) {
      void suggestBranchName()
    }
  },
)
watch(
  () => route.query.branchId,
  (branchId) => {
    if (typeof branchId === 'string') {
      void openBranchById(branchId)
    }
  },
)
onMounted(refreshBranches)
onMounted(() => {
  if (typeof route.query.branchId === 'string') {
    void openBranchById(route.query.branchId)
  }
})
</script>

<template>
  <section class="page-heading">
    <div>
      <h1>Nhánh</h1>
      <p>Theo dõi branch đang checkout từ đâu, merge vào đâu, và task nào sẽ done khi vào main</p>
    </div>
    <a-space>
      <a-button @click="refreshBranches">Làm mới</a-button>
      <a-button type="primary" @click="openCreateBranchDrawer">Tạo branch</a-button>
    </a-space>
  </section>

  <a-card v-if="branchesNotMain.length" class="quick-note-card" title="Branch chưa vào main">
    <a-space wrap>
      <a-tag v-for="branch in branchesNotMain" :key="branch.id" class="clickable-tag" @click="openBranchDrawer(branch)">
        {{ branch.name }}
      </a-tag>
    </a-space>
  </a-card>

  <a-card class="settings-card">
    <a-space class="filter-row">
      <a-select
        v-model:value="repositoryFilter"
        class="filter-control"
        allow-clear
        placeholder="Repository"
        :options="repositoryOptions"
      />
      <a-select
        v-model:value="statusFilter"
        class="filter-control"
        allow-clear
        placeholder="Trạng thái"
        :options="branchStatusOptions"
      />
      <a-input-search v-model:value="branchQuery" class="filter-control" placeholder="Tìm branch/task" />
      <a-segmented v-model:value="branchViewMode" :options="branchViewModeOptions" />
    </a-space>

    <a-table
      v-if="branchViewMode === 'table'"
      row-key="id"
      size="small"
      :loading="loading"
      :columns="branchColumns"
      :data-source="branches"
      :pagination="{ pageSize: 10 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'branch'">
          <strong>{{ record.name }}</strong>
          <div class="muted-text">
            {{ record.branchType }} {{ record.remoteCreated ? '- remote' : '- local' }}
          </div>
          <div v-if="record.aliases.length" class="muted-text">
            Alias: {{ branchAliasText(record) }}
          </div>
        </template>
        <template v-if="column.key === 'repository'">
          {{ record.repository.name }}
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="branchStatusColor(record.status)">{{ branchStatusLabel(record.status) }}</a-tag>
        </template>
        <template v-if="column.key === 'tasks'">
          <a-space wrap>
            <a-tag v-for="link in record.taskLinks" :key="link.id">
              {{ link.task.code }}
            </a-tag>
          </a-space>
          <span v-if="!record.taskLinks.length" class="muted-text">Chưa link task</span>
        </template>
        <template v-if="column.key === 'path'">
          <div class="branch-flow">
            <div class="branch-flow-row">
              <span>Tạo từ</span>
              <strong>{{ branchSourceText(record) }}</strong>
            </div>
            <div class="branch-flow-row">
              <span>Dự định</span>
              <a-space v-if="branchIntendedMergeTargets(record).length" class="branch-flow-tags" wrap>
                <a-tag v-for="target in branchIntendedMergeTargets(record)" :key="target">{{ target }}</a-tag>
              </a-space>
              <strong v-else>-</strong>
            </div>
            <div class="branch-flow-row">
              <span>Thực tế</span>
              <strong :class="{ 'muted-text': !record.actualMergedInto }">{{ branchActualTargetText(record) }}</strong>
            </div>
          </div>
        </template>
        <template v-if="column.key === 'actions'">
          <a-space wrap>
            <a-button size="small" @click="openBranchDrawer(record)">Chi tiết</a-button>
            <a-button v-if="canMergeRelease(record)" size="small" @click="openReleaseAction(record)">{{ releaseActionLabel(record) }}</a-button>
            <a-button v-if="canMergeMain(record)" size="small" type="primary" @click="markMergedMain(record)">Merge main</a-button>
            <a-button v-if="canDeleteBranch(record)" size="small" danger @click="deleteBranch(record)">Xóa</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <AppKanbanBoard
      v-else
      :columns="branchKanbanColumns"
      board-test-id="branch-kanban"
      :get-item-key="branchKanbanItemKey"
      :get-column-test-id="branchKanbanColumnTestId"
      :get-card-test-id="branchKanbanCardTestId"
      :get-item-class="branchKanbanCardClass"
      @blocked-drop="showBlockedKanbanDrop"
      @item-click="openBranchFromKanban"
      @item-drop="dropBranchIntoStatus"
      @item-reorder="reorderKanbanItem"
    >
      <template #card="{ item }">
        <div class="app-kanban-card-title">
          <strong>{{ branchFromKanban(item).name }}</strong>
          <a-tag class="branch-kanban-status-tag" :color="branchStatusColor(branchFromKanban(item).status)">
            {{ branchStatusLabel(branchFromKanban(item).status) }}
          </a-tag>
        </div>
        <div class="branch-kanban-card-meta">
          <span>{{ branchFromKanban(item).repository.name }}</span>
          <a-tag :color="branchTypeTagColor(branchFromKanban(item).branchType)">{{ branchFromKanban(item).branchType }}</a-tag>
        </div>
        <div class="branch-flow branch-flow-card">
          <div class="branch-flow-row">
            <span>Tạo từ</span>
            <strong>{{ branchSourceText(branchFromKanban(item)) }}</strong>
          </div>
          <div class="branch-flow-row">
            <span>Dự định</span>
            <a-space v-if="branchIntendedMergeTargets(branchFromKanban(item)).length" class="branch-flow-tags" wrap>
              <a-tag v-for="target in branchIntendedMergeTargets(branchFromKanban(item))" :key="target">{{ target }}</a-tag>
            </a-space>
            <strong v-else>-</strong>
          </div>
          <div class="branch-flow-row">
            <span>Thực tế</span>
            <strong :class="{ 'muted-text': !branchFromKanban(item).actualMergedInto }">
              {{ branchActualTargetText(branchFromKanban(item)) }}
            </strong>
          </div>
        </div>
        <div class="app-kanban-card-tags">
          <a-tag v-for="link in branchFromKanban(item).taskLinks" :key="link.id">{{ link.task.code }}</a-tag>
          <a-tag v-if="!branchFromKanban(item).taskLinks.length">Chưa link task</a-tag>
        </div>
        <div
          v-if="isReleaseBranch(branchFromKanban(item))"
          class="branch-release-tree"
          draggable="false"
          @click.stop
          @dragstart.stop.prevent
        >
          <div class="branch-release-tree-head">
            <span>Nhánh trong release</span>
            <a-tag color="gold">{{ releaseChildSummary(branchFromKanban(item)) }}</a-tag>
          </div>
          <button
            v-for="childBranch in releaseChildBranches(branchFromKanban(item))"
            :key="childBranch.id"
            class="branch-release-child"
            type="button"
            draggable="true"
            :data-testid="`release-child-${childBranch.name}`"
            @click.stop="openBranchDrawer(childBranch)"
            @dragstart.stop="startReleaseChildDrag(childBranch, $event)"
            @dragover.stop.prevent
            @drop.stop.prevent="dropReleaseChildBefore(branchFromKanban(item), childBranch, $event)"
            @dragend.stop="clearReleaseChildDrag"
          >
            <strong>{{ childBranch.name }}</strong>
            <span>{{ childBranch.status === 'MERGED_MAIN' ? 'Đã theo main' : 'Đã vào release' }}</span>
            <span class="branch-release-child-tasks">
              <a-tag v-for="link in childBranch.taskLinks" :key="link.id">{{ link.task.code }}</a-tag>
              <a-tag v-if="!childBranch.taskLinks.length">Chưa link task</a-tag>
            </span>
          </button>
        </div>
        <div class="app-kanban-card-actions branch-kanban-card-actions">
          <a-button size="small" @click.stop="openBranchDrawer(branchFromKanban(item))">Chi tiết</a-button>
          <a-button v-if="canMergeRelease(branchFromKanban(item))" size="small" @click.stop="openReleaseAction(branchFromKanban(item))">
            {{ releaseActionLabel(branchFromKanban(item)) }}
          </a-button>
          <a-button v-if="canMergeMain(branchFromKanban(item))" size="small" type="primary" @click.stop="markMergedMain(branchFromKanban(item))">Merge main</a-button>
          <a-button v-if="canDeleteBranch(branchFromKanban(item))" size="small" danger @click.stop="deleteBranch(branchFromKanban(item))">Xóa</a-button>
        </div>
      </template>
      <template #card-actions="{ item, closeActions }">
        <a-select
          class="kanban-action-select"
          :value="branchFromKanban(item).status"
          :options="branchStatusOptionsForBranch(branchFromKanban(item))"
          placeholder="Chuyển trạng thái"
          @click.stop
          @change="moveBranchFromAction(item, $event, closeActions)"
        />
        <a-button
          v-if="canDeleteBranch(branchFromKanban(item))"
          danger
          block
          size="small"
          @click.stop="deleteBranch(branchFromKanban(item), closeActions)"
        >
          Xóa branch
        </a-button>
      </template>
    </AppKanbanBoard>
  </a-card>

  <a-modal
    v-model:open="releaseActionOpen"
    :title="releaseActionTitle"
    ok-text="Gắn release"
    cancel-text="Hủy"
    :confirm-loading="releaseActionSaving"
    @ok="submitReleaseAction"
  >
    <a-form layout="vertical">
      <a-form-item label="Release branch">
        <a-auto-complete
          v-model:value="releaseActionTarget"
          :options="releaseActionOptions"
          placeholder="release/08072026"
        />
      </a-form-item>
      <a-alert
        v-if="releaseActionBranch"
        type="info"
        show-icon
        :message="`Release branch là branch riêng checkout từ ${releaseActionBranch.repository.productionBranch}, nhận merge từ task branch, rồi merge vào ${releaseActionBranch.repository.productionBranch}.`"
      />
    </a-form>
  </a-modal>

  <a-drawer v-model:open="branchDrawerOpen" :title="branchForm.id ? 'Chi tiết branch' : 'Tạo branch'" width="720">
    <a-form layout="vertical" :model="branchForm" @finish="submitBranch">
      <div class="form-grid">
        <a-form-item label="Repository" name="repositoryId" :rules="[{ required: true, message: 'Chọn repository' }]">
          <a-select v-model:value="branchForm.repositoryId" :options="repositoryOptions" />
        </a-form-item>
        <a-form-item label="Loại branch">
          <a-select v-model:value="branchForm.branchType" :options="branchTypeOptions" />
        </a-form-item>
        <a-form-item label="Trạng thái">
          <a-select v-model:value="branchForm.status" :options="branchFormStatusOptions" :disabled="branchStatusLocked" />
        </a-form-item>
      </div>

      <a-form-item label="Task liên quan">
        <a-select
          v-model:value="branchForm.taskIds"
          mode="multiple"
          allow-clear
          placeholder="Chọn task"
          :options="taskOptions"
        />
      </a-form-item>

      <a-space class="form-actions">
        <a-button @click="suggestBranchName">Gợi ý tên branch</a-button>
        <a-checkbox v-model:checked="branchForm.inheritTaskLinks" :disabled="branchSourceLocked">
          Kế thừa task từ branch nguồn
        </a-checkbox>
        <a-checkbox v-if="selectedRepository?.hasGitlabAccessToken" v-model:checked="branchForm.createRemote">
          Tạo trên GitLab
        </a-checkbox>
      </a-space>

      <a-alert
        v-if="ruleDrivenBranchHint"
        class="settings-alert"
        type="info"
        show-icon
        :message="ruleDrivenBranchHint"
      />

      <a-form-item label="Tên branch" name="name" :rules="[{ required: true, message: 'Nhập tên branch' }]">
        <a-input v-model:value="branchForm.name" placeholder="feature/OPS-BE-001" />
      </a-form-item>

      <div class="form-grid">
        <a-form-item label="Branch nguồn trong app">
          <a-select
            :value="branchForm.sourceBranchId"
            allow-clear
            placeholder="Nếu tạo từ branch đã lưu"
            :options="sourceBranchOptions"
            :disabled="branchSourceLocked"
            @change="handleSourceBranchChange"
          />
        </a-form-item>
        <a-form-item label="Tạo/checkout từ branch">
          <a-select
            :value="branchForm.checkoutSourceBranch"
            show-search
            allow-clear
            option-filter-prop="label"
            placeholder="Chọn branch nguồn"
            :options="branchNameOptions"
            :disabled="branchSourceLocked"
            @change="handleCheckoutSourceBranchChange"
          />
        </a-form-item>
      </div>

      <div class="form-grid">
        <a-form-item label="Dự định merge vào">
          <a-select
            :value="branchForm.intendedMergeTargets"
            mode="multiple"
            show-search
            allow-clear
            option-filter-prop="label"
            placeholder="Chọn một hoặc nhiều branch"
            :options="branchNameOptions"
            :disabled="!branchForm.id && isRuleDrivenBranchType(branchForm.branchType)"
            @change="handleIntendedMergeTargetChange"
          />
        </a-form-item>
        <a-form-item label="Thực tế đã merge vào">
          <a-select
            :value="branchForm.actualMergedInto"
            show-search
            allow-clear
            option-filter-prop="label"
            placeholder="Để trống nếu chưa merge"
            :options="branchNameOptions"
            @change="handleActualMergedIntoChange"
          />
        </a-form-item>
      </div>

      <div class="form-grid">
        <a-form-item label="Ngày release">
          <a-input v-model:value="branchForm.releaseCycleDate" type="date" />
        </a-form-item>
      </div>

      <a-form-item label="Merge request URL">
        <a-input v-model:value="branchForm.mergeRequestUrl" />
      </a-form-item>

      <a-form-item label="Alias">
        <a-textarea v-model:value="branchForm.aliasesText" :rows="2" placeholder="Mỗi dòng một alias hoặc cách nhau bằng dấu phẩy" />
      </a-form-item>

      <a-alert
        v-if="branchForm.checkoutSourceBranch && branchForm.name"
        class="settings-alert"
        type="info"
        show-icon
        :message="`Lệnh checkout: git fetch origin && git checkout ${branchForm.checkoutSourceBranch} && git pull origin ${branchForm.checkoutSourceBranch} && git checkout -b ${branchForm.name}`"
      />

      <a-space>
        <a-button type="primary" html-type="submit">{{ branchForm.id ? 'Lưu branch' : 'Tạo branch' }}</a-button>
        <a-button v-if="editingBranch && canMergeRelease(editingBranch)" @click="openReleaseAction(editingBranch)">
          {{ releaseActionLabel(editingBranch) }}
        </a-button>
        <a-button v-if="editingBranch && canMergeMain(editingBranch)" type="primary" @click="markMergedMain(editingBranch)">Merge main</a-button>
        <a-button v-if="editingBranch && canDeleteBranch(editingBranch)" danger @click="deleteBranch(editingBranch)">Xóa branch</a-button>
      </a-space>
    </a-form>

    <template v-if="editingBranch">
      <a-divider>Task linked</a-divider>
      <a-list size="small" :data-source="editingBranch.taskLinks">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta :title="`${item.task.code} - ${item.task.title}`" :description="`${item.role} - ${taskStatusLabel(item.task.status)}`" />
          </a-list-item>
        </template>
      </a-list>

      <a-tabs class="timeline-list">
        <a-tab-pane key="timeline" tab="Timeline">
          <a-timeline>
            <a-timeline-item v-for="event in editingBranch.timelineEvents ?? []" :key="event.id">
              <strong>{{ event.title }}</strong>
              <div class="muted-text">{{ event.description }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-tab-pane>
      </a-tabs>
    </template>
  </a-drawer>
</template>
