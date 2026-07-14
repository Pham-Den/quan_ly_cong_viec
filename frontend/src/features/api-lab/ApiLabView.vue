<script setup lang="ts">
import {
  DeleteOutlined,
  ImportOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import AppJsonCodeBlock from '../../core/components/AppJsonCodeBlock.vue'
import { useSessionStore } from '../../stores/session'
import {
  deleteApiRequest,
  importCurl,
  loadApiEnvironments,
  loadApiRequestRuns,
  loadApiRequests,
  runApiRequest,
  saveApiEnvironment,
  saveApiRequest,
  saveApiRunResponse,
  type ApiEnvironment,
  type ApiEnvironmentVariable,
  type ApiRequest,
  type ApiRequestRun,
  type ApiRunResult,
} from './ts/service'
import { api } from '../../services/api'

type KeyValueRow = {
  key: string
  value: string
  enabled: boolean
}

type VariableRow = {
  key: string
  secret: boolean
  variants: Array<{
    name: string
    value: string
    enabled: boolean
    hasValue?: boolean
  }>
}

type TaskOptionRecord = {
  id: string
  code: string
  title: string
}

const session = useSessionStore()
const loading = ref(false)
const savingEnvironment = ref(false)
const savingRequest = ref(false)
const runningRequest = ref(false)
const savingResponse = ref(false)
const curlDrawerOpen = ref(false)
const curlInput = ref('')
const activeLeftTab = ref('requests')
const environments = ref<ApiEnvironment[]>([])
const requests = ref<ApiRequest[]>([])
const tasks = ref<TaskOptionRecord[]>([])
const requestRuns = ref<ApiRequestRun[]>([])
const selectedEnvironmentId = ref<string | null>(null)
const selectedRequestId = ref<string | null>(null)
const currentResult = ref<ApiRunResult | null>(null)
const runtimeVariablesText = ref('{}')
const runSaveResponseBody = ref(false)
const selectedProjectId = computed(() => session.selectedProjectId)
const selectedRequest = computed(() => requests.value.find((request) => request.id === selectedRequestId.value) ?? null)
const environmentOptions = computed(() =>
  environments.value.map((environment) => ({
    label: `${environment.name} (${environment.environmentType.toLowerCase()})`,
    value: environment.id,
  })),
)
const taskOptions = computed(() =>
  tasks.value.map((task) => ({
    label: `${task.code} - ${task.title}`,
    value: task.id,
  })),
)
const requestList = computed(() =>
  [...requests.value].sort((left, right) =>
    `${left.collectionName}-${left.sortOrder}-${left.name}`.localeCompare(`${right.collectionName}-${right.sortOrder}-${right.name}`),
  ),
)
const responseStatusColor = computed(() => {
  const status = currentResult.value?.run.status

  if (status === 'PASSED') {
    return 'green'
  }

  if (status === 'FAILED') {
    return 'red'
  }

  return 'default'
})
const responseHeadersText = computed(() =>
  currentResult.value?.response?.headers ? JSON.stringify(currentResult.value.response.headers, null, 2) : '',
)

const environmentForm = reactive({
  id: '',
  name: '',
  environmentType: 'LOCAL',
  baseUrl: '',
  enabled: true,
  variables: [] as VariableRow[],
})
const requestForm = reactive({
  id: '',
  collectionName: 'Mac dinh',
  name: '',
  taskId: null as string | null,
  method: 'GET',
  url: '',
  query: [] as KeyValueRow[],
  headers: [] as KeyValueRow[],
  bodyType: 'NONE',
  bodyText: '',
  authType: 'NONE',
  authToken: '',
  authUsername: '',
  authPassword: '',
  timeoutMs: 30000,
  storeResponseBody: false,
})
const environmentTypeOptions = [
  { label: 'Local', value: 'LOCAL' },
  { label: 'Dev', value: 'DEV' },
  { label: 'UAT', value: 'UAT' },
  { label: 'Prod', value: 'PROD' },
  { label: 'Custom', value: 'CUSTOM' },
]
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((method) => ({
  label: method,
  value: method,
}))
const bodyTypeOptions = [
  { label: 'None', value: 'NONE' },
  { label: 'JSON', value: 'JSON' },
  { label: 'Text', value: 'TEXT' },
  { label: 'Form', value: 'FORM' },
]
const authTypeOptions = [
  { label: 'Không dùng', value: 'NONE' },
  { label: 'Bearer token', value: 'BEARER' },
  { label: 'Basic auth', value: 'BASIC' },
]

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value)

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function rowsFromJson(value: string): KeyValueRow[] {
  return parseJsonArray(value).map((row) => ({
    key: typeof row?.key === 'string' ? row.key : '',
    value: typeof row?.value === 'string' ? row.value : '',
    enabled: row?.enabled !== false,
  }))
}

function authFromJson(value: string) {
  const auth = parseJsonObject(value)

  requestForm.authType = typeof auth.type === 'string' ? auth.type.toUpperCase() : 'NONE'
  requestForm.authToken = typeof auth.token === 'string' ? auth.token : ''
  requestForm.authUsername = typeof auth.username === 'string' ? auth.username : ''
  requestForm.authPassword = typeof auth.password === 'string' ? auth.password : ''
}

function requestAuthPayload() {
  if (requestForm.authType === 'BEARER') {
    return {
      type: 'BEARER',
      token: requestForm.authToken,
    }
  }

  if (requestForm.authType === 'BASIC') {
    return {
      type: 'BASIC',
      username: requestForm.authUsername,
      password: requestForm.authPassword,
    }
  }

  return { type: 'NONE' }
}

function resetEnvironmentForm() {
  environmentForm.id = ''
  environmentForm.name = 'local'
  environmentForm.environmentType = 'LOCAL'
  environmentForm.baseUrl = ''
  environmentForm.enabled = true
  environmentForm.variables = [
    {
      key: 'token',
      secret: true,
      variants: [{ name: 'default', value: '', enabled: true }],
    },
  ]
}

function setEnvironmentForm(environment: ApiEnvironment) {
  environmentForm.id = environment.id
  environmentForm.name = environment.name
  environmentForm.environmentType = environment.environmentType
  environmentForm.baseUrl = environment.baseUrl ?? ''
  environmentForm.enabled = environment.enabled
  environmentForm.variables = environment.variables.map((variable) => ({
    key: variable.key,
    secret: variable.secret,
    variants: variable.variants.map((variant) => ({
      name: variant.name,
      value: variant.value,
      enabled: variant.enabled ?? true,
      hasValue: variant.hasValue,
    })),
  }))
}

function resetRequestForm() {
  requestForm.id = ''
  requestForm.collectionName = 'Mac dinh'
  requestForm.name = ''
  requestForm.taskId = null
  requestForm.method = 'GET'
  requestForm.url = ''
  requestForm.query = []
  requestForm.headers = []
  requestForm.bodyType = 'NONE'
  requestForm.bodyText = ''
  requestForm.authType = 'NONE'
  requestForm.authToken = ''
  requestForm.authUsername = ''
  requestForm.authPassword = ''
  requestForm.timeoutMs = 30000
  requestForm.storeResponseBody = false
  selectedRequestId.value = null
  requestRuns.value = []
  currentResult.value = null
}

function setRequestForm(request: ApiRequest) {
  requestForm.id = request.id
  requestForm.collectionName = request.collectionName
  requestForm.name = request.name
  requestForm.taskId = request.taskId
  requestForm.method = request.method
  requestForm.url = request.url
  requestForm.query = rowsFromJson(request.queryJson)
  requestForm.headers = rowsFromJson(request.headersJson)
  requestForm.bodyType = request.bodyType
  requestForm.bodyText = request.bodyText ?? ''
  requestForm.timeoutMs = request.timeoutMs
  requestForm.storeResponseBody = request.storeResponseBody
  authFromJson(request.authJson)
}

function addKeyValueRow(rows: KeyValueRow[]) {
  rows.push({ key: '', value: '', enabled: true })
}

function removeKeyValueRow(rows: KeyValueRow[], index: number) {
  rows.splice(index, 1)
}

function addVariable() {
  environmentForm.variables.push({
    key: '',
    secret: false,
    variants: [{ name: 'default', value: '', enabled: true }],
  })
}

function removeVariable(index: number) {
  environmentForm.variables.splice(index, 1)
}

function addVariant(variable: VariableRow) {
  variable.variants.push({ name: `variant-${variable.variants.length + 1}`, value: '', enabled: true })
}

function removeVariant(variable: VariableRow, index: number) {
  variable.variants.splice(index, 1)
}

async function loadTasks() {
  if (!selectedProjectId.value) {
    tasks.value = []
    return
  }

  const { data } = await api.get<TaskOptionRecord[]>(`/api/tasks?projectId=${selectedProjectId.value}`)

  tasks.value = data
}

async function refreshApiLab() {
  if (!selectedProjectId.value) {
    environments.value = []
    requests.value = []
    tasks.value = []
    resetEnvironmentForm()
    resetRequestForm()
    return
  }

  loading.value = true

  try {
    const [environmentData, requestData] = await Promise.all([
      loadApiEnvironments(selectedProjectId.value),
      loadApiRequests(selectedProjectId.value),
    ])
    await loadTasks()

    environments.value = environmentData
    requests.value = requestData

    if (!selectedEnvironmentId.value || !environmentData.some((environment) => environment.id === selectedEnvironmentId.value)) {
      selectedEnvironmentId.value = environmentData[0]?.id ?? null
    }

    const selectedEnvironment = environmentData.find((environment) => environment.id === selectedEnvironmentId.value)

    if (selectedEnvironment) {
      setEnvironmentForm(selectedEnvironment)
    } else {
      resetEnvironmentForm()
    }

    if (selectedRequestId.value) {
      const selected = requestData.find((request) => request.id === selectedRequestId.value)

      if (selected) {
        setRequestForm(selected)
        await loadRuns(selected.id)
      }
    } else if (requestData[0]) {
      selectedRequestId.value = requestData[0].id
      setRequestForm(requestData[0])
      await loadRuns(requestData[0].id)
    }
  } finally {
    loading.value = false
  }
}

async function loadRuns(requestId: string) {
  requestRuns.value = await loadApiRequestRuns(requestId)
}

function selectRequest(request: ApiRequest) {
  selectedRequestId.value = request.id
  setRequestForm(request)
  currentResult.value = null
  void loadRuns(request.id)
}

function newRequest() {
  resetRequestForm()
  requestForm.collectionName = selectedRequest.value?.collectionName ?? 'Mac dinh'
}

async function submitEnvironment() {
  if (!selectedProjectId.value || !environmentForm.name.trim()) {
    return
  }

  savingEnvironment.value = true

  try {
    const saved = await saveApiEnvironment({
      id: environmentForm.id || undefined,
      projectId: selectedProjectId.value,
      name: environmentForm.name,
      environmentType: environmentForm.environmentType,
      baseUrl: environmentForm.baseUrl,
      enabled: environmentForm.enabled,
      variables: environmentForm.variables
        .filter((variable) => variable.key.trim())
        .map((variable): ApiEnvironmentVariable => ({
          key: variable.key.trim(),
          secret: variable.secret,
          variants: variable.variants
            .filter((variant) => variant.name.trim())
            .map((variant) => ({
              name: variant.name.trim(),
              value: variable.secret && variant.hasValue && !variant.value ? '********' : variant.value,
              enabled: variant.enabled,
            })),
        })),
    })

    selectedEnvironmentId.value = saved.id
    message.success('Đã lưu environment.')
    await refreshApiLab()
  } finally {
    savingEnvironment.value = false
  }
}

async function submitRequest() {
  if (!selectedProjectId.value || !requestForm.name.trim() || !requestForm.url.trim()) {
    message.warning('Cần nhập tên và URL request.')
    return
  }

  savingRequest.value = true

  try {
    const saved = await saveApiRequest({
      id: requestForm.id || undefined,
      projectId: selectedProjectId.value,
      taskId: requestForm.taskId,
      collectionName: requestForm.collectionName,
      name: requestForm.name,
      method: requestForm.method,
      url: requestForm.url,
      query: requestForm.query.filter((row) => row.key.trim()),
      headers: requestForm.headers.filter((row) => row.key.trim()),
      bodyType: requestForm.bodyType,
      bodyText: requestForm.bodyText,
      auth: requestAuthPayload(),
      timeoutMs: requestForm.timeoutMs,
      storeResponseBody: requestForm.storeResponseBody,
    })

    selectedRequestId.value = saved.id
    message.success('Đã lưu request.')
    await refreshApiLab()
  } finally {
    savingRequest.value = false
  }
}

async function removeRequest() {
  if (!requestForm.id) {
    return
  }

  await deleteApiRequest(requestForm.id)
  message.success('Đã xóa request.')
  resetRequestForm()
  await refreshApiLab()
}

function runtimeVariables() {
  try {
    const parsed = JSON.parse(runtimeVariablesText.value || '{}')

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid runtime vars')
    }

    return parsed as Record<string, string>
  } catch {
    message.warning('Runtime variables phải là JSON object.')
    return null
  }
}

async function runCurrentRequest() {
  if (!requestForm.id) {
    await submitRequest()
  }

  if (!requestForm.id) {
    return
  }

  const runtime = runtimeVariables()

  if (!runtime) {
    return
  }

  runningRequest.value = true

  try {
    currentResult.value = await runApiRequest(requestForm.id, {
      environmentId: selectedEnvironmentId.value,
      runtimeVariables: runtime,
      saveResponseBody: runSaveResponseBody.value,
    })
    await loadRuns(requestForm.id)

    if (currentResult.value.run.status === 'PASSED') {
      message.success('Request chạy thành công.')
    } else {
      message.warning(currentResult.value.run.errorMessage || 'Request chạy lỗi.')
    }
  } finally {
    runningRequest.value = false
  }
}

async function saveCurrentResponse() {
  if (!currentResult.value?.response || currentResult.value.response.savedResponseId) {
    return
  }

  savingResponse.value = true

  try {
    const saved = await saveApiRunResponse(currentResult.value.run.id, {
      statusCode: currentResult.value.response.httpStatus,
      headers: currentResult.value.response.headers,
      bodyText: currentResult.value.response.bodyPreview,
      contentType: currentResult.value.response.headers['content-type'] ?? null,
      originalSize: currentResult.value.response.originalSize,
      truncated: currentResult.value.response.truncated,
    }) as { id: string }

    currentResult.value.run.responseBodySaved = true
    currentResult.value.response.savedResponseId = saved.id
    await loadRuns(requestForm.id)
    message.success('Đã lưu response.')
  } finally {
    savingResponse.value = false
  }
}

async function applyCurlImport() {
  if (!curlInput.value.trim()) {
    return
  }

  const draft = await importCurl(curlInput.value)

  requestForm.method = draft.method
  requestForm.url = draft.url
  requestForm.query = draft.query.map((row) => ({ ...row, enabled: true }))
  requestForm.headers = draft.headers.map((row) => ({ ...row, enabled: true }))
  requestForm.bodyType = draft.bodyType
  requestForm.bodyText = draft.bodyText ?? ''
  curlDrawerOpen.value = false
  message.success('Đã import cURL vào request draft.')
}

watch(selectedProjectId, refreshApiLab)
watch(selectedEnvironmentId, (environmentId) => {
  const environment = environments.value.find((item) => item.id === environmentId)

  if (environment) {
    setEnvironmentForm(environment)
  }
})
onMounted(refreshApiLab)
</script>

<template>
  <section class="page-heading">
    <div>
      <h1>API Lab</h1>
      <p>Lưu collection request nội bộ, chạy qua backend và kiểm tra response theo project</p>
    </div>
    <a-space>
      <a-button @click="refreshApiLab">Làm mới</a-button>
      <a-button type="primary" @click="newRequest">
        <template #icon><PlusOutlined /></template>
        Request
      </a-button>
    </a-space>
  </section>

  <a-alert
    v-if="!selectedProjectId"
    class="settings-alert"
    type="warning"
    show-icon
    message="Chọn dự án trước khi dùng API Lab."
  />

  <a-spin :spinning="loading">
    <section class="api-lab-grid">
      <a-card class="settings-card api-lab-left-panel" title="Collection">
        <a-tabs v-model:active-key="activeLeftTab" size="small">
          <a-tab-pane key="requests" tab="Requests">
            <a-button class="api-lab-full-button" @click="newRequest">
              <template #icon><PlusOutlined /></template>
              Request mới
            </a-button>
            <a-list class="api-lab-request-list" size="small" :data-source="requestList">
              <template #renderItem="{ item }">
                <a-list-item
                  class="api-lab-request-item"
                  :class="{ 'api-lab-request-item-active': item.id === selectedRequestId }"
                  @click="selectRequest(item)"
                >
                  <a-list-item-meta>
                    <template #title>
                      <a-space>
                        <a-tag color="blue">{{ item.method }}</a-tag>
                        <span>{{ item.name }}</span>
                      </a-space>
                    </template>
                    <template #description>
                      <span>{{ item.collectionName }}</span>
                      <span v-if="item.task"> · {{ item.task.code }}</span>
                      <span> · {{ item._count?.requestRuns ?? 0 }} run</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-tab-pane>
          <a-tab-pane key="flows" tab="Flows">
            <a-empty description="Flow nhiều request sẽ làm ở phase sau." />
          </a-tab-pane>
        </a-tabs>
      </a-card>

      <a-card class="settings-card api-lab-editor-card" title="Request editor">
        <a-form layout="vertical" :model="requestForm" @finish="submitRequest">
          <div class="form-grid">
            <a-form-item label="Collection">
              <a-input v-model:value="requestForm.collectionName" />
            </a-form-item>
            <a-form-item label="Link task">
              <a-select
                v-model:value="requestForm.taskId"
                allow-clear
                show-search
                :options="taskOptions"
                placeholder="Không bắt buộc"
              />
            </a-form-item>
            <a-form-item label="Tên request" required>
              <a-input v-model:value="requestForm.name" placeholder="Login, tạo đơn, kiểm tra trạng thái..." />
            </a-form-item>
          </div>

          <div class="api-lab-url-row">
            <a-select v-model:value="requestForm.method" :options="methodOptions" />
            <a-input v-model:value="requestForm.url" placeholder="{{baseUrl}}/api/example/{{task.code}}" />
            <a-input-number v-model:value="requestForm.timeoutMs" :min="1" addon-after="ms" />
          </div>

          <a-tabs size="small">
            <a-tab-pane key="query" tab="Query">
              <div class="api-lab-kv-list">
                <div v-for="(row, index) in requestForm.query" :key="index" class="api-lab-kv-row">
                  <a-checkbox v-model:checked="row.enabled" />
                  <a-input v-model:value="row.key" placeholder="key" />
                  <a-input v-model:value="row.value" placeholder="value hoặc {{variable}}" />
                  <a-button danger @click="removeKeyValueRow(requestForm.query, index)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
                <a-button @click="addKeyValueRow(requestForm.query)">
                  <template #icon><PlusOutlined /></template>
                  Thêm query
                </a-button>
              </div>
            </a-tab-pane>
            <a-tab-pane key="headers" tab="Headers">
              <div class="api-lab-kv-list">
                <div v-for="(row, index) in requestForm.headers" :key="index" class="api-lab-kv-row">
                  <a-checkbox v-model:checked="row.enabled" />
                  <a-input v-model:value="row.key" placeholder="header" />
                  <a-input v-model:value="row.value" placeholder="value hoặc {{token}}" />
                  <a-button danger @click="removeKeyValueRow(requestForm.headers, index)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
                <a-button @click="addKeyValueRow(requestForm.headers)">
                  <template #icon><PlusOutlined /></template>
                  Thêm header
                </a-button>
              </div>
            </a-tab-pane>
            <a-tab-pane key="body" tab="Body">
              <a-form-item label="Body type">
                <a-select v-model:value="requestForm.bodyType" :options="bodyTypeOptions" />
              </a-form-item>
              <a-textarea v-model:value="requestForm.bodyText" :rows="9" placeholder='{"id":"{{task.code}}"}' />
            </a-tab-pane>
            <a-tab-pane key="auth" tab="Auth">
              <div class="form-grid">
                <a-form-item label="Kiểu auth">
                  <a-select v-model:value="requestForm.authType" :options="authTypeOptions" />
                </a-form-item>
                <a-form-item v-if="requestForm.authType === 'BEARER'" label="Token">
                  <a-input v-model:value="requestForm.authToken" placeholder="{{token}}" />
                </a-form-item>
                <template v-if="requestForm.authType === 'BASIC'">
                  <a-form-item label="Username">
                    <a-input v-model:value="requestForm.authUsername" />
                  </a-form-item>
                  <a-form-item label="Password">
                    <a-input-password v-model:value="requestForm.authPassword" />
                  </a-form-item>
                </template>
              </div>
            </a-tab-pane>
            <a-tab-pane key="options" tab="Options">
              <a-checkbox v-model:checked="requestForm.storeResponseBody">
                Luôn lưu response body cho request này
              </a-checkbox>
            </a-tab-pane>
          </a-tabs>

          <a-space class="form-actions">
            <a-button type="primary" html-type="submit" :loading="savingRequest">
              <template #icon><SaveOutlined /></template>
              Lưu request
            </a-button>
            <a-button @click="curlDrawerOpen = true">
              <template #icon><ImportOutlined /></template>
              Import cURL
            </a-button>
            <a-popconfirm v-if="requestForm.id" title="Xóa request này?" @confirm="removeRequest">
              <a-button danger>
                <template #icon><DeleteOutlined /></template>
                Xóa
              </a-button>
            </a-popconfirm>
          </a-space>
        </a-form>
      </a-card>

      <div class="api-lab-side-stack">
        <a-card class="settings-card" title="Môi trường">
          <a-form layout="vertical" :model="environmentForm" @finish="submitEnvironment">
            <a-form-item label="Chọn environment">
              <a-select v-model:value="selectedEnvironmentId" allow-clear :options="environmentOptions" />
            </a-form-item>
            <div class="form-grid">
              <a-form-item label="Tên">
                <a-input v-model:value="environmentForm.name" />
              </a-form-item>
              <a-form-item label="Loại">
                <a-select v-model:value="environmentForm.environmentType" :options="environmentTypeOptions" />
              </a-form-item>
            </div>
            <a-form-item label="Base URL">
              <a-input v-model:value="environmentForm.baseUrl" placeholder="http://localhost:4000" />
            </a-form-item>
            <div class="api-lab-variable-list">
              <div v-for="(variable, variableIndex) in environmentForm.variables" :key="variableIndex" class="api-lab-variable">
                <div class="api-lab-variable-head">
                  <a-input v-model:value="variable.key" placeholder="Tên biến" />
                  <a-checkbox v-model:checked="variable.secret">Secret</a-checkbox>
                  <a-button danger @click="removeVariable(variableIndex)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
                <div v-for="(variant, variantIndex) in variable.variants" :key="variantIndex" class="api-lab-variant-row">
                  <a-input v-model:value="variant.name" placeholder="variant" />
                  <a-input-password v-if="variable.secret" v-model:value="variant.value" placeholder="Giá trị secret" />
                  <a-input v-else v-model:value="variant.value" placeholder="value" />
                  <a-checkbox v-model:checked="variant.enabled">Dùng</a-checkbox>
                  <a-button danger @click="removeVariant(variable, variantIndex)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
                <a-button size="small" @click="addVariant(variable)">Thêm variant</a-button>
              </div>
              <a-button @click="addVariable">
                <template #icon><PlusOutlined /></template>
                Thêm biến
              </a-button>
            </div>
            <a-button class="api-lab-full-button" type="primary" html-type="submit" :loading="savingEnvironment">
              Lưu environment
            </a-button>
          </a-form>
        </a-card>

        <a-card class="settings-card" title="Run và response">
          <a-space direction="vertical" class="api-lab-run-panel">
            <a-checkbox v-model:checked="runSaveResponseBody">Lưu response body cho lần chạy này</a-checkbox>
            <a-form-item label="Runtime variables JSON">
              <a-textarea v-model:value="runtimeVariablesText" :rows="3" />
            </a-form-item>
            <a-button type="primary" :loading="runningRequest" :disabled="!requestForm.url" @click="runCurrentRequest">
              <template #icon><SendOutlined /></template>
              Chạy request
            </a-button>

            <a-empty v-if="!currentResult" description="Chưa có response." />
            <template v-else>
              <a-space wrap>
                <a-tag :color="responseStatusColor">{{ currentResult.run.status }}</a-tag>
                <a-tag>{{ currentResult.response?.httpStatus ?? 'No status' }}</a-tag>
                <a-tag>{{ currentResult.response?.durationMs ?? currentResult.run.durationMs }}ms</a-tag>
                <a-tag v-if="currentResult.response?.truncated" color="orange">Truncated</a-tag>
              </a-space>
              <a-alert v-if="currentResult.run.errorMessage" type="error" show-icon :message="currentResult.run.errorMessage" />
              <a-button
                v-if="currentResult.response && !currentResult.response.savedResponseId"
                :loading="savingResponse"
                @click="saveCurrentResponse"
              >
                Lưu kết quả
              </a-button>
              <a-tabs size="small">
                <a-tab-pane key="body" tab="Body">
                  <AppJsonCodeBlock :value="currentResult.response?.bodyPreview" empty-text="Không có body" />
                </a-tab-pane>
                <a-tab-pane key="headers" tab="Headers">
                  <AppJsonCodeBlock :value="responseHeadersText" empty-text="Không có headers" />
                </a-tab-pane>
              </a-tabs>
            </template>
          </a-space>
        </a-card>

        <a-card class="settings-card" title="Lịch sử gần đây">
          <a-list size="small" :data-source="requestRuns">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <a-space>
                      <a-tag :color="item.status === 'PASSED' ? 'green' : 'red'">{{ item.status }}</a-tag>
                      <span>{{ item.httpStatus ?? 'No status' }}</span>
                      <span>{{ item.durationMs ?? 0 }}ms</span>
                    </a-space>
                  </template>
                  <template #description>
                    <span>{{ new Date(item.createdAt).toLocaleString('vi-VN') }}</span>
                    <a-tag v-if="item.responseBodySaved" color="blue">Đã lưu body</a-tag>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </div>
    </section>
  </a-spin>

  <a-drawer v-model:open="curlDrawerOpen" title="Import cURL" width="720">
    <a-form layout="vertical" @finish="applyCurlImport">
      <a-form-item label="cURL">
        <a-textarea v-model:value="curlInput" :rows="12" placeholder="curl -X POST ..." />
      </a-form-item>
      <a-button type="primary" html-type="submit">
        <template #icon><ImportOutlined /></template>
        Import vào request
      </a-button>
    </a-form>
  </a-drawer>
</template>
