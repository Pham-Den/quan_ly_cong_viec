<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { api } from '../services/api'
import { noteStatusMeta, statusMeta, workflowOptions, type WorkflowStatusRecord } from '../services/workflow'
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
  priority: string
  type: string
  targetDate: string | null
  releaseReadyAt: string | null
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
}

type TimelineEventRecord = {
  id: string
  eventType: string
  title: string
  description: string | null
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
  { key: 'waiting', label: 'Review/Test', statuses: ['IN_REVIEW', 'TESTING'] },
  { key: 'inRelease', label: 'Đang ở release', statuses: ['READY_RELEASE', 'MERGED_RELEASE'] },
  { key: 'readyMain', label: 'Sẵn sàng main', statuses: ['READY_PROD'] },
  { key: 'done', label: 'Hoàn tất', statuses: ['DONE'] },
  { key: 'blocked', label: 'Blocked', statuses: ['BLOCKED'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
]
const groupedTasks = computed(() =>
  taskBuckets.map((bucket) => ({
    ...bucket,
    tasks: tasks.value.filter((task) => bucket.statuses.includes(task.status)),
  })),
)
const tasksWithoutBranches = computed(() => tasks.value.filter((task) => !(task.branchLinks?.length)))
const noteForm = reactive({
  content: '',
  source: '',
})
const convertForm = reactive({
  title: '',
  description: '',
  taskGroupId: null as string | null,
  priority: 'MEDIUM',
  type: 'FEATURE',
  targetDate: '',
})
const taskForm = reactive({
  id: '',
  title: '',
  description: '',
  taskGroupId: null as string | null,
  status: 'PLANNED',
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
  { title: 'Task', key: 'task' },
  { title: 'Nhóm', key: 'group', width: 150 },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 140 },
  { title: 'Ưu tiên', dataIndex: 'priority', key: 'priority', width: 112 },
  { title: '', key: 'actions', width: 220 },
]
const statusOptions = computed(() => workflowOptions(workflowStatuses.value, 'TASK'))
const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
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
  taskForm.status = 'PLANNED'
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

function taskStatusLabel(status: string) {
  return statusMeta(workflowStatuses.value, 'TASK', status).label
}

function taskStatusColor(status: string) {
  return statusMeta(workflowStatuses.value, 'TASK', status).color
}

function branchStatusLabel(status: string) {
  return statusMeta(workflowStatuses.value, 'BRANCH', status).label
}

function branchStatusColor(status: string) {
  return statusMeta(workflowStatuses.value, 'BRANCH', status).color
}

function bucketColor(bucket: { statuses: string[] }) {
  return taskStatusColor(bucket.statuses[0] ?? 'PLANNED')
}

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
  taskForm.status = data.status
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

  const payload = {
    projectId: selectedProjectId.value,
    title: taskForm.title,
    description: taskForm.description,
    taskGroupId: taskForm.taskGroupId,
    status: taskForm.status,
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

async function markReadyProd(task: TaskRecord) {
  await api.post(`/api/tasks/${task.id}/mark-ready-prod`)
  await loadTasks()
}

watch(selectedProjectId, refreshPlanning)
watch([noteStatus, noteQuery, taskStatus, taskPriority, taskType, taskGroupFilter, taskBranch, taskQuery], refreshPlanning)
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
      <p>{{ mode === 'inbox' ? 'Ghi nhanh yêu cầu lắc nhắc rồi chuyển thành task' : 'Theo dõi và chỉnh task đã plan' }}</p>
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
        <a-select v-model:value="taskStatus" class="filter-control" allow-clear placeholder="Trạng thái" :options="statusOptions" />
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
          <template v-if="column.key === 'group'">
            {{ record.taskGroup ? `${record.taskGroup.code} - ${record.taskGroup.name}` : '-' }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="taskStatusColor(record.status)">{{ taskStatusLabel(record.status) }}</a-tag>
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="openTaskDrawer(record)">Chi tiết</a-button>
              <a-button size="small" @click="markReadyProd(record)">Sẵn sàng main</a-button>
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

  <a-drawer v-model:open="taskDrawerOpen" :title="taskForm.id ? 'Chi tiết task' : 'Tạo task'" width="620">
    <a-form layout="vertical" :model="taskForm" @finish="submitTask">
      <a-form-item label="Tiêu đề" name="title" :rules="[{ required: true, message: 'Nhập tiêu đề task' }]">
        <a-input v-model:value="taskForm.title" />
      </a-form-item>
      <a-form-item label="Nhóm task">
        <a-select v-model:value="taskForm.taskGroupId" allow-clear :options="taskGroupOptions" />
      </a-form-item>
      <div class="form-grid">
        <a-form-item label="Trạng thái">
          <a-select v-model:value="taskForm.status" :options="statusOptions" />
        </a-form-item>
        <a-form-item label="Ưu tiên">
          <a-select v-model:value="taskForm.priority" :options="priorityOptions" />
        </a-form-item>
        <a-form-item label="Loại">
          <a-select v-model:value="taskForm.type" :options="typeOptions" />
        </a-form-item>
      </div>
      <a-form-item label="Target date">
        <a-input v-model:value="taskForm.targetDate" type="date" />
      </a-form-item>
      <a-form-item label="Mô tả">
        <a-textarea v-model:value="taskForm.description" :rows="5" />
      </a-form-item>
      <a-space>
        <a-button type="primary" html-type="submit">{{ taskForm.id ? 'Lưu task' : 'Tạo task' }}</a-button>
        <a-button v-if="editingTask" @click="markReadyProd(editingTask)">Sẵn sàng main</a-button>
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
    </a-tabs>
  </a-drawer>
</template>
