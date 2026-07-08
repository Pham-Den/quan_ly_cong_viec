<script setup lang="ts">
import axios from 'axios'
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { api } from '../services/api'
import { branchKanbanDropRule, statusMeta, workflowOptions, type WorkflowStatusRecord } from '../services/workflow'
import { useSessionStore } from '../stores/session'

type RepositoryRecord = {
  id: string
  name: string
  defaultBranch: string
  productionBranch: string
  releaseBranchPattern: string
  hasGitlabAccessToken?: boolean
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
  generatedCheckoutCommand: string | null
  remoteCreated: boolean
  mergedReleaseAt: string | null
  mergedMainAt: string | null
  lineageId: string | null
  repository: RepositoryRecord
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
const draggedBranchId = ref('')
const dragOverStatus = ref('')
const selectedProjectId = computed(() => session.selectedProjectId)
const selectedRepository = computed(() =>
  repositories.value.find((repository) => repository.id === branchForm.repositoryId) ?? null,
)
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
const branchTypeOptions = [
  { label: 'Feature', value: 'FEATURE' },
  { label: 'Bugfix', value: 'BUGFIX' },
  { label: 'Hotfix', value: 'HOTFIX' },
  { label: 'Release', value: 'RELEASE' },
  { label: 'Support', value: 'SUPPORT' },
]
const branchStatusGroups = computed(() =>
  branchStatusOptions.value.map((status) => ({
    ...status,
    color: status.color,
    branches: branches.value.filter((branch) => branch.status === status.value),
  })),
)
const branchesNotMain = computed(() =>
  branches.value.filter((branch) => branch.status !== 'MERGED_MAIN' && branch.status !== 'CLOSED'),
)
const branchForm = reactive({
  id: '',
  repositoryId: '',
  sourceBranchId: null as string | null,
  name: '',
  shortName: '',
  branchType: 'FEATURE',
  status: 'DRAFT',
  checkoutSourceBranch: 'main',
  intendedMergeTarget: '',
  actualMergedInto: '',
  baseBranch: '',
  mergeRequestUrl: '',
  releaseCycleDate: '',
  aliasesText: '',
  taskIds: [] as string[],
  inheritTaskLinks: true,
  createRemote: false,
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

function branchStatusLabel(status: string) {
  return statusMeta(workflowStatuses.value, 'BRANCH', status).label
}

function branchStatusColor(status: string) {
  return statusMeta(workflowStatuses.value, 'BRANCH', status).color
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
  branchForm.status = 'DRAFT'
  branchForm.checkoutSourceBranch = defaultRepository?.defaultBranch ?? 'main'
  branchForm.intendedMergeTarget = defaultRepository ? todayReleaseName(defaultRepository.releaseBranchPattern) : ''
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

  branchForm.checkoutSourceBranch = selectedRepository.value.defaultBranch
  branchForm.baseBranch = selectedRepository.value.defaultBranch
  branchForm.intendedMergeTarget = todayReleaseName(selectedRepository.value.releaseBranchPattern)
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
  branchForm.intendedMergeTarget = data.intendedMergeTarget ?? ''
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
  branchForm.intendedMergeTarget = data.intendedMergeTarget ?? ''
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
      `/api/branches/name-suggestion?projectId=${selectedProjectId.value}&taskId=${task.id}&branchType=${branchForm.branchType}`,
    )

    branchForm.name = data.name
  } catch {
    const prefix = branchForm.branchType === 'HOTFIX' ? 'hotfix' : branchForm.branchType === 'BUGFIX' ? 'bugfix' : 'feature'

    branchForm.name = `${prefix}/${task.code}-${slug(task.title) || 'task'}`
  }
}

function handleSourceBranchChange(sourceBranchId: string | null) {
  const sourceBranch = branches.value.find((branch) => branch.id === sourceBranchId)

  branchForm.sourceBranchId = sourceBranchId

  if (sourceBranch) {
    branchForm.checkoutSourceBranch = sourceBranch.name
    branchForm.baseBranch = sourceBranch.name
    branchForm.intendedMergeTarget = sourceBranch.intendedMergeTarget || selectedRepository.value?.productionBranch || 'main'
  }
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
    intendedMergeTarget: branchForm.intendedMergeTarget,
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

async function markMergedRelease(branch: BranchRecord) {
  const targetBranch = branch.intendedMergeTarget || todayReleaseName(branch.repository.releaseBranchPattern)

  await api.post(`/api/branches/${branch.id}/mark-merged-release`, { targetBranch })
  await refreshBranches()
}

async function markMergedMain(branch: BranchRecord) {
  const warnings = branch.taskLinks
    .filter((link) => !link.task.releaseReadyAt && link.task.status !== 'DONE')
    .map((link) => `${link.task.code} chưa được đánh dấu sẵn sàng main.`)

  if (warnings.length && !window.confirm(`${warnings.join('\n')}\nVẫn ghi nhận merge main?`)) {
    return
  }

  await api.post(`/api/branches/${branch.id}/mark-merged-main`, {
    targetBranch: branch.repository.productionBranch,
    confirmed: true,
  })
  await refreshBranches()
  await loadTasks()
}

function startBranchDrag(branch: BranchRecord, event: DragEvent) {
  draggedBranchId.value = branch.id
  event.dataTransfer?.setData('text/plain', branch.id)

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function markKanbanDragOver(status: string) {
  dragOverStatus.value = status
}

function clearBranchDrag() {
  draggedBranchId.value = ''
  dragOverStatus.value = ''
}

async function dropBranchIntoStatus(status: string, event: DragEvent) {
  const branchId = event.dataTransfer?.getData('text/plain') || draggedBranchId.value
  const branch = branches.value.find((item) => item.id === branchId)

  if (!branch) {
    clearBranchDrag()
    return
  }

  if (branch.status === status) {
    clearBranchDrag()
    return
  }

  const rule = kanbanDropRule(status)

  if (!rule.allowKanbanDrop) {
    message.warning(rule.dropBlockReason ?? 'Không thể kéo branch vào trạng thái này.')
    clearBranchDrag()
    return
  }

  const confirmed = rule.requiresConfirmation
    ? window.confirm(`Chuyển ${branch.name} sang ${branchStatusLabel(status)}?`)
    : true

  if (!confirmed) {
    clearBranchDrag()
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
  } finally {
    clearBranchDrag()
  }
}

watch(selectedProjectId, refreshBranches)
watch([repositoryFilter, statusFilter, branchQuery], loadBranches)
watch(() => branchForm.repositoryId, applyRepositoryDefaults)
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
          <div class="branch-path">
            {{ record.checkoutSourceBranch || record.baseBranch || '-' }}
            <span>-></span>
            {{ record.intendedMergeTarget || '-' }}
            <span>-></span>
            {{ record.actualMergedInto || record.repository.productionBranch }}
          </div>
          <div v-if="record.sourceBranch" class="muted-text">Từ branch tracked: {{ record.sourceBranch.name }}</div>
        </template>
        <template v-if="column.key === 'actions'">
          <a-space wrap>
            <a-button size="small" @click="openBranchDrawer(record)">Chi tiết</a-button>
            <a-button size="small" @click="markMergedRelease(record)">Merge release</a-button>
            <a-button size="small" type="primary" @click="markMergedMain(record)">Merge main</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <section v-else class="branch-kanban" data-testid="branch-kanban">
      <div class="branch-kanban-row">
        <div
          v-for="group in branchStatusGroups"
          :key="group.value"
          class="branch-kanban-column"
          :class="{
            'branch-kanban-column-over': dragOverStatus === group.value,
            'branch-kanban-column-locked': !kanbanDropRule(group.value).allowKanbanDrop,
          }"
          :data-testid="`kanban-column-${group.value}`"
          @dragover.prevent="markKanbanDragOver(group.value)"
          @dragleave="dragOverStatus === group.value && (dragOverStatus = '')"
          @drop.prevent="dropBranchIntoStatus(group.value, $event)"
        >
          <div class="branch-kanban-column-header">
            <a-space>
              <a-tag :color="group.color">{{ group.branches.length }}</a-tag>
              <strong>{{ group.label }}</strong>
            </a-space>
            <span v-if="!kanbanDropRule(group.value).allowKanbanDrop" class="muted-text">
              Cần action
            </span>
            <span v-else-if="kanbanDropRule(group.value).requiresConfirmation" class="muted-text">
              Cần xác nhận
            </span>
          </div>

          <div class="branch-kanban-column-body">
            <article
              v-for="branch in group.branches"
              :key="branch.id"
              class="branch-kanban-card"
              draggable="true"
              :data-testid="`branch-card-${branch.name}`"
              @dragstart="startBranchDrag(branch, $event)"
              @dragend="clearBranchDrag"
              @click="openBranchDrawer(branch)"
            >
              <div class="branch-kanban-card-title">
                <strong>{{ branch.name }}</strong>
                <a-tag :color="branchStatusColor(branch.status)">{{ branchStatusLabel(branch.status) }}</a-tag>
              </div>
              <div class="muted-text">{{ branch.repository.name }} · {{ branch.branchType }}</div>
              <div class="branch-kanban-path">
                {{ branch.checkoutSourceBranch || branch.baseBranch || '-' }}
                <span>-></span>
                {{ branch.intendedMergeTarget || '-' }}
                <span>-></span>
                {{ branch.actualMergedInto || branch.repository.productionBranch }}
              </div>
              <a-space class="branch-kanban-tags" wrap>
                <a-tag v-for="link in branch.taskLinks" :key="link.id">{{ link.task.code }}</a-tag>
                <a-tag v-if="!branch.taskLinks.length">Chưa link task</a-tag>
              </a-space>
              <a-space class="branch-kanban-actions" wrap>
                <a-button size="small" @click.stop="openBranchDrawer(branch)">Chi tiết</a-button>
                <a-button size="small" @click.stop="markMergedRelease(branch)">Merge release</a-button>
                <a-button size="small" type="primary" @click.stop="markMergedMain(branch)">Merge main</a-button>
              </a-space>
            </article>
            <div v-if="!group.branches.length" class="branch-kanban-empty">Không có branch</div>
          </div>
        </div>
      </div>
    </section>
  </a-card>

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
          <a-select v-model:value="branchForm.status" :options="branchStatusOptions" />
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
        <a-checkbox v-model:checked="branchForm.inheritTaskLinks">Kế thừa task từ branch nguồn</a-checkbox>
        <a-checkbox v-if="selectedRepository?.hasGitlabAccessToken" v-model:checked="branchForm.createRemote">
          Tạo trên GitLab
        </a-checkbox>
      </a-space>

      <a-form-item label="Tên branch" name="name" :rules="[{ required: true, message: 'Nhập tên branch' }]">
        <a-input v-model:value="branchForm.name" placeholder="feature/OPS-BE-001-export-report" />
      </a-form-item>

      <div class="form-grid">
        <a-form-item label="Branch nguồn đã tracking">
          <a-select
            :value="branchForm.sourceBranchId"
            allow-clear
            placeholder="Nếu checkout từ branch đã có trong app"
            :options="sourceBranchOptions"
            @change="handleSourceBranchChange"
          />
        </a-form-item>
        <a-form-item label="Checkout từ">
          <a-input v-model:value="branchForm.checkoutSourceBranch" />
        </a-form-item>
      </div>

      <div class="form-grid">
        <a-form-item label="Dự định merge vào">
          <a-input v-model:value="branchForm.intendedMergeTarget" />
        </a-form-item>
        <a-form-item label="Đã merge vào">
          <a-input v-model:value="branchForm.actualMergedInto" />
        </a-form-item>
      </div>

      <div class="form-grid">
        <a-form-item label="Base branch">
          <a-input v-model:value="branchForm.baseBranch" />
        </a-form-item>
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
        <a-button v-if="editingBranch" @click="markMergedRelease(editingBranch)">Merge release</a-button>
        <a-button v-if="editingBranch" type="primary" @click="markMergedMain(editingBranch)">Merge main</a-button>
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
