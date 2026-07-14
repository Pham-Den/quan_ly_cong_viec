import { api } from '../../../services/api'

export type ApiEnvironmentVariant = {
  id?: string
  name: string
  value: string
  enabled?: boolean
  hasValue?: boolean
  sortOrder?: number
}

export type ApiEnvironmentVariable = {
  id?: string
  key: string
  secret: boolean
  description?: string | null
  sortOrder?: number
  variants: ApiEnvironmentVariant[]
}

export type ApiEnvironment = {
  id: string
  projectId: string
  name: string
  environmentType: string
  baseUrl: string | null
  description: string | null
  enabled: boolean
  sortOrder: number
  variables: ApiEnvironmentVariable[]
}

export type ApiRequest = {
  id: string
  projectId: string
  taskId: string | null
  collectionName: string
  name: string
  description: string | null
  method: string
  url: string
  queryJson: string
  headersJson: string
  bodyType: string
  bodyText: string | null
  authJson: string
  timeoutMs: number
  storeResponseBody: boolean
  sortOrder: number
  task?: {
    id: string
    code: string
    title: string
  } | null
  _count?: {
    flowSteps: number
    requestRuns: number
  }
}

export type ApiRequestPayload = {
  projectId: string
  taskId?: string | null
  collectionName: string
  name: string
  description?: string
  method: string
  url: string
  query: Array<{ key: string; value: string; enabled?: boolean }>
  headers: Array<{ key: string; value: string; enabled?: boolean }>
  bodyType: string
  bodyText?: string
  auth: Record<string, unknown>
  timeoutMs: number
  storeResponseBody: boolean
  sortOrder?: number
}

export type ApiRunResult = {
  run: ApiRequestRun
  response: {
    httpStatus: number | null
    durationMs: number
    headers: Record<string, string>
    bodyPreview: string
    originalSize: number
    truncated: boolean
    savedResponseId: string | null
  } | null
}

export type ApiRequestRun = {
  id: string
  requestId: string
  status: string
  httpStatus: number | null
  durationMs: number | null
  errorMessage: string | null
  responseBodySaved: boolean
  startedAt: string
  finishedAt: string | null
  createdAt: string
  savedResponse?: {
    id: string
    statusCode: number | null
    originalSize: number | null
    truncated: boolean
    contentType: string | null
    createdAt: string
  } | null
}

export type CurlImportDraft = {
  method: string
  url: string
  query: Array<{ key: string; value: string }>
  headers: Array<{ key: string; value: string }>
  bodyType: string
  bodyText: string | null
}

export async function loadApiEnvironments(projectId: string) {
  const { data } = await api.get<ApiEnvironment[]>(`/api/api-lab/environments?projectId=${projectId}`)

  return data
}

export async function saveApiEnvironment(payload: {
  id?: string
  projectId: string
  name: string
  environmentType: string
  baseUrl: string
  description?: string
  enabled: boolean
  variables: ApiEnvironmentVariable[]
}) {
  const body = {
    projectId: payload.projectId,
    name: payload.name,
    environmentType: payload.environmentType,
    baseUrl: payload.baseUrl,
    description: payload.description,
    enabled: payload.enabled,
    variables: payload.variables,
  }

  if (payload.id) {
    const { data } = await api.patch<ApiEnvironment>(`/api/api-lab/environments/${payload.id}`, body)

    return data
  }

  const { data } = await api.post<ApiEnvironment>('/api/api-lab/environments', body)

  return data
}

export async function loadApiRequests(projectId: string) {
  const { data } = await api.get<ApiRequest[]>(`/api/api-lab/requests?projectId=${projectId}`)

  return data
}

export async function saveApiRequest(payload: ApiRequestPayload & { id?: string }) {
  if (payload.id) {
    const { data } = await api.patch<ApiRequest>(`/api/api-lab/requests/${payload.id}`, payload)

    return data
  }

  const { data } = await api.post<ApiRequest>('/api/api-lab/requests', payload)

  return data
}

export async function deleteApiRequest(requestId: string) {
  await api.delete(`/api/api-lab/requests/${requestId}`)
}

export async function runApiRequest(
  requestId: string,
  payload: {
    environmentId?: string | null
    variableVariants?: Record<string, string>
    runtimeVariables?: Record<string, string>
    saveResponseBody?: boolean
    timeoutMs?: number
  },
) {
  const { data } = await api.post<ApiRunResult>(`/api/api-lab/requests/${requestId}/run`, payload)

  return data
}

export async function loadApiRequestRuns(requestId: string) {
  const { data } = await api.get<ApiRequestRun[]>(`/api/api-lab/requests/${requestId}/runs`)

  return data
}

export async function saveApiRunResponse(
  runId: string,
  payload: {
    statusCode: number | null
    headers: Record<string, string>
    bodyText: string
    contentType?: string | null
    originalSize: number
    truncated: boolean
  },
) {
  const { data } = await api.post(`/api/api-lab/request-runs/${runId}/save-response`, payload)

  return data
}

export async function importCurl(curl: string) {
  const { data } = await api.post<CurlImportDraft>('/api/api-lab/import-curl', { curl })

  return data
}
