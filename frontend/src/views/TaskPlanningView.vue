<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppJsonCodeBlock from '../core/components/AppJsonCodeBlock.vue'
import TaskWorkStatusTag from '../core/components/TaskWorkStatusTag.vue'
import { api } from '../services/api'
import {
  noteStatusMeta,
  statusMeta,
  taskWorkStatusMeta,
  taskWorkStatusOptions,
  workflowOptions,
  type WorkflowStatusRecord,
} from '../services/workflow'
import { useSessionStore } from '../stores/session'

type TaskGroupRecord = {
  id: string
  code: string
  name: string
  enabled: boolean
}

type NoteRecord = {
  id: string
  projectId: string | null
  content: string
  source: string | null
  status: string
  createdAt: string
  project?: {
    code: string
    name: string
  } | null
  convertedTask?: {
    code: string
    title: string
  } | null
}

type TaskRecord = {
  id: string
  projectId: string
  taskGroupId: string | null
  code: string
  title: string
  description: string | null
  status: string
  workStatus: string
  priority: string
  type: string
  targetDate: string | null
  project?: {
    code: string
    name: string
  }
  taskGroup?: {
    code: string
    name: string
  } | null
  branchLinks?: Array<{
    id: string
    branch: {
      id: string
      name: string
      status: string
      checkoutSourceBranch: string | null
      intendedMergeTarget: string | null
      actualMergedInto: string | null
      mergedMainAt: string | null
    }
  }>
  timelineEvents?: TimelineEventRecord[]
  apiRequests?: Array<{
    id: string
    collectionName: string
    name: string
    method: string
    url: string
    _count?: {
      requestRuns: number
    }
  }>
  apiFlows?: Array<{
    id: string
    collectionName: string
    name: string
    enabled: boolean
    _count?: {
      steps: number
      flowRuns: number
    }
  }>
  apiRequestRuns?: Array<{
    id: string
    status: string
    httpStatus: number | null
    durationMs: number | null
    assertionSummaryJson: string
    errorMessage: string | null
    responseBodySaved: boolean
    createdAt: string
    request?: {
      name: string
      method: string
      collectionName: string
    } | null
    flowRun?: {
      flow?: {
        name: string
        collectionName: string
      } | null
    } | null
    flowStep?: {
      name: string
      sortOrder: number
    } | null
  }>
  apiFlowRuns?: Array<{
    id: string
    status: string
    durationMs: number | null
    assertionSummaryJson: string
    errorMessage: string | null
    createdAt: string
    flow?: {
      name: string
      collectionName: string
    } | null
  }>
}

type TimelineEventRecord = {
  id: string
  eventType: string
  title: string
  description: string | null
  metadataJson: string
  createdAt: string
}

type TaskBranchLink = NonNullable<TaskRecord['branchLinks']>[number]

const route = useRoute()
const session = useSessionStore()
const loading = ref(false)
const notes = ref<NoteRecord[]>([])
const tasks = ref<TaskRecord[]>([])
const taskGroups = ref<TaskGroupRecord[]>([])
const workflowStatuses = ref<WorkflowStatusRecord[]>([])
const noteStatus = ref('ACTIONABLE')
const noteQuery = ref('')
const taskQuery = ref('')
const taskStatus = ref('')
const taskWorkStatusFilter = ref('')
const taskPriority = ref('')
const taskType = ref('')
const taskGroupFilter = ref('')
const taskBranch = ref('')
const convertDrawerOpen = ref(false)
const taskDrawerOpen = ref(false)
const editingTask = ref<TaskRecord | null>(null)
const selectedNote = ref<NoteRecord | null>(null)
const mode = computed(() => (route.name === 'tasks' ? 'tasks' : 'inbox'))
const selectedProjectId = computed(() => session.selectedProjectId)
const taskGroupOptions = computed(() =>
  taskGroups.value.map((group) => ({
    label: `${group.code} - ${group.name}`,
    value: group.id,
  })),
)
const taskBuckets = [
  { key: 'notStarted', label: 'Chưa làm', statuses: ['PLANNED'] },
  { key: 'inProgress', label: 'Đang tiến hành', statuses: ['IN_PROGRESS'] },
  { key: 'inRelease', label: 'Đang ở release', statuses: ['MERGED_RELEASE'] },
  { key: 'done', label: 'Lên prod', statuses: ['DONE'] },
  { key: 'cancelled', label: 'Đã hủy', statuses: ['CANCELLED'] },
]
const groupedTasks = computed(() =>
  taskBuckets.map((bucket) => ({
    ...bucket,
    tasks: tasks.value.filter((task) => bucket.statuses.includes(task.status)),
  })),
)
const tasksWithoutBranches = computed(() =>
  tasks.value.filter((task) => !['DONE', 'CANCELLED'].includes(task.status) && !(task.branchLinks?.length)),
)
const noteForm = reactive({
  content: '',
  source: '',
})
const convertForm = reactive({
  title: '',
  description: '',
  taskGroupId: null as string | null,
  workStatus: 'TODO',
  priority: 'MEDIUM',
  type: 'FEATURE',
  targetDate: '',
})
const taskForm = reactive({
  id: '',
  title: '',
  description: '',
  taskGroupId: null as string | null,
  workStatus: 'TODO',
  priority: 'MEDIUM',
  type: 'FEATURE',
  targetDate: '',
})
const noteColumns = [
  { title: 'Note', key: 'note' },
  { title: 'Dự án', key: 'project', width: 180 },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 132 },
  { title: '', key: 'actions', width: 220 },
]
const taskColumns = [
  { title: 'Mã', dataIndex: 'code', key: 'code', width: 132 },
  { title: 'Task', key: 'task', width: 260 },
  { title: 'Branch', key: 'branch', width: 220 },
  { title: 'Nhóm', key: 'group', width: 150 },
  { title: 'Theo branch', dataIndex: 'status', key: 'status', width: 140 },
  { title: 'Trạng thái task', dataIndex: 'workStatus', key: 'workStatus', width: 150 },
  { title: 'Ưu tiên', dataIndex: 'priority', key: 'priority', width: 96 },
  { title: '', key: 'actions', width: 260 },
]
const statusOptions = computed(() => workflowOptions(workflowStatuses.value, 'TASK'))
const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
]
const typeOptions = [
  { label: 'Feature', value: 'FEATURE' },
  { label: 'Bug', value: 'BUG' },
  { label: 'Hotfix', value: 'HOTFIX' },
  { label: 'Chore', value: 'CHORE' },
]
const noteStatusOptions = [
  { label: 'Tất cả', value: 'ACTIONABLE' },
  { label: 'Đang chờ', value: 'NEW' },
  { label: 'Đã lưu trữ', value: 'ARCHIVED' },
]
function resetNoteForm() {
  noteForm.content = ''
  noteForm.source = ''
}

function resetTaskForm() {
  taskForm.id = ''
  taskForm.title = ''
  taskForm.description = ''
  taskForm.taskGroupId = null
  taskForm.workStatus = 'TODO'
  taskForm.priority = 'MEDIUM'
  taskForm.type = 'FEATURE'
  taskForm.targetDate = ''
  editingTask.value = null
}

function resetConvertForm() {
  convertForm.title = ''
  convertForm.description = ''
  convertForm.taskGroupId = null
  convertForm.priority = 'MEDIUM'
  convertForm.type = 'FEATURE'
  convertForm.targetDate = ''
  selectedNote.value = null
}

function dateValue(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function canConvertNote(note: NoteRecord) {
  return ['NEW', 'ARCHIVED'].includes(note.status)
}

function branchPath(branch: TaskBranchLink['branch']) {
  const plannedTargets =
    branch.intendedMergeTarget
      ?.split(/[\n,]/g)
      .map((target) => target.trim())
      .filter(Boolean)
      .join(', ') || '-'

  return `${branch.checkoutSourceBranch || '-'} -> ${plannedTargets} -> ${branch.actualMergedInto || (branch.mergedMainAt ? 'main' : 'Chưa merge')}`
}

function taskBranchName(task: TaskRecord) {
  return task.branchLinks?.[0]?.branch.name || ''
}

function taskStatusLabel(status: string) {
  return statusMeta(workflowStatuses.value, 'TASK', status).label
}

function taskStatusColor(status: string) {
  return statusMeta(workflowStatuses.value, 'TASK', status).color
}

function taskWorkStatusLabel(status: string) {
  return taskWorkStatusMeta(status).label
}

function taskWorkStatusColor(status: string) {
  return taskWorkStatusMeta(status).color
}

function branchStatusLabel(status: string) {
  return statusMeta(workflowStatuses.value, 'BRANCH', status).label
}

function branchStatusColor(status: string) {
  return statusMeta(workflowStatuses.value, 'BRANCH', status).color
}

function apiRunStatusColor(status: string) {
  if (status === 'PASSED') {
    return 'green'
  }

  if (status === 'FAILED') {
    return 'red'
  }

  return 'default'
}

function assertionSummaryLabel(value: string) {
  try {
    const parsed = JSON.parse(value || '{}') as { total?: number; passed?: number }
    const total = Number(parsed.total || 0)

    if (!total) {
      return 'Assertions 0'
    }

    return `Assertions ${Number(parsed.passed || 0)}/${total}`
  } catch {
    return 'Assertions 0'
  }
}

function apiRunTitle(run: NonNullable<TaskRecord['apiRequestRuns']>[number]) {
  if (run.flowRun?.flow) {
    return `${run.flowRun.flow.name} / ${run.flowStep?.name ?? 'Step'}`
  }

  return `${run.request?.method ?? 'API'} ${run.request?.name ?? 'Request run'}`
}

function bucketColor(bucket: { statuses: string[] }) {
  return taskStatusColor(bucket.statuses[0] ?? 'PLANNED')
}

function priorityMeta(priority: string) {
  const normalizedPriority = priority.toUpperCase()
  const meta: Record<string, { value: string; label: string; color: string; bars: number }> = {
    LOW: { value: 'LOW', label: 'Low', color: 'green', bars: 1 },
    MEDIUM: { value: 'MEDIUM', label: 'Medium', color: 'gold', bars: 2 },
    HIGH: { value: 'HIGH', label: 'High', color: 'red', bars: 3 },
    URGENT: { value: 'URGENT', label: 'Urgent', color: 'red', bars: 3 },
  }

  return meta[normalizedPriority] ?? { value: normalizedPriority || 'MEDIUM', label: priority || 'Medium', color: 'gold', bars: 2 }
}

function taskDeleteDisabledReason(task: TaskRecord) {
  const linkedBranch = task.branchLinks?.find((link) => link.branch.status === 'MERGED_MAIN' || link.branch.mergedMainAt)

  if (task.status === 'DONE' || linkedBranch) {
    return 'Task đã lên main/prod nên không thể xóa.'
  }

  return ''
}

function canDeleteTask(task: TaskRecord) {
  return !taskDeleteDisabledReason(task)
}

function taskCancelDisabledReason(task: TaskRecord) {
  if (task.status === 'CANCELLED') {
    return 'Task đã hủy.'
  }

  return taskDeleteDisabledReason(task).replace('xóa', 'hủy')
}

function canCancelTask(task: TaskRecord) {
  return !taskCancelDisabledReason(task)
}

function canRestoreTask(task: TaskRecord) {
  return task.status === 'CANCELLED'
}

function taskEditDisabledReason(task: TaskRecord) {
  const linkedBranch = task.branchLinks?.find((link) => link.branch.status === 'MERGED_MAIN' || link.branch.mergedMainAt)

  if (task.status === 'CANCELLED') {
    return 'Task đã hủy, hãy phục hồi về nháp trước khi chỉnh sửa hoặc gắn branch.'
  }

  if (task.status === 'DONE' || linkedBranch) {
    return 'Task đã lên main/prod nên chỉ xem lại, không chỉnh sửa.'
  }

  return ''
}

function canEditTask(task: TaskRecord) {
  return !taskEditDisabledReason(task)
}

const taskFormReadonly = computed(() => Boolean(editingTask.value && !canEditTask(editingTask.value)))
const apiEvidenceEvents = computed(() =>
  (editingTask.value?.timelineEvents ?? []).filter((event) => event.eventType.startsWith('API_')),
)

async function loadTaskGroups() {
  if (!selectedProjectId.value) {
    taskGroups.value = []
    return
  }

  const { data } = await api.get<TaskGroupRecord[]>(`/api/projects/${selectedProjectId.value}/task-groups`)

  taskGroups.value = data.filter((group) => group.enabled)
}

async function loadWorkflowStatuses() {
  if (!selectedProjectId.value) {
    workflowStatuses.value = []
    return
  }

  const { data } = await api.get<WorkflowStatusRecord[]>(`/api/workflow-statuses?projectId=${selectedProjectId.value}`)

  workflowStatuses.value = data
}

async function loadNotes() {
  const params = new URLSearchParams()

  if (selectedProjectId.value) {
    params.set('projectId', selectedProjectId.value)
  }

  if (noteStatus.value) {
    params.set('status', noteStatus.value)
  }

  if (noteQuery.value) {
    params.set('q', noteQuery.value)
  }

  const { data } = await api.get<NoteRecord[]>(`/api/notes?${params.toString()}`)

  notes.value = data
}

async function loadTasks() {
  const params = new URLSearchParams()

  if (selectedProjectId.value) {
    params.set('projectId', selectedProjectId.value)
  }

  if (taskStatus.value) {
    params.set('status', taskStatus.value)
  }

  if (taskWorkStatusFilter.value) {
    params.set('workStatus', taskWorkStatusFilter.value)
  }

  if (taskGroupFilter.value) {
    params.set('taskGroupId', taskGroupFilter.value)
  }

  if (taskPriority.value) {
    params.set('priority', taskPriority.value)
  }

  if (taskType.value) {
    params.set('type', taskType.value)
  }

  if (taskBranch.value) {
    params.set('branch', taskBranch.value)
  }

  if (taskQuery.value) {
    params.set('q', taskQuery.value)
  }

  const { data } = await api.get<TaskRecord[]>(`/api/tasks?${params.toString()}`)

  tasks.value = data
}

async function refreshPlanning() {
  loading.value = true

  try {
    await Promise.all([loadTaskGroups(), loadWorkflowStatuses(), loadNotes(), loadTasks()])
  } finally {
    loading.value = false
  }
}

async function submitNote() {
  if (!noteForm.content.trim()) {
    return
  }

  await api.post('/api/notes', {
    projectId: selectedProjectId.value,
    content: noteForm.content,
    source: noteForm.source,
  })

  resetNoteForm()
  await loadNotes()
}

async function archiveNote(note: NoteRecord) {
  await api.post(`/api/notes/${note.id}/archive`)
  await loadNotes()
}

function openConvertDrawer(note: NoteRecord) {
  selectedNote.value = note
  convertForm.title = note.content.slice(0, 120)
  convertForm.description = note.content
  convertForm.taskGroupId = null
  convertForm.priority = 'MEDIUM'
  convertForm.type = 'FEATURE'
  convertForm.targetDate = ''
  convertDrawerOpen.value = true
}

async function convertNote() {
  if (!selectedNote.value || !selectedProjectId.value) {
    return
  }

  await api.post(`/api/notes/${selectedNote.value.id}/convert-to-task`, {
    projectId: selectedProjectId.value,
    title: convertForm.title,
    description: convertForm.description,
    taskGroupId: convertForm.taskGroupId,
    priority: convertForm.priority,
    type: convertForm.type,
    targetDate: convertForm.targetDate,
  })

  convertDrawerOpen.value = false
  resetConvertForm()
  await refreshPlanning()
}

function openCreateTaskDrawer() {
  resetTaskForm()
  taskDrawerOpen.value = true
}

function setTaskDrawerData(data: TaskRecord) {
  editingTask.value = data
  taskForm.id = data.id
  taskForm.title = data.title
  taskForm.description = data.description ?? ''
  taskForm.taskGroupId = data.taskGroupId
  taskForm.workStatus = data.workStatus || 'TODO'
  taskForm.priority = data.priority
  taskForm.type = data.type
  taskForm.targetDate = dateValue(data.targetDate)
  taskDrawerOpen.value = true
}

async function openTaskDrawer(task: TaskRecord) {
  const { data } = await api.get<TaskRecord>(`/api/tasks/${task.id}`)

  setTaskDrawerData(data)
}

async function openTaskById(taskId: string) {
  const { data } = await api.get<TaskRecord>(`/api/tasks/${taskId}`)

  setTaskDrawerData(data)
}

async function submitTask() {
  if (!selectedProjectId.value || !taskForm.title.trim()) {
    return
  }

  if (editingTask.value && !canEditTask(editingTask.value)) {
    message.warning(taskEditDisabledReason(editingTask.value))
    return
  }

  const payload = {
    projectId: selectedProjectId.value,
    title: taskForm.title,
    description: taskForm.description,
    taskGroupId: taskForm.taskGroupId,
    workStatus: taskForm.workStatus,
    priority: taskForm.priority,
    type: taskForm.type,
    targetDate: taskForm.targetDate,
  }

  if (taskForm.id) {
    await api.patch(`/api/tasks/${taskForm.id}`, payload)
  } else {
    await api.post('/api/tasks', payload)
  }

  taskDrawerOpen.value = false
  resetTaskForm()
  await loadTasks()
}

async function updateTaskWorkStatus(task: TaskRecord, workStatus: string) {
  if (task.status === 'CANCELLED') {
    message.warning('Task đã hủy, hãy phục hồi về nháp trước khi đổi trạng thái công việc.')
    return
  }

  try {
    const { data } = await api.patch<TaskRecord>(`/api/tasks/${task.id}/work-status`, { workStatus })

    tasks.value = tasks.value.map((item) => (item.id === data.id ? { ...item, workStatus: data.workStatus } : item))

    if (editingTask.value?.id === data.id) {
      editingTask.value = {
        ...editingTask.value,
        workStatus: data.workStatus,
      }
      taskForm.workStatus = data.workStatus
    }
  } catch {
    message.error('Không thể đổi trạng thái task.')
  }
}

async function deleteTask(task: TaskRecord) {
  await api.delete(`/api/tasks/${task.id}`)

  if (editingTask.value?.id === task.id) {
    taskDrawerOpen.value = false
    resetTaskForm()
  }

  message.success(`Đã xóa task ${task.code}.`)
  await loadTasks()
}

async function cancelTask(task: TaskRecord) {
  if (!canCancelTask(task)) {
    message.warning(taskCancelDisabledReason(task))
    return
  }

  await api.post(`/api/tasks/${task.id}/cancel`)
  message.success(`Đã hủy task ${task.code}.`)
  await loadTasks()

  if (editingTask.value?.id === task.id) {
    await openTaskById(task.id)
  }
}

async function restoreTask(task: TaskRecord) {
  if (!canRestoreTask(task)) {
    return
  }

  await api.post(`/api/tasks/${task.id}/restore-draft`)
  message.success(`Đã phục hồi ${task.code} về nháp.`)
  await loadTasks()

  if (editingTask.value?.id === task.id) {
    await openTaskById(task.id)
  }
}

watch(selectedProjectId, refreshPlanning)
watch([noteStatus, noteQuery, taskStatus, taskWorkStatusFilter, taskPriority, taskType, taskGroupFilter, taskBranch, taskQuery], refreshPlanning)
watch(
  () => route.query.taskId,
  (taskId) => {
    if (typeof taskId === 'string') {
      void openTaskById(taskId)
    }
  },
)
onMounted(refreshPlanning)
onMounted(() => {
  if (typeof route.query.taskId === 'string') {
    void openTaskById(route.query.taskId)
  }
})
</script>

<template>
  <section class="page-heading">
    <div>
      <h1>{{ mode === 'inbox' ? 'Inbox' : 'Tất cả task' }}</h1>
      <p>{{ mode === 'inbox' ? 'Ghi nhanh yêu cầu lắc nhắc rồi chuyển thành task' : 'Theo dõi task theo branch đang gắn' }}</p>
    </div>
    <a-space>
      <a-button @click="refreshPlanning">Làm mới</a-button>
      <a-button type="primary" @click="openCreateTaskDrawer">Tạo task</a-button>
    </a-space>
  </section>

  <a-spin :spinning="loading">
    <section v-if="mode === 'inbox'" class="planning-grid">
      <a-card class="settings-card" title="Ghi nhanh">
        <a-form layout="vertical" :model="noteForm" @finish="submitNote">
          <a-form-item label="Nội dung" name="content" :rules="[{ required: true, message: 'Nhập nội dung note' }]">
            <a-textarea v-model:value="noteForm.content" :rows="4" />
          </a-form-item>
          <a-form-item label="Nguồn">
            <a-input v-model:value="noteForm.source" placeholder="Slack, họp, khách hàng..." />
          </a-form-item>
          <a-button type="primary" html-type="submit">Thêm note</a-button>
        </a-form>
      </a-card>

      <a-card class="settings-card" title="Inbox">
        <a-space class="filter-row">
          <a-select v-model:value="noteStatus" class="filter-control" :options="noteStatusOptions" />
          <a-input-search v-model:value="noteQuery" class="filter-control" placeholder="Tìm note" />
        </a-space>
        <a-table row-key="id" size="small" :columns="noteColumns" :data-source="notes" :pagination="false">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'note'">
              <strong>{{ record.content }}</strong>
              <div class="muted-text">{{ record.source || 'Không có nguồn' }}</div>
              <div v-if="record.convertedTask" class="muted-text">
                Đã tạo {{ record.convertedTask.code }}
              </div>
            </template>
            <template v-if="column.key === 'project'">
              {{ record.project ? `${record.project.code} - ${record.project.name}` : '-' }}
            </template>
            <template v-if="column.key === 'actions'">
              <a-space>
                <a-button v-if="canConvertNote(record)" size="small" type="primary" @click="openConvertDrawer(record)">
                  Chuyển task
                </a-button>
                <a-button v-if="record.status === 'NEW'" size="small" @click="archiveNote(record)">Lưu trữ</a-button>
              </a-space>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="noteStatusMeta[record.status]?.color">
                {{ noteStatusMeta[record.status]?.label ?? record.status }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
    </section>

    <section v-if="mode === 'tasks'" class="status-board">
      <a-card v-for="bucket in groupedTasks" :key="bucket.key" class="status-column" size="small">
        <template #title>
          <a-space>
            <a-tag :color="bucketColor(bucket)">{{ bucket.tasks.length }}</a-tag>
            <span>{{ bucket.label }}</span>
          </a-space>
        </template>
        <a-list size="small" :data-source="bucket.tasks.slice(0, 5)">
          <template #renderItem="{ item }">
            <a-list-item class="clickable-list-item" @click="openTaskDrawer(item)">
              <a-list-item-meta :title="`${item.code} - ${item.title}`" :description="item.branchLinks?.[0]?.branch.name || 'Chưa link branch'" />
            </a-list-item>
          </template>
        </a-list>
      </a-card>
    </section>

    <a-card v-if="mode === 'tasks' && tasksWithoutBranches.length" class="quick-note-card" title="Task chưa có branch">
      <a-space wrap>
        <a-tag v-for="task in tasksWithoutBranches" :key="task.id" class="clickable-tag" @click="openTaskDrawer(task)">
          {{ task.code }}
        </a-tag>
      </a-space>
    </a-card>

    <a-card class="settings-card" :title="mode === 'inbox' ? 'Task mới tạo' : 'Danh sách task'">
      <a-space class="filter-row">
        <a-input-search v-model:value="taskQuery" class="filter-control" placeholder="Tìm mã hoặc tiêu đề" />
        <a-select v-model:value="taskGroupFilter" class="filter-control" allow-clear placeholder="Nhóm" :options="taskGroupOptions" />
        <a-select v-model:value="taskStatus" class="filter-control" allow-clear placeholder="Theo branch" :options="statusOptions" />
        <a-select
          v-model:value="taskWorkStatusFilter"
          class="filter-control"
          allow-clear
          placeholder="Trạng thái task"
          :options="taskWorkStatusOptions"
        />
        <a-select v-model:value="taskPriority" class="filter-control" allow-clear placeholder="Ưu tiên" :options="priorityOptions" />
        <a-select v-model:value="taskType" class="filter-control" allow-clear placeholder="Loại" :options="typeOptions" />
        <a-input v-model:value="taskBranch" class="filter-control" placeholder="Branch" />
      </a-space>
      <a-table row-key="id" size="small" :columns="taskColumns" :data-source="tasks" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'task'">
            <strong>{{ record.title }}</strong>
            <div class="muted-text">{{ record.project?.code }} {{ record.targetDate ? `- hạn ${dateValue(record.targetDate)}` : '' }}</div>
          </template>
          <template v-if="column.key === 'branch'">
            <a-tag v-if="taskBranchName(record)" color="blue">{{ taskBranchName(record) }}</a-tag>
            <span v-else class="muted-text">Chưa link branch</span>
          </template>
          <template v-if="column.key === 'group'">
            {{ record.taskGroup ? `${record.taskGroup.code} - ${record.taskGroup.name}` : '-' }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="taskStatusColor(record.status)">{{ taskStatusLabel(record.status) }}</a-tag>
          </template>
          <template v-if="column.key === 'workStatus'">
            <TaskWorkStatusTag
              :value="record.workStatus || 'TODO'"
              :disabled="record.status === 'CANCELLED'"
              @change="(value) => updateTaskWorkStatus(record, value)"
            />
          </template>
          <template v-if="column.key === 'priority'">
            <a-tooltip :title="priorityMeta(record.priority).label">
              <a-tag
                :color="priorityMeta(record.priority).color"
                class="priority-tag"
                :data-testid="`priority-tag-${priorityMeta(record.priority).value}`"
              >
                <span class="priority-bars" :aria-label="priorityMeta(record.priority).label">
                  <span v-for="bar in 3" :key="bar" :class="{ 'is-active': bar <= priorityMeta(record.priority).bars }" />
                </span>
              </a-tag>
            </a-tooltip>
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="openTaskDrawer(record)">Chi tiết</a-button>
              <a-button v-if="canRestoreTask(record)" size="small" @click="restoreTask(record)">Phục hồi nháp</a-button>
              <a-popconfirm
                v-else
                :title="`Hủy task ${record.code}?`"
                ok-text="Hủy task"
                cancel-text="Đóng"
                @confirm="cancelTask(record)"
              >
                <a-button
                  size="small"
                  aria-label="Hủy task"
                  :disabled="!canCancelTask(record)"
                  :title="taskCancelDisabledReason(record)"
                >
                  Hủy task
                </a-button>
              </a-popconfirm>
              <a-popconfirm
                :title="`Xóa task ${record.code}?`"
                ok-text="Xóa"
                cancel-text="Hủy"
                @confirm="deleteTask(record)"
              >
                <a-button
                  size="small"
                  danger
                  aria-label="Xóa task"
                  :disabled="!canDeleteTask(record)"
                  :title="taskDeleteDisabledReason(record)"
                >
                  Xóa
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </a-spin>

  <a-drawer v-model:open="convertDrawerOpen" title="Chuyển note thành task" width="520">
    <a-form layout="vertical" :model="convertForm" @finish="convertNote">
      <a-form-item label="Tiêu đề" name="title" :rules="[{ required: true, message: 'Nhập tiêu đề task' }]">
        <a-input v-model:value="convertForm.title" />
      </a-form-item>
      <a-form-item label="Nhóm task">
        <a-select v-model:value="convertForm.taskGroupId" allow-clear :options="taskGroupOptions" />
      </a-form-item>
      <div class="form-grid">
        <a-form-item label="Ưu tiên">
          <a-select v-model:value="convertForm.priority" :options="priorityOptions" />
        </a-form-item>
        <a-form-item label="Loại">
          <a-select v-model:value="convertForm.type" :options="typeOptions" />
        </a-form-item>
      </div>
      <a-form-item label="Target date">
        <a-input v-model:value="convertForm.targetDate" type="date" />
      </a-form-item>
      <a-form-item label="Mô tả">
        <a-textarea v-model:value="convertForm.description" :rows="5" />
      </a-form-item>
      <a-button type="primary" html-type="submit">Tạo task</a-button>
    </a-form>
  </a-drawer>

  <a-drawer v-model:open="taskDrawerOpen" :title="taskForm.id ? 'Chi tiết task' : 'Tạo task'" width="70%">
    <a-form layout="vertical" :model="taskForm" @finish="submitTask">
      <a-alert
        v-if="editingTask && taskFormReadonly"
        class="settings-alert"
        type="warning"
        show-icon
        :message="taskEditDisabledReason(editingTask)"
      />
      <a-space v-if="editingTask" class="settings-alert" wrap>
        <a-tag :color="taskStatusColor(editingTask.status)">{{ taskStatusLabel(editingTask.status) }}</a-tag>
        <a-tag :color="taskWorkStatusColor(editingTask.workStatus)">{{ taskWorkStatusLabel(editingTask.workStatus) }}</a-tag>
        <a-tag v-if="editingTask.branchLinks?.[0]">{{ editingTask.branchLinks[0].branch.name }}</a-tag>
        <a-tag v-else>Chưa link branch</a-tag>
      </a-space>
      <a-form-item label="Tiêu đề" name="title" :rules="[{ required: true, message: 'Nhập tiêu đề task' }]">
        <a-input v-model:value="taskForm.title" :disabled="taskFormReadonly" />
      </a-form-item>
      <a-form-item label="Nhóm task">
        <a-select v-model:value="taskForm.taskGroupId" allow-clear :disabled="taskFormReadonly" :options="taskGroupOptions" />
      </a-form-item>
      <div class="form-grid">
        <a-form-item label="Trạng thái task">
          <TaskWorkStatusTag
            :value="taskForm.workStatus"
            :disabled="editingTask?.status === 'CANCELLED'"
            @change="(value) => (editingTask ? updateTaskWorkStatus(editingTask, value) : (taskForm.workStatus = value))"
          />
        </a-form-item>
        <a-form-item label="Ưu tiên">
          <a-select v-model:value="taskForm.priority" :disabled="taskFormReadonly" :options="priorityOptions" />
        </a-form-item>
        <a-form-item label="Loại">
          <a-select v-model:value="taskForm.type" :disabled="taskFormReadonly" :options="typeOptions" />
        </a-form-item>
      </div>
      <a-form-item label="Target date">
        <a-input v-model:value="taskForm.targetDate" type="date" :disabled="taskFormReadonly" />
      </a-form-item>
      <a-form-item label="Mô tả">
        <a-textarea v-model:value="taskForm.description" :rows="5" :disabled="taskFormReadonly" />
      </a-form-item>
      <a-form-item v-if="taskForm.description" label="Xem mô tả">
        <AppJsonCodeBlock :value="taskForm.description" />
      </a-form-item>
      <a-space>
        <a-button
          type="primary"
          html-type="submit"
          :disabled="taskFormReadonly"
          :title="editingTask ? taskEditDisabledReason(editingTask) : ''"
        >
          {{ taskForm.id ? 'Lưu task' : 'Tạo task' }}
        </a-button>
        <a-button v-if="editingTask && canRestoreTask(editingTask)" @click="restoreTask(editingTask)">Phục hồi nháp</a-button>
        <a-popconfirm
          v-else-if="editingTask"
          :title="`Hủy task ${editingTask.code}?`"
          ok-text="Hủy task"
          cancel-text="Đóng"
          @confirm="cancelTask(editingTask)"
        >
          <a-button
            aria-label="Hủy task"
            :disabled="!canCancelTask(editingTask)"
            :title="taskCancelDisabledReason(editingTask)"
          >
            Hủy task
          </a-button>
        </a-popconfirm>
        <a-popconfirm
          v-if="editingTask"
          :title="`Xóa task ${editingTask.code}?`"
          ok-text="Xóa"
          cancel-text="Hủy"
          @confirm="deleteTask(editingTask)"
        >
          <a-button
            danger
            aria-label="Xóa task"
            :disabled="!canDeleteTask(editingTask)"
            :title="taskDeleteDisabledReason(editingTask)"
          >
            Xóa
          </a-button>
        </a-popconfirm>
      </a-space>
      </a-form>

      <a-divider v-if="editingTask">Branch path</a-divider>
      <a-list v-if="editingTask" size="small" :data-source="editingTask.branchLinks ?? []">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta :title="item.branch.name" :description="branchPath(item.branch)" />
            <a-tag :color="branchStatusColor(item.branch.status)">{{ branchStatusLabel(item.branch.status) }}</a-tag>
          </a-list-item>
        </template>
      </a-list>
      <a-empty v-if="editingTask && !editingTask.branchLinks?.length" description="Task chưa link branch" />

    <a-tabs v-if="editingTask" class="timeline-list">
      <a-tab-pane key="timeline" tab="Timeline">
        <a-timeline>
          <a-timeline-item v-for="event in editingTask.timelineEvents ?? []" :key="event.id">
            <strong>{{ event.title }}</strong>
            <div class="muted-text">{{ event.description }}</div>
          </a-timeline-item>
        </a-timeline>
      </a-tab-pane>
      <a-tab-pane key="api-lab" tab="API Lab">
        <a-divider orientation="left">Request đã link</a-divider>
        <a-list size="small" :data-source="editingTask.apiRequests ?? []">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="`${item.method} ${item.name}`" :description="`${item.collectionName} · ${item.url}`" />
              <a-tag>{{ item._count?.requestRuns ?? 0 }} run</a-tag>
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-if="!editingTask.apiRequests?.length" description="Chưa có request link task" />

        <a-divider orientation="left">Flow đã link</a-divider>
        <a-list size="small" :data-source="editingTask.apiFlows ?? []">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.name" :description="item.collectionName" />
              <a-space>
                <a-tag>{{ item._count?.steps ?? 0 }} step</a-tag>
                <a-tag>{{ item._count?.flowRuns ?? 0 }} run</a-tag>
              </a-space>
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-if="!editingTask.apiFlows?.length" description="Chưa có flow link task" />

        <a-divider orientation="left">Run gần đây</a-divider>
        <a-list size="small" :data-source="editingTask.apiRequestRuns ?? []">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="apiRunTitle(item)" :description="item.errorMessage || new Date(item.createdAt).toLocaleString('vi-VN')" />
              <a-space wrap>
                <a-tag :color="apiRunStatusColor(item.status)">{{ item.status }}</a-tag>
                <a-tag>{{ item.httpStatus ?? 'No status' }}</a-tag>
                <a-tag>{{ item.durationMs ?? 0 }}ms</a-tag>
                <a-tag>{{ assertionSummaryLabel(item.assertionSummaryJson) }}</a-tag>
                <a-tag v-if="item.responseBodySaved" color="blue">Đã lưu body</a-tag>
              </a-space>
            </a-list-item>
          </template>
        </a-list>
        <a-list size="small" :data-source="editingTask.apiFlowRuns ?? []">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="`FLOW ${item.flow?.name ?? 'Flow run'}`" :description="item.errorMessage || new Date(item.createdAt).toLocaleString('vi-VN')" />
              <a-space wrap>
                <a-tag :color="apiRunStatusColor(item.status)">{{ item.status }}</a-tag>
                <a-tag>{{ item.durationMs ?? 0 }}ms</a-tag>
                <a-tag>{{ assertionSummaryLabel(item.assertionSummaryJson) }}</a-tag>
              </a-space>
            </a-list-item>
          </template>
        </a-list>
        <a-empty
          v-if="!editingTask.apiRequestRuns?.length && !editingTask.apiFlowRuns?.length"
          description="Chưa có API run cho task"
        />

        <a-divider orientation="left">Evidence đã gắn timeline</a-divider>
        <a-timeline>
          <a-timeline-item v-for="event in apiEvidenceEvents" :key="event.id">
            <strong>{{ event.title }}</strong>
            <div class="muted-text">{{ event.description }}</div>
          </a-timeline-item>
        </a-timeline>
        <a-empty v-if="!apiEvidenceEvents.length" description="Chưa gắn API run vào timeline" />
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
</template>
