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
  deleteApiFlow,
  deleteApiFlowStep,
  importCurl,
  loadApiFlowSteps,
  loadApiFlows,
  loadApiEnvironments,
  loadApiRequestRuns,
  loadApiRequests,
  runApiFlow,
  runApiRequest,
  saveApiEnvironment,
  saveApiFlow,
  saveApiFlowStep,
  saveApiRequest,
  saveApiRunResponse,
  type ApiFlow,
  type ApiFlowRunResult,
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

type CaptureRuleRow = {
  source: string
  path: string
  header: string
  as: string
  required: boolean
  secret: boolean
}

type FlowStepForm = {
  id: string
  requestId: string | null
  name: string
  sortOrder: number
  overrideMethod: string
  overrideUrl: string
  overrideBodyText: string
  continueOnFailure: boolean
  captureRules: CaptureRuleRow[]
}

type ResponseField = {
  stepId: string
  stepName: string
  path: string
  variableName: string
  value: string
}

const session = useSessionStore()
const loading = ref(false)
const savingEnvironment = ref(false)
const savingRequest = ref(false)
const runningRequest = ref(false)
const savingResponse = ref(false)
const savingFlow = ref(false)
const runningFlow = ref(false)
const savingStepId = ref<string | null>(null)
const curlDrawerOpen = ref(false)
const curlInput = ref('')
const activeLeftTab = ref('requests')
const environments = ref<ApiEnvironment[]>([])
const requests = ref<ApiRequest[]>([])
const flows = ref<ApiFlow[]>([])
const flowSteps = ref<FlowStepForm[]>([])
const tasks = ref<TaskOptionRecord[]>([])
const requestRuns = ref<ApiRequestRun[]>([])
const selectedEnvironmentId = ref<string | null>(null)
const selectedRequestId = ref<string | null>(null)
const selectedFlowId = ref<string | null>(null)
const currentResult = ref<ApiRunResult | null>(null)
const currentFlowResult = ref<ApiFlowRunResult | null>(null)
const runtimeVariablesText = ref('{}')
const runSaveResponseBody = ref(false)
const draggedStepIndex = ref<number | null>(null)
const draggedResponseField = ref<ResponseField | null>(null)
const selectedProjectId = computed(() => session.selectedProjectId)
const selectedRequest = computed(() => requests.value.find((request) => request.id === selectedRequestId.value) ?? null)
const selectedFlow = computed(() => flows.value.find((flow) => flow.id === selectedFlowId.value) ?? null)
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
const flowList = computed(() =>
  [...flows.value].sort((left, right) =>
    `${left.collectionName}-${left.sortOrder}-${left.name}`.localeCompare(`${right.collectionName}-${right.sortOrder}-${right.name}`),
  ),
)
const requestOptions = computed(() =>
  requestList.value.map((request) => ({
    label: `${request.method} ${request.name}`,
    value: request.id,
  })),
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
const flowStatusColor = computed(() => {
  const status = currentFlowResult.value?.flowRun.status

  if (status === 'PASSED') {
    return 'green'
  }

  if (status === 'FAILED') {
    return 'red'
  }

  return 'default'
})
const flowResponseFields = computed(() => {
  const fields: ResponseField[] = []

  for (const step of currentFlowResult.value?.steps ?? []) {
    const body = step.response?.bodyPreview

    if (!body) {
      continue
    }

    for (const field of collectJsonFields(body)) {
      fields.push({
        stepId: step.step.id,
        stepName: step.step.name,
        ...field,
      })
    }
  }

  return fields
})

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
const flowForm = reactive({
  id: '',
  collectionName: 'Mac dinh',
  name: '',
  taskId: null as string | null,
  enabled: true,
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
const captureSourceOptions = [
  { label: 'JSON path', value: 'JSON' },
  { label: 'Header', value: 'HEADER' },
  { label: 'Status code', value: 'STATUS' },
  { label: 'Raw text', value: 'TEXT' },
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

function collectJsonFields(value: string) {
  try {
    const parsed = JSON.parse(value)
    const fields: Array<{ path: string; variableName: string; value: string }> = []
    const walk = (entry: unknown, path: string) => {
      if (entry && typeof entry === 'object') {
        if (Array.isArray(entry)) {
          entry.forEach((item, index) => walk(item, `${path}[${index}]`))
          return
        }

        Object.entries(entry as Record<string, unknown>).forEach(([key, item]) => {
          walk(item, path === '$' ? `$.${key}` : `${path}.${key}`)
        })
        return
      }

      const lastPathPart = path.split('.').pop()?.replace(/\W+/g, '') || 'value'

      fields.push({
        path,
        variableName: lastPathPart,
        value: entry == null ? '' : String(entry),
      })
    }

    walk(parsed, '$')

    return fields.slice(0, 24)
  } catch {
    return []
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

function resetFlowForm() {
  flowForm.id = ''
  flowForm.collectionName = selectedFlow.value?.collectionName ?? 'Mac dinh'
  flowForm.name = ''
  flowForm.taskId = null
  flowForm.enabled = true
  flowForm.storeResponseBody = false
  selectedFlowId.value = null
  flowSteps.value = []
  currentFlowResult.value = null
}

function setFlowForm(flow: ApiFlow) {
  flowForm.id = flow.id
  flowForm.collectionName = flow.collectionName
  flowForm.name = flow.name
  flowForm.taskId = flow.taskId
  flowForm.enabled = flow.enabled
  flowForm.storeResponseBody = flow.storeResponseBody
}

function captureRulesFromJson(value: string): CaptureRuleRow[] {
  return parseJsonArray(value).map((row) => ({
    source: typeof row?.source === 'string' ? row.source.toUpperCase() : 'JSON',
    path: typeof row?.path === 'string' ? row.path : '',
    header: typeof row?.header === 'string' ? row.header : '',
    as: typeof row?.as === 'string' ? row.as : typeof row?.variableName === 'string' ? row.variableName : '',
    required: row?.required === true,
    secret: row?.secret === true,
  }))
}

function flowStepFromApi(step: {
  id: string
  requestId: string | null
  name: string
  sortOrder: number
  overrideJson: string
  captureRulesJson: string
  continueOnFailure: boolean
}): FlowStepForm {
  const override = parseJsonObject(step.overrideJson)

  return {
    id: step.id,
    requestId: step.requestId,
    name: step.name,
    sortOrder: step.sortOrder,
    overrideMethod: typeof override.method === 'string' ? override.method : '',
    overrideUrl: typeof override.url === 'string' ? override.url : '',
    overrideBodyText: typeof override.bodyText === 'string' ? override.bodyText : '',
    continueOnFailure: step.continueOnFailure,
    captureRules: captureRulesFromJson(step.captureRulesJson),
  }
}

function emptyFlowStep(): FlowStepForm {
  return {
    id: '',
    requestId: requestList.value[0]?.id ?? null,
    name: requestList.value[0]?.name ?? '',
    sortOrder: flowSteps.value.length,
    overrideMethod: '',
    overrideUrl: '',
    overrideBodyText: '',
    continueOnFailure: false,
    captureRules: [],
  }
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

function addCaptureRule(step: FlowStepForm, preset?: Partial<CaptureRuleRow>) {
  step.captureRules.push({
    source: preset?.source ?? 'JSON',
    path: preset?.path ?? '',
    header: preset?.header ?? '',
    as: preset?.as ?? '',
    required: preset?.required ?? false,
    secret: preset?.secret ?? false,
  })
}

function removeCaptureRule(step: FlowStepForm, index: number) {
  step.captureRules.splice(index, 1)
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
    flows.value = []
    tasks.value = []
    resetEnvironmentForm()
    resetRequestForm()
    resetFlowForm()
    return
  }

  loading.value = true

  try {
    const [environmentData, requestData, flowData] = await Promise.all([
      loadApiEnvironments(selectedProjectId.value),
      loadApiRequests(selectedProjectId.value),
      loadApiFlows(selectedProjectId.value),
    ])
    await loadTasks()

    environments.value = environmentData
    requests.value = requestData
    flows.value = flowData

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

    if (selectedFlowId.value) {
      const selected = flowData.find((flow) => flow.id === selectedFlowId.value)

      if (selected) {
        setFlowForm(selected)
        await loadFlowSteps(selected.id)
      }
    } else if (flowData[0]) {
      selectedFlowId.value = flowData[0].id
      setFlowForm(flowData[0])
      await loadFlowSteps(flowData[0].id)
    }
  } finally {
    loading.value = false
  }
}

async function loadRuns(requestId: string) {
  requestRuns.value = await loadApiRequestRuns(requestId)
}

async function loadFlowSteps(flowId: string) {
  flowSteps.value = (await loadApiFlowSteps(flowId)).map(flowStepFromApi)
}

function selectRequest(request: ApiRequest) {
  activeLeftTab.value = 'requests'
  selectedRequestId.value = request.id
  setRequestForm(request)
  currentResult.value = null
  void loadRuns(request.id)
}

function newRequest() {
  activeLeftTab.value = 'requests'
  resetRequestForm()
  requestForm.collectionName = selectedRequest.value?.collectionName ?? 'Mac dinh'
}

function selectFlow(flow: ApiFlow) {
  activeLeftTab.value = 'flows'
  selectedFlowId.value = flow.id
  setFlowForm(flow)
  currentFlowResult.value = null
  void loadFlowSteps(flow.id)
}

function newFlow() {
  activeLeftTab.value = 'flows'
  resetFlowForm()
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

async function submitFlow() {
  if (!selectedProjectId.value || !flowForm.name.trim()) {
    message.warning('Cần nhập tên flow.')
    return
  }

  savingFlow.value = true

  try {
    const saved = await saveApiFlow({
      id: flowForm.id || undefined,
      projectId: selectedProjectId.value,
      taskId: flowForm.taskId,
      collectionName: flowForm.collectionName,
      name: flowForm.name,
      enabled: flowForm.enabled,
      storeResponseBody: flowForm.storeResponseBody,
    })

    selectedFlowId.value = saved.id
    setFlowForm(saved)
    message.success('Đã lưu flow.')
    await refreshApiLab()
  } finally {
    savingFlow.value = false
  }
}

async function removeFlow() {
  if (!flowForm.id) {
    return
  }

  await deleteApiFlow(flowForm.id)
  message.success('Đã xóa flow.')
  resetFlowForm()
  await refreshApiLab()
}

async function ensureFlowSaved() {
  if (!flowForm.id) {
    await submitFlow()
  }

  return Boolean(flowForm.id)
}

async function addFlowStep() {
  if (!(await ensureFlowSaved())) {
    return
  }

  flowSteps.value.push(emptyFlowStep())
}

function flowStepOverridePayload(step: FlowStepForm) {
  const override: Record<string, unknown> = {}

  if (step.overrideMethod) {
    override.method = step.overrideMethod
  }

  if (step.overrideUrl.trim()) {
    override.url = step.overrideUrl.trim()
  }

  if (step.overrideBodyText.trim()) {
    override.bodyText = step.overrideBodyText
    override.bodyType = /^[\[{]/.test(step.overrideBodyText.trim()) ? 'JSON' : 'TEXT'
  }

  return override
}

async function saveFlowStepRow(step: FlowStepForm) {
  if (!(await ensureFlowSaved())) {
    return
  }

  if (!step.name.trim() && step.requestId) {
    step.name = requests.value.find((request) => request.id === step.requestId)?.name ?? ''
  }

  if (!step.name.trim()) {
    message.warning('Cần nhập tên step.')
    return
  }

  savingStepId.value = step.id || `draft-${step.sortOrder}`

  try {
    const saved = await saveApiFlowStep({
      id: step.id || undefined,
      flowId: flowForm.id,
      requestId: step.requestId,
      name: step.name,
      sortOrder: step.sortOrder,
      override: flowStepOverridePayload(step),
      captureRules: step.captureRules
        .filter((rule) => rule.as.trim())
        .map((rule) => ({
          source: rule.source,
          path: rule.path,
          header: rule.header,
          as: rule.as.trim(),
          required: rule.required,
          secret: rule.secret,
        })),
      continueOnFailure: step.continueOnFailure,
    })

    const index = flowSteps.value.indexOf(step)
    flowSteps.value.splice(index, 1, flowStepFromApi(saved))
    message.success('Đã lưu step.')
    await refreshApiLab()
  } finally {
    savingStepId.value = null
  }
}

async function removeFlowStep(step: FlowStepForm, index: number) {
  if (step.id) {
    await deleteApiFlowStep(step.id)
  }

  flowSteps.value.splice(index, 1)
  flowSteps.value.forEach((item, itemIndex) => {
    item.sortOrder = itemIndex
  })
  message.success('Đã xóa step.')
}

function startStepDrag(index: number) {
  draggedStepIndex.value = index
}

async function dropStep(targetIndex: number) {
  if (draggedStepIndex.value === null || draggedStepIndex.value === targetIndex) {
    draggedStepIndex.value = null
    return
  }

  const [moved] = flowSteps.value.splice(draggedStepIndex.value, 1)

  if (!moved) {
    draggedStepIndex.value = null
    return
  }

  flowSteps.value.splice(targetIndex, 0, moved)
  flowSteps.value.forEach((step, index) => {
    step.sortOrder = index
  })
  draggedStepIndex.value = null

  for (const step of flowSteps.value.filter((item) => item.id)) {
    await saveApiFlowStep({
      id: step.id,
      flowId: flowForm.id,
      requestId: step.requestId,
      name: step.name,
      sortOrder: step.sortOrder,
      override: flowStepOverridePayload(step),
      captureRules: step.captureRules,
      continueOnFailure: step.continueOnFailure,
    })
  }

  message.success('Đã đổi thứ tự step.')
}

function startResponseFieldDrag(field: ResponseField) {
  draggedResponseField.value = field
}

function dropResponseField(targetStep: FlowStepForm, target: 'url' | 'body') {
  const field = draggedResponseField.value

  if (!field) {
    return
  }

  const token = `{{${field.variableName}}}`

  if (target === 'url') {
    targetStep.overrideUrl = `${targetStep.overrideUrl}${token}`
  } else {
    targetStep.overrideBodyText = `${targetStep.overrideBodyText}${token}`
  }

  const sourceStep = flowSteps.value.find((step) => step.id === field.stepId)

  if (sourceStep && !sourceStep.captureRules.some((rule) => rule.as === field.variableName)) {
    addCaptureRule(sourceStep, {
      source: 'JSON',
      path: field.path,
      as: field.variableName,
      required: true,
    })
  }

  draggedResponseField.value = null
  message.success('Đã thêm mapping vào flow draft.')
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

async function runCurrentFlow() {
  if (!flowForm.id) {
    await submitFlow()
  }

  if (!flowForm.id) {
    return
  }

  const runtime = runtimeVariables()

  if (!runtime) {
    return
  }

  runningFlow.value = true

  try {
    currentFlowResult.value = await runApiFlow(flowForm.id, {
      environmentId: selectedEnvironmentId.value,
      runtimeVariables: runtime,
      saveResponseBody: runSaveResponseBody.value,
    })

    if (currentFlowResult.value.flowRun.status === 'PASSED') {
      message.success('Flow chạy thành công.')
    } else {
      message.warning(currentFlowResult.value.flowRun.errorMessage || 'Flow chạy lỗi.')
    }
  } finally {
    runningFlow.value = false
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
      <a-button @click="newFlow">
        <template #icon><PlusOutlined /></template>
        Flow
      </a-button>
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
            <a-button class="api-lab-full-button" @click="newFlow">
              <template #icon><PlusOutlined /></template>
              Flow mới
            </a-button>
            <a-list class="api-lab-request-list" size="small" :data-source="flowList">
              <template #renderItem="{ item }">
                <a-list-item
                  class="api-lab-request-item"
                  :class="{ 'api-lab-request-item-active': item.id === selectedFlowId }"
                  @click="selectFlow(item)"
                >
                  <a-list-item-meta>
                    <template #title>
                      <a-space>
                        <a-tag color="purple">FLOW</a-tag>
                        <span>{{ item.name }}</span>
                      </a-space>
                    </template>
                    <template #description>
                      <span>{{ item.collectionName }}</span>
                      <span v-if="item.task"> · {{ item.task.code }}</span>
                      <span> · {{ item._count?.steps ?? 0 }} step</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-tab-pane>
        </a-tabs>
      </a-card>

      <a-card v-if="activeLeftTab === 'requests'" class="settings-card api-lab-editor-card" title="Request editor">
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

      <a-card v-else class="settings-card api-lab-editor-card" title="Flow editor">
        <a-form layout="vertical" :model="flowForm" @finish="submitFlow">
          <div class="form-grid">
            <a-form-item label="Collection">
              <a-input v-model:value="flowForm.collectionName" />
            </a-form-item>
            <a-form-item label="Link task">
              <a-select
                v-model:value="flowForm.taskId"
                allow-clear
                show-search
                :options="taskOptions"
                placeholder="Không bắt buộc"
              />
            </a-form-item>
            <a-form-item label="Tên flow" required>
              <a-input v-model:value="flowForm.name" placeholder="Login -> tạo dữ liệu -> kiểm tra kết quả" />
            </a-form-item>
          </div>

          <a-space class="form-actions" wrap>
            <a-checkbox v-model:checked="flowForm.enabled">Bật flow</a-checkbox>
            <a-checkbox v-model:checked="flowForm.storeResponseBody">Luôn lưu response body</a-checkbox>
          </a-space>

          <a-space class="form-actions" wrap>
            <a-button type="primary" html-type="submit" :loading="savingFlow">
              <template #icon><SaveOutlined /></template>
              Lưu flow
            </a-button>
            <a-button @click="addFlowStep">
              <template #icon><PlusOutlined /></template>
              Thêm step
            </a-button>
            <a-popconfirm v-if="flowForm.id" title="Xóa flow này?" @confirm="removeFlow">
              <a-button danger>
                <template #icon><DeleteOutlined /></template>
                Xóa flow
              </a-button>
            </a-popconfirm>
          </a-space>
        </a-form>

        <a-empty v-if="!flowSteps.length" description="Chưa có step trong flow." />
        <div v-else class="api-lab-flow-steps">
          <div
            v-for="(step, index) in flowSteps"
            :key="step.id || `draft-${index}`"
            class="api-lab-flow-step"
            draggable="true"
            @dragstart="startStepDrag(index)"
            @dragover.prevent
            @drop="dropStep(index)"
          >
            <div class="api-lab-flow-step-head">
              <a-tag color="blue">{{ index + 1 }}</a-tag>
              <a-input v-model:value="step.name" placeholder="Tên step" />
              <a-select
                v-model:value="step.requestId"
                allow-clear
                show-search
                :options="requestOptions"
                placeholder="Chọn request hoặc dùng inline URL"
              />
              <a-checkbox v-model:checked="step.continueOnFailure">Tiếp tục khi lỗi</a-checkbox>
            </div>

            <a-tabs size="small">
              <a-tab-pane key="override" tab="Override">
                <div class="api-lab-flow-override">
                  <a-select
                    v-model:value="step.overrideMethod"
                    allow-clear
                    :options="methodOptions"
                    placeholder="Giữ method request"
                  />
                  <a-input
                    v-model:value="step.overrideUrl"
                    class="api-lab-drop-target"
                    placeholder="Override URL hoặc inline URL"
                    @dragover.prevent
                    @drop="dropResponseField(step, 'url')"
                  />
                </div>
                <a-textarea
                  v-model:value="step.overrideBodyText"
                  class="api-lab-drop-target"
                  :rows="4"
                  placeholder="Override body, có thể dùng {{capturedValue}}"
                  @dragover.prevent
                  @drop="dropResponseField(step, 'body')"
                />
              </a-tab-pane>
              <a-tab-pane key="captures" tab="Captures">
                <div class="api-lab-capture-list">
                  <div v-for="(rule, ruleIndex) in step.captureRules" :key="ruleIndex" class="api-lab-capture-row">
                    <a-select v-model:value="rule.source" :options="captureSourceOptions" />
                    <a-input v-model:value="rule.as" placeholder="Tên biến" />
                    <a-input
                      v-if="rule.source === 'HEADER'"
                      v-model:value="rule.header"
                      placeholder="Header name"
                    />
                    <a-input
                      v-else-if="rule.source !== 'STATUS'"
                      v-model:value="rule.path"
                      placeholder="$.data.id"
                    />
                    <span v-else class="api-lab-muted">HTTP status</span>
                    <a-checkbox v-model:checked="rule.required">Bắt buộc</a-checkbox>
                    <a-checkbox v-model:checked="rule.secret">Secret</a-checkbox>
                    <a-button danger @click="removeCaptureRule(step, ruleIndex)">
                      <template #icon><DeleteOutlined /></template>
                    </a-button>
                  </div>
                  <a-button @click="addCaptureRule(step)">
                    <template #icon><PlusOutlined /></template>
                    Thêm capture
                  </a-button>
                </div>
              </a-tab-pane>
            </a-tabs>

            <a-space class="form-actions">
              <a-button
                type="primary"
                :loading="savingStepId === (step.id || `draft-${step.sortOrder}`)"
                @click="saveFlowStepRow(step)"
              >
                <template #icon><SaveOutlined /></template>
                Lưu step
              </a-button>
              <a-popconfirm title="Xóa step này?" @confirm="removeFlowStep(step, index)">
                <a-button danger>
                  <template #icon><DeleteOutlined /></template>
                  Xóa step
                </a-button>
              </a-popconfirm>
            </a-space>
          </div>
        </div>
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

        <a-card v-if="activeLeftTab === 'requests'" class="settings-card" title="Run và response">
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

        <a-card v-else class="settings-card" title="Chạy flow">
          <a-space direction="vertical" class="api-lab-run-panel">
            <a-checkbox v-model:checked="runSaveResponseBody">Lưu response body cho lần chạy này</a-checkbox>
            <a-form-item label="Runtime variables JSON">
              <a-textarea v-model:value="runtimeVariablesText" :rows="3" />
            </a-form-item>
            <a-button type="primary" :loading="runningFlow" :disabled="!flowForm.id || !flowSteps.length" @click="runCurrentFlow">
              <template #icon><SendOutlined /></template>
              Chạy flow
            </a-button>

            <a-empty v-if="!currentFlowResult" description="Chưa có kết quả flow." />
            <template v-else>
              <a-space wrap>
                <a-tag :color="flowStatusColor">{{ currentFlowResult.flowRun.status }}</a-tag>
                <a-tag>{{ currentFlowResult.flowRun.durationMs ?? 0 }}ms</a-tag>
              </a-space>
              <a-alert
                v-if="currentFlowResult.flowRun.errorMessage"
                type="error"
                show-icon
                :message="currentFlowResult.flowRun.errorMessage"
              />

              <div v-if="flowResponseFields.length" class="api-lab-response-fields">
                <a-tag
                  v-for="field in flowResponseFields"
                  :key="`${field.stepId}-${field.path}`"
                  class="api-lab-draggable-field"
                  draggable="true"
                  @dragstart="startResponseFieldDrag(field)"
                >
                  {{ field.stepName }} · {{ field.path }}
                </a-tag>
              </div>

              <div class="api-lab-flow-results">
                <div v-for="stepResult in currentFlowResult.steps" :key="stepResult.run.id" class="api-lab-result-step">
                  <a-space wrap>
                    <strong>{{ stepResult.step.sortOrder + 1 }}. {{ stepResult.step.name }}</strong>
                    <a-tag :color="stepResult.run.status === 'PASSED' ? 'green' : stepResult.run.status === 'SKIPPED' ? 'default' : 'red'">
                      {{ stepResult.run.status }}
                    </a-tag>
                    <a-tag>{{ stepResult.run.httpStatus ?? 'No status' }}</a-tag>
                    <a-tag>{{ stepResult.run.durationMs ?? 0 }}ms</a-tag>
                  </a-space>
                  <a-alert v-if="stepResult.run.errorMessage" type="warning" show-icon :message="stepResult.run.errorMessage" />
                  <AppJsonCodeBlock :value="JSON.stringify(stepResult.capturedVariables, null, 2)" empty-text="Không có capture" />
                  <a-tabs v-if="stepResult.response" size="small">
                    <a-tab-pane key="body" tab="Body">
                      <AppJsonCodeBlock :value="stepResult.response.bodyPreview" empty-text="Không có body" />
                    </a-tab-pane>
                    <a-tab-pane key="headers" tab="Headers">
                      <AppJsonCodeBlock :value="JSON.stringify(stepResult.response.headers, null, 2)" empty-text="Không có headers" />
                    </a-tab-pane>
                  </a-tabs>
                </div>
              </div>
            </template>
          </a-space>
        </a-card>

        <a-card v-if="activeLeftTab === 'requests'" class="settings-card" title="Lịch sử gần đây">
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
    <a-form layout="vertical">
      <a-form-item label="cURL">
        <a-textarea v-model:value="curlInput" :rows="12" placeholder="curl -X POST ..." />
      </a-form-item>
      <a-button type="primary" @click="applyCurlImport">
        <template #icon><ImportOutlined /></template>
        Import vào request
      </a-button>
    </a-form>
  </a-drawer>
</template>
