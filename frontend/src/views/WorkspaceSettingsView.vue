<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { api } from '../services/api'
import { useSessionStore } from '../stores/session'

type ProjectRecord = {
  id: string
  code: string
  name: string
  description: string | null
  defaultRepoId: string | null
  _count?: {
    taskGroups: number
    repositories: number
    tasks: number
  }
}

type TaskGroupRecord = {
  id: string
  code: string
  name: string
  description: string | null
  enabled: boolean
  nextTaskNumber: number
  _count?: {
    tasks: number
  }
}

type RepositoryRecord = {
  id: string
  projectId: string
  name: string
  provider: string
  gitlabUrl: string | null
  gitlabProjectId: string | null
  gitlabProjectPath: string | null
  hasGitlabAccessToken: boolean
  defaultBranch: string
  productionBranch: string
  releaseBranchPattern: string
}

const session = useSessionStore()
const loading = ref(false)
const savingProject = ref(false)
const savingTaskGroup = ref(false)
const savingRepository = ref(false)
const projects = ref<ProjectRecord[]>([])
const taskGroups = ref<TaskGroupRecord[]>([])
const repositories = ref<RepositoryRecord[]>([])
const selectedProjectId = computed({
  get: () => session.selectedProjectId,
  set: (value: string | null) => session.selectProject(value),
})
const selectedProject = computed(
  () => projects.value.find((project) => project.id === selectedProjectId.value) ?? null,
)
const projectForm = reactive({
  id: '',
  code: '',
  name: '',
  description: '',
})
const taskGroupForm = reactive({
  id: '',
  code: '',
  name: '',
  description: '',
  enabled: true,
})
const repositoryForm = reactive({
  id: '',
  name: '',
  provider: 'GITLAB_SELF_HOSTED',
  gitlabUrl: '',
  gitlabProjectId: '',
  gitlabProjectPath: '',
  gitlabAccessToken: '',
  clearGitlabAccessToken: false,
  defaultBranch: 'main',
  productionBranch: 'main',
  releaseBranchPattern: 'release/DDMMYYYY',
  makeDefault: false,
})
const taskCodePreview = ref('')

const projectColumns = [
  { title: 'Mã', dataIndex: 'code', key: 'code', width: 112 },
  { title: 'Dự án', dataIndex: 'name', key: 'name' },
  { title: 'Task', key: 'tasks', width: 88 },
  { title: '', key: 'actions', width: 112 },
]
const taskGroupColumns = [
  { title: 'Mã', dataIndex: 'code', key: 'code', width: 112 },
  { title: 'Nhóm', dataIndex: 'name', key: 'name' },
  { title: 'Mã task kế tiếp', key: 'nextCode', width: 160 },
  { title: 'Trạng thái', key: 'enabled', width: 120 },
  { title: '', key: 'actions', width: 156 },
]
const repositoryColumns = [
  { title: 'Repository', dataIndex: 'name', key: 'name' },
  { title: 'GitLab', key: 'gitlab', width: 260 },
  { title: 'Nhánh', key: 'branches', width: 220 },
  { title: '', key: 'actions', width: 180 },
]

function resetProjectForm() {
  projectForm.id = ''
  projectForm.code = ''
  projectForm.name = ''
  projectForm.description = ''
}

function resetTaskGroupForm() {
  taskGroupForm.id = ''
  taskGroupForm.code = ''
  taskGroupForm.name = ''
  taskGroupForm.description = ''
  taskGroupForm.enabled = true
}

function resetRepositoryForm() {
  repositoryForm.id = ''
  repositoryForm.name = ''
  repositoryForm.provider = 'GITLAB_SELF_HOSTED'
  repositoryForm.gitlabUrl = ''
  repositoryForm.gitlabProjectId = ''
  repositoryForm.gitlabProjectPath = ''
  repositoryForm.gitlabAccessToken = ''
  repositoryForm.clearGitlabAccessToken = false
  repositoryForm.defaultBranch = 'main'
  repositoryForm.productionBranch = 'main'
  repositoryForm.releaseBranchPattern = 'release/DDMMYYYY'
  repositoryForm.makeDefault = false
}

async function loadProjects() {
  const { data } = await api.get<ProjectRecord[]>('/api/projects')

  projects.value = data

  if (!selectedProjectId.value || !data.some((project) => project.id === selectedProjectId.value)) {
    session.selectProject(data[0]?.id ?? null)
  }
}

async function loadProjectChildren() {
  if (!selectedProjectId.value) {
    taskGroups.value = []
    repositories.value = []
    taskCodePreview.value = ''
    return
  }

  const [taskGroupResponse, repositoryResponse, previewResponse] = await Promise.all([
    api.get<TaskGroupRecord[]>(`/api/projects/${selectedProjectId.value}/task-groups`),
    api.get<RepositoryRecord[]>(`/api/projects/${selectedProjectId.value}/repositories`),
    api.get<{ code: string }>(`/api/projects/${selectedProjectId.value}/task-code-preview`),
  ])

  taskGroups.value = taskGroupResponse.data
  repositories.value = repositoryResponse.data
  taskCodePreview.value = previewResponse.data.code
}

async function refreshWorkspace() {
  loading.value = true

  try {
    await loadProjects()
    await loadProjectChildren()
    await session.fetchMe()
  } finally {
    loading.value = false
  }
}

function editProject(project: ProjectRecord) {
  projectForm.id = project.id
  projectForm.code = project.code
  projectForm.name = project.name
  projectForm.description = project.description ?? ''
}

function projectRowClassName(project: ProjectRecord) {
  return project.id === selectedProjectId.value
    ? 'project-row-clickable project-row-selected'
    : 'project-row-clickable'
}

function customProjectRow(project: ProjectRecord) {
  return {
    onClick: () => session.selectProject(project.id),
  }
}

async function submitProject() {
  savingProject.value = true

  try {
    if (projectForm.id) {
      await api.patch(`/api/projects/${projectForm.id}`, projectForm)
    } else {
      const { data } = await api.post<ProjectRecord>('/api/projects', projectForm)

      session.selectProject(data.id)
    }

    resetProjectForm()
    await refreshWorkspace()
  } finally {
    savingProject.value = false
  }
}

async function deleteProject(project: ProjectRecord) {
  await api.delete(`/api/projects/${project.id}`)
  resetProjectForm()
  await refreshWorkspace()
}

function editTaskGroup(taskGroup: TaskGroupRecord) {
  taskGroupForm.id = taskGroup.id
  taskGroupForm.code = taskGroup.code
  taskGroupForm.name = taskGroup.name
  taskGroupForm.description = taskGroup.description ?? ''
  taskGroupForm.enabled = taskGroup.enabled
}

async function submitTaskGroup() {
  if (!selectedProjectId.value) {
    return
  }

  savingTaskGroup.value = true

  try {
    if (taskGroupForm.id) {
      await api.patch(`/api/task-groups/${taskGroupForm.id}`, taskGroupForm)
    } else {
      await api.post(`/api/projects/${selectedProjectId.value}/task-groups`, taskGroupForm)
    }

    resetTaskGroupForm()
    await loadProjectChildren()
  } finally {
    savingTaskGroup.value = false
  }
}

async function deleteTaskGroup(taskGroup: TaskGroupRecord) {
  await api.delete(`/api/task-groups/${taskGroup.id}`)
  resetTaskGroupForm()
  await loadProjectChildren()
}

function editRepository(repository: RepositoryRecord) {
  repositoryForm.id = repository.id
  repositoryForm.name = repository.name
  repositoryForm.provider = repository.provider
  repositoryForm.gitlabUrl = repository.gitlabUrl ?? ''
  repositoryForm.gitlabProjectId = repository.gitlabProjectId ?? ''
  repositoryForm.gitlabProjectPath = repository.gitlabProjectPath ?? ''
  repositoryForm.gitlabAccessToken = ''
  repositoryForm.clearGitlabAccessToken = false
  repositoryForm.defaultBranch = repository.defaultBranch
  repositoryForm.productionBranch = repository.productionBranch
  repositoryForm.releaseBranchPattern = repository.releaseBranchPattern
  repositoryForm.makeDefault = selectedProject.value?.defaultRepoId === repository.id
}

async function submitRepository() {
  if (!selectedProjectId.value) {
    return
  }

  savingRepository.value = true

  try {
    if (repositoryForm.id) {
      await api.patch(`/api/repositories/${repositoryForm.id}`, repositoryForm)
    } else {
      await api.post(`/api/projects/${selectedProjectId.value}/repositories`, repositoryForm)
    }

    resetRepositoryForm()
    await refreshWorkspace()
  } finally {
    savingRepository.value = false
  }
}

async function deleteRepository(repository: RepositoryRecord) {
  await api.delete(`/api/repositories/${repository.id}`)
  resetRepositoryForm()
  await refreshWorkspace()
}

watch(selectedProjectId, async () => {
  resetTaskGroupForm()
  resetRepositoryForm()
  await loadProjectChildren()
})

onMounted(refreshWorkspace)
</script>

<template>
  <section class="page-heading">
    <div>
      <h1>Cài đặt</h1>
      <p>Dự án, nhóm task và repository</p>
    </div>
    <a-button @click="refreshWorkspace">Làm mới</a-button>
  </section>

  <a-spin :spinning="loading">
    <section class="settings-grid">
      <a-card class="settings-card" title="Dự án">
        <a-form layout="vertical" :model="projectForm" @finish="submitProject">
          <a-form-item label="Mã dự án" name="code" :rules="[{ required: true, message: 'Nhập mã dự án' }]">
            <a-input v-model:value="projectForm.code" placeholder="PERSONAL" />
          </a-form-item>
          <a-form-item label="Tên dự án" name="name" :rules="[{ required: true, message: 'Nhập tên dự án' }]">
            <a-input v-model:value="projectForm.name" />
          </a-form-item>
          <a-form-item label="Ghi chú">
            <a-textarea v-model:value="projectForm.description" :rows="2" />
          </a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="savingProject">
              {{ projectForm.id ? 'Lưu dự án' : 'Thêm dự án' }}
            </a-button>
            <a-button @click="resetProjectForm">Hủy</a-button>
          </a-space>
        </a-form>

        <a-table
          class="compact-table"
          row-key="id"
          size="small"
          :columns="projectColumns"
          :data-source="projects"
          :pagination="false"
          :custom-row="customProjectRow"
          :row-class-name="projectRowClassName"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a-space>
                <span>{{ record.name }}</span>
                <a-tag v-if="record.id === selectedProjectId" color="blue">Đang chọn</a-tag>
              </a-space>
            </template>
            <template v-if="column.key === 'tasks'">
              {{ record._count?.tasks ?? 0 }}
            </template>
            <template v-if="column.key === 'actions'">
              <a-space>
                <a-button size="small" @click.stop="editProject(record)">Sửa</a-button>
                <a-popconfirm title="Xóa dự án này?" ok-text="Xóa" cancel-text="Hủy" @confirm="deleteProject(record)">
                  <a-button size="small" danger @click.stop>Xóa</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-card class="settings-card" title="Cấu hình dự án đang chọn">
        <a-empty v-if="!selectedProject" description="Chưa có dự án" />
        <a-tabs v-else>
          <a-tab-pane key="groups" tab="Nhóm task">
            <a-alert
              class="settings-alert"
              type="success"
              :message="`Đang chỉnh: ${selectedProject.code} - ${selectedProject.name}`"
            />
            <a-alert class="settings-alert" type="info" :message="`Mã task kế tiếp: ${taskCodePreview}`" />

            <a-form layout="vertical" :model="taskGroupForm" @finish="submitTaskGroup">
              <div class="form-grid">
                <a-form-item label="Mã nhóm" name="code" :rules="[{ required: true, message: 'Nhập mã nhóm' }]">
                  <a-input v-model:value="taskGroupForm.code" placeholder="FE" />
                </a-form-item>
                <a-form-item label="Tên nhóm" name="name" :rules="[{ required: true, message: 'Nhập tên nhóm' }]">
                  <a-input v-model:value="taskGroupForm.name" />
                </a-form-item>
              </div>
              <a-form-item label="Ghi chú">
                <a-textarea v-model:value="taskGroupForm.description" :rows="2" />
              </a-form-item>
              <a-form-item label="Đang dùng">
                <a-switch v-model:checked="taskGroupForm.enabled" />
              </a-form-item>
              <a-space>
                <a-button type="primary" html-type="submit" :loading="savingTaskGroup">
                  {{ taskGroupForm.id ? 'Lưu nhóm' : 'Thêm nhóm' }}
                </a-button>
                <a-button @click="resetTaskGroupForm">Hủy</a-button>
              </a-space>
            </a-form>

            <a-table
              class="compact-table"
              row-key="id"
              size="small"
              :columns="taskGroupColumns"
              :data-source="taskGroups"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'nextCode'">
                  {{ selectedProject?.code }}-{{ record.code }}-{{ String(record.nextTaskNumber).padStart(3, '0') }}
                </template>
                <template v-if="column.key === 'enabled'">
                  <a-tag :color="record.enabled ? 'success' : 'default'">
                    {{ record.enabled ? 'Đang dùng' : 'Tắt' }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'actions'">
                  <a-space>
                    <a-button size="small" @click="editTaskGroup(record)">Sửa</a-button>
                    <a-popconfirm title="Xóa nhóm này?" ok-text="Xóa" cancel-text="Hủy" @confirm="deleteTaskGroup(record)">
                      <a-button size="small" danger>Xóa</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-tab-pane>

          <a-tab-pane key="repositories" tab="Repository">
            <a-form layout="vertical" :model="repositoryForm" @finish="submitRepository">
              <div class="form-grid">
                <a-form-item label="Tên repository" name="name" :rules="[{ required: true, message: 'Nhập repository' }]">
                  <a-input v-model:value="repositoryForm.name" />
                </a-form-item>
                <a-form-item label="Provider">
                  <a-select v-model:value="repositoryForm.provider">
                    <a-select-option value="GITLAB_SELF_HOSTED">GitLab self-hosted</a-select-option>
                  </a-select>
                </a-form-item>
              </div>
              <div class="form-grid">
                <a-form-item label="GitLab URL">
                  <a-input v-model:value="repositoryForm.gitlabUrl" placeholder="https://gitlab.local" />
                </a-form-item>
                <a-form-item label="GitLab project path">
                  <a-input v-model:value="repositoryForm.gitlabProjectPath" placeholder="group/project" />
                </a-form-item>
              </div>
              <div class="form-grid">
                <a-form-item label="GitLab project id">
                  <a-input v-model:value="repositoryForm.gitlabProjectId" />
                </a-form-item>
                <a-form-item label="Access token">
                  <a-input-password v-model:value="repositoryForm.gitlabAccessToken" />
                </a-form-item>
              </div>
              <div class="form-grid">
                <a-form-item label="Default branch">
                  <a-input v-model:value="repositoryForm.defaultBranch" />
                </a-form-item>
                <a-form-item label="Production branch">
                  <a-input v-model:value="repositoryForm.productionBranch" />
                </a-form-item>
                <a-form-item label="Release pattern">
                  <a-input v-model:value="repositoryForm.releaseBranchPattern" />
                </a-form-item>
              </div>
              <a-space class="form-actions">
                <a-checkbox v-model:checked="repositoryForm.makeDefault">Repository mặc định</a-checkbox>
                <a-checkbox v-if="repositoryForm.id" v-model:checked="repositoryForm.clearGitlabAccessToken">
                  Xóa token
                </a-checkbox>
              </a-space>
              <a-space>
                <a-button type="primary" html-type="submit" :loading="savingRepository">
                  {{ repositoryForm.id ? 'Lưu repository' : 'Thêm repository' }}
                </a-button>
                <a-button @click="resetRepositoryForm">Hủy</a-button>
              </a-space>
            </a-form>

            <a-table
              class="compact-table"
              row-key="id"
              size="small"
              :columns="repositoryColumns"
              :data-source="repositories"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'gitlab'">
                  <div>{{ record.gitlabProjectPath || record.gitlabProjectId || '-' }}</div>
                  <a-tag v-if="record.hasGitlabAccessToken" color="success">Có token</a-tag>
                </template>
                <template v-if="column.key === 'branches'">
                  <div>{{ record.defaultBranch }} -> {{ record.releaseBranchPattern }} -> {{ record.productionBranch }}</div>
                  <a-tag v-if="selectedProject?.defaultRepoId === record.id" color="blue">Mặc định</a-tag>
                </template>
                <template v-if="column.key === 'actions'">
                  <a-space>
                    <a-button size="small" @click="editRepository(record)">Sửa</a-button>
                    <a-popconfirm title="Xóa repository này?" ok-text="Xóa" cancel-text="Hủy" @confirm="deleteRepository(record)">
                      <a-button size="small" danger>Xóa</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </section>
  </a-spin>
</template>
