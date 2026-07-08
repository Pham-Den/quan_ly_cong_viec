<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '../services/api'
import { noteStatusMeta, statusMeta, type WorkflowStatusRecord } from '../services/workflow'
import { useSessionStore } from '../stores/session'

type DashboardTask = {
  id: string
  code: string
  title: string
  status: string
  targetDate: string | null
  taskGroup?: {
    code: string
    name: string
  } | null
}

type DashboardBranch = {
  id: string
  name: string
  status: string
  actualMergedInto: string | null
  repository: {
    name: string
    productionBranch: string
  }
  taskLinks: Array<{
    task: {
      code: string
      title: string
      status: string
    }
  }>
}

type DashboardNote = {
  id: string
  content: string
  status: string
  source: string | null
}

type DashboardTimeline = {
  id: string
  eventType: string
  title: string
  description: string | null
  createdAt: string
  task?: {
    code: string
    title: string
  } | null
  branch?: {
    name: string
  } | null
}

type DashboardData = {
  bucketCounts: Record<string, number>
  activeTasks: DashboardTask[]
  blockedTasks: DashboardTask[]
  dueTasks: DashboardTask[]
  inboxNotes: DashboardNote[]
  branchesReady: DashboardBranch[]
  branchesNotMain: DashboardBranch[]
  recentTimeline: DashboardTimeline[]
}

const session = useSessionStore()
const router = useRouter()
const loading = ref(false)
const savingNote = ref(false)
const dashboard = ref<DashboardData | null>(null)
const workflowStatuses = ref<WorkflowStatusRecord[]>([])
const quickNote = reactive({
  content: '',
  source: '',
})
const taskBuckets = computed(() => [
  { key: 'notStarted', label: 'Chưa làm', tone: taskStatusColor('PLANNED') },
  { key: 'inProgress', label: 'Đang tiến hành', tone: taskStatusColor('IN_PROGRESS') },
  { key: 'inRelease', label: 'Đang ở release', tone: taskStatusColor('MERGED_RELEASE') },
  { key: 'done', label: 'Lên prod', tone: taskStatusColor('DONE') },
  { key: 'cancelled', label: 'Đã hủy', tone: taskStatusColor('CANCELLED') },
])

function dateValue(value: string | null) {
  return value ? value.slice(0, 10) : ''
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

async function loadDashboard() {
  if (!session.selectedProjectId) {
    dashboard.value = null
    workflowStatuses.value = []
    return
  }

  loading.value = true

  try {
    const [dashboardResponse, workflowResponse] = await Promise.all([
      api.get<DashboardData>(`/api/visibility/dashboard?projectId=${session.selectedProjectId}`),
      api.get<WorkflowStatusRecord[]>(`/api/workflow-statuses?projectId=${session.selectedProjectId}`),
    ])

    dashboard.value = dashboardResponse.data
    workflowStatuses.value = workflowResponse.data
  } finally {
    loading.value = false
  }
}

async function submitQuickNote() {
  if (!quickNote.content.trim()) {
    return
  }

  savingNote.value = true

  try {
    await api.post('/api/notes', {
      projectId: session.selectedProjectId,
      content: quickNote.content,
      source: quickNote.source,
    })
    quickNote.content = ''
    quickNote.source = ''
    await loadDashboard()
  } finally {
    savingNote.value = false
  }
}

async function openTask(taskId: string) {
  await router.push({ name: 'tasks', query: { taskId } })
}

async function openBranch(branchId: string) {
  await router.push({ name: 'branches', query: { branchId } })
}

watch(() => session.selectedProjectId, loadDashboard)
onMounted(loadDashboard)
</script>

<template>
  <section class="page-heading">
    <div>
      <h1>Tổng quan</h1>
      <p>Task, branch, release và main</p>
    </div>
    <a-button @click="loadDashboard">Làm mới</a-button>
  </section>

  <a-spin :spinning="loading">
    <section class="bucket-grid">
      <a-card v-for="bucket in taskBuckets" :key="bucket.key" class="bucket-card">
        <a-statistic :title="bucket.label" :value="dashboard?.bucketCounts[bucket.key] ?? 0" />
        <a-tag :color="bucket.tone">{{ dashboard?.bucketCounts[bucket.key] ?? 0 }} task</a-tag>
      </a-card>
    </section>

    <a-card class="quick-note-card" title="Inbox nhanh">
      <a-form layout="inline" :model="quickNote" @finish="submitQuickNote">
        <a-form-item name="content" :rules="[{ required: true, message: 'Nhập nội dung note' }]">
          <a-input v-model:value="quickNote.content" class="quick-note-input" placeholder="Ghi nhanh yêu cầu mới..." />
        </a-form-item>
        <a-form-item>
          <a-input v-model:value="quickNote.source" placeholder="Nguồn" />
        </a-form-item>
        <a-button type="primary" html-type="submit" :loading="savingNote">Thêm note</a-button>
      </a-form>
    </a-card>

    <section class="visibility-grid">
      <a-card title="Task đang chạy" class="work-panel">
        <a-list size="small" :data-source="dashboard?.activeTasks ?? []">
          <template #renderItem="{ item }">
            <a-list-item class="clickable-list-item" @click="openTask(item.id)">
              <a-list-item-meta :title="`${item.code} - ${item.title}`">
                <template #description>
                  <a-tag :color="taskStatusColor(item.status)">{{ taskStatusLabel(item.status) }}</a-tag>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-if="!dashboard?.activeTasks.length" description="Không có task đang chạy" />
      </a-card>

      <a-card title="Sắp/đã tới hạn" class="work-panel">
        <a-list size="small" :data-source="dashboard?.dueTasks ?? []">
          <template #renderItem="{ item }">
            <a-list-item class="clickable-list-item" @click="openTask(item.id)">
              <a-list-item-meta :title="`${item.code} - ${item.title}`" :description="`Hạn ${dateValue(item.targetDate)}`" />
              <a-tag :color="taskStatusColor(item.status)">{{ taskStatusLabel(item.status) }}</a-tag>
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-if="!dashboard?.dueTasks.length" description="Không có task tới hạn gần" />
      </a-card>

      <a-card title="Blocked" class="work-panel">
        <a-list size="small" :data-source="dashboard?.blockedTasks ?? []">
          <template #renderItem="{ item }">
            <a-list-item class="clickable-list-item" @click="openTask(item.id)">
              <a-list-item-meta :title="`${item.code} - ${item.title}`">
                <template #description>
                  <a-tag :color="taskStatusColor(item.status)">{{ taskStatusLabel(item.status) }}</a-tag>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-if="!dashboard?.blockedTasks.length" description="Không có task blocked" />
      </a-card>

      <a-card title="Branch cần chú ý" class="work-panel">
        <a-list size="small" :data-source="dashboard?.branchesReady ?? []">
          <template #renderItem="{ item }">
            <a-list-item class="clickable-list-item" @click="openBranch(item.id)">
              <a-list-item-meta :title="item.name" :description="item.repository.name" />
              <a-tag :color="branchStatusColor(item.status)">{{ branchStatusLabel(item.status) }}</a-tag>
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-if="!dashboard?.branchesReady.length" description="Không có branch cần chú ý" />
      </a-card>

      <a-card title="Inbox chưa xử lý" class="work-panel">
        <a-list size="small" :data-source="dashboard?.inboxNotes ?? []">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.content" :description="item.source || noteStatusMeta[item.status]?.label || item.status" />
              <a-tag :color="noteStatusMeta[item.status]?.color">{{ noteStatusMeta[item.status]?.label ?? item.status }}</a-tag>
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-if="!dashboard?.inboxNotes.length" description="Inbox trống" />
      </a-card>

      <a-card title="Timeline gần đây" class="work-panel">
        <a-list size="small" :data-source="dashboard?.recentTimeline ?? []">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.title" :description="item.eventType" />
            </a-list-item>
          </template>
        </a-list>
        <a-empty v-if="!dashboard?.recentTimeline.length" description="Chưa có timeline" />
      </a-card>
    </section>
  </a-spin>
</template>
