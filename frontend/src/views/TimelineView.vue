<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { api } from '../services/api'
import { statusMeta, type WorkflowStatusRecord } from '../services/workflow'
import { useSessionStore } from '../stores/session'

type TaskRecord = {
  id: string
  code: string
  title: string
  status: string
}

type BranchRecord = {
  id: string
  name: string
  status: string
}

type TimelineEventRecord = {
  id: string
  projectId: string
  taskId: string | null
  branchId: string | null
  eventType: string
  title: string
  description: string | null
  createdAt: string
  project: {
    code: string
    name: string
  }
  task?: TaskRecord | null
  branch?: BranchRecord | null
  createdBy?: {
    name: string
    email: string
  } | null
}

const session = useSessionStore()
const loading = ref(false)
const events = ref<TimelineEventRecord[]>([])
const tasks = ref<TaskRecord[]>([])
const branches = ref<BranchRecord[]>([])
const workflowStatuses = ref<WorkflowStatusRecord[]>([])
const selectedProjectId = computed(() => session.selectedProjectId)
const filters = reactive({
  taskId: '',
  branchId: '',
  eventType: '',
  dateFrom: '',
  dateTo: '',
})
const commentForm = reactive({
  title: '',
  description: '',
  taskId: '',
  branchId: '',
})
const eventTypeOptions = [
  { label: 'Tất cả event', value: '' },
  { label: 'Note tạo', value: 'NOTE_CREATED' },
  { label: 'Note lưu trữ', value: 'NOTE_ARCHIVED' },
  { label: 'Note thành task', value: 'NOTE_CONVERTED' },
  { label: 'Task tạo', value: 'TASK_CREATED' },
  { label: 'Task đổi trạng thái', value: 'TASK_STATUS_CHANGED' },
  { label: 'Task blocked', value: 'TASK_BLOCKED' },
  { label: 'Task unblocked', value: 'TASK_UNBLOCKED' },
  { label: 'Task vào release', value: 'TASK_MERGED_RELEASE' },
  { label: 'Task done bởi main', value: 'TASK_DONE_BY_MAIN_MERGE' },
  { label: 'Branch tạo', value: 'BRANCH_CREATED' },
  { label: 'Branch đổi trạng thái', value: 'BRANCH_STATUS_CHANGED' },
  { label: 'Branch merge release', value: 'BRANCH_MERGED_RELEASE' },
  { label: 'Branch merge main', value: 'BRANCH_MERGED_MAIN' },
  { label: 'Ghi chú', value: 'TIMELINE_COMMENT' },
]
const taskOptions = computed(() =>
  tasks.value.map((task) => ({
    label: `${task.code} - ${task.title}`,
    value: task.id,
  })),
)
const branchOptions = computed(() =>
  branches.value.map((branch) => ({
    label: branch.name,
    value: branch.id,
  })),
)

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
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

async function loadTasks() {
  if (!selectedProjectId.value) {
    tasks.value = []
    return
  }

  const { data } = await api.get<TaskRecord[]>(`/api/tasks?projectId=${selectedProjectId.value}`)

  tasks.value = data
}

async function loadBranches() {
  if (!selectedProjectId.value) {
    branches.value = []
    return
  }

  const { data } = await api.get<BranchRecord[]>(`/api/branches?projectId=${selectedProjectId.value}`)

  branches.value = data
}

async function loadWorkflowStatuses() {
  if (!selectedProjectId.value) {
    workflowStatuses.value = []
    return
  }

  const { data } = await api.get<WorkflowStatusRecord[]>(`/api/workflow-statuses?projectId=${selectedProjectId.value}`)

  workflowStatuses.value = data
}

async function loadTimeline() {
  const params = new URLSearchParams()

  if (selectedProjectId.value) {
    params.set('projectId', selectedProjectId.value)
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value)
    }
  }

  const { data } = await api.get<TimelineEventRecord[]>(`/api/timeline?${params.toString()}`)

  events.value = data
}

async function refreshTimeline() {
  loading.value = true

  try {
    await Promise.all([loadTasks(), loadBranches(), loadWorkflowStatuses(), loadTimeline()])
  } finally {
    loading.value = false
  }
}

async function submitComment() {
  if (!selectedProjectId.value || !commentForm.description.trim()) {
    return
  }

  await api.post('/api/timeline/comment', {
    projectId: selectedProjectId.value,
    taskId: commentForm.taskId,
    branchId: commentForm.branchId,
    title: commentForm.title,
    description: commentForm.description,
  })

  commentForm.title = ''
  commentForm.description = ''
  await loadTimeline()
}

watch(selectedProjectId, refreshTimeline)
watch(filters, loadTimeline)
onMounted(refreshTimeline)
</script>

<template>
  <section class="page-heading">
    <div>
      <h1>Dòng thời gian</h1>
      <p>Nhật ký note, task, branch, merge và ghi chú theo dự án</p>
    </div>
    <a-button @click="refreshTimeline">Làm mới</a-button>
  </section>

  <section class="timeline-grid">
    <a-card class="settings-card" title="Bộ lọc">
      <a-space class="filter-row">
        <a-select
          v-model:value="filters.taskId"
          class="filter-control"
          allow-clear
          placeholder="Task"
          :options="taskOptions"
        />
        <a-select
          v-model:value="filters.branchId"
          class="filter-control"
          allow-clear
          placeholder="Branch"
          :options="branchOptions"
        />
        <a-select
          v-model:value="filters.eventType"
          class="filter-control"
          allow-clear
          placeholder="Loại event"
          :options="eventTypeOptions"
        />
        <a-input v-model:value="filters.dateFrom" class="filter-control" type="date" />
        <a-input v-model:value="filters.dateTo" class="filter-control" type="date" />
      </a-space>

      <a-spin :spinning="loading">
        <a-timeline class="timeline-list">
          <a-timeline-item v-for="event in events" :key="event.id">
            <div class="timeline-event">
              <div class="timeline-event-head">
                <strong>{{ event.title }}</strong>
                <a-tag>{{ event.eventType }}</a-tag>
              </div>
              <div class="muted-text">
                {{ formatDate(event.createdAt) }}
                <span v-if="event.createdBy">- {{ event.createdBy.name }}</span>
              </div>
              <div v-if="event.description" class="timeline-description">{{ event.description }}</div>
              <a-space wrap>
                <a-tag>{{ event.project.code }}</a-tag>
                <a-tag v-if="event.task" :color="taskStatusColor(event.task.status)">
                  {{ event.task.code }} - {{ taskStatusLabel(event.task.status) }}
                </a-tag>
                <a-tag v-if="event.branch" :color="branchStatusColor(event.branch.status)">
                  {{ event.branch.name }} - {{ branchStatusLabel(event.branch.status) }}
                </a-tag>
              </a-space>
            </div>
          </a-timeline-item>
        </a-timeline>
        <a-empty v-if="!events.length && !loading" description="Chưa có timeline" />
      </a-spin>
    </a-card>

    <a-card class="settings-card" title="Ghi chú">
      <a-form layout="vertical" :model="commentForm" @finish="submitComment">
        <a-form-item label="Tiêu đề">
          <a-input v-model:value="commentForm.title" placeholder="Ví dụ: Cần kiểm tra lại case export" />
        </a-form-item>
        <a-form-item label="Gắn với task">
          <a-select v-model:value="commentForm.taskId" allow-clear :options="taskOptions" />
        </a-form-item>
        <a-form-item label="Gắn với branch">
          <a-select v-model:value="commentForm.branchId" allow-clear :options="branchOptions" />
        </a-form-item>
        <a-form-item label="Nội dung" name="description" :rules="[{ required: true, message: 'Nhập nội dung ghi chú' }]">
          <a-textarea v-model:value="commentForm.description" :rows="5" />
        </a-form-item>
        <a-button type="primary" html-type="submit">Thêm ghi chú</a-button>
      </a-form>
    </a-card>
  </section>
</template>
