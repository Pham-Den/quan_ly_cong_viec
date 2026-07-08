import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'

export const ACCESS_TOKEN_KEY = 'qlcv.accessToken'
export const REFRESH_TOKEN_KEY = 'qlcv.refreshToken'

type ApiSessionUser = {
  id: string
  email: string
  name: string
}

type ApiShellProject = {
  id: string
  code: string
  name: string
  defaultRepoId: string | null
}

export type ApiSessionResponse = {
  user: ApiSessionUser
  projects: ApiShellProject[]
  accessToken: string
  refreshToken: string
}

type AuthLifecycleHandlers = {
  onSessionRefreshed?: (session: ApiSessionResponse) => void | Promise<void>
  onSessionExpired?: () => void | Promise<void>
}

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  authRetry?: boolean
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'
const authHandlers: AuthLifecycleHandlers = {}
let refreshInFlight: Promise<ApiSessionResponse> | null = null

export const api = axios.create({
  baseURL: apiBaseUrl,
})

const rawApi = axios.create({
  baseURL: apiBaseUrl,
})

export function configureAuthLifecycle(handlers: AuthLifecycleHandlers) {
  authHandlers.onSessionRefreshed = handlers.onSessionRefreshed
  authHandlers.onSessionExpired = handlers.onSessionExpired
}

function writeStoredValue(key: string, value: string | null) {
  if (value) {
    localStorage.setItem(key, value)
  } else {
    localStorage.removeItem(key)
  }
}

function backendMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return ''
  }

  const data = error.response?.data

  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
    return data.message
  }

  return ''
}

function isAuthSetupOrLoginRequest(url = '') {
  return ['/api/auth/bootstrap', '/api/auth/login', '/api/auth/setup', '/api/auth/logout'].some((path) =>
    url.includes(path),
  )
}

function isRefreshRequest(url = '') {
  return url.includes('/api/auth/refresh')
}

function hasAuthFailure(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401
}

function hasExpiredSessionMessage(error: unknown) {
  const message = backendMessage(error).toLowerCase()

  return message.includes('phien dang nhap da het han') || message.includes('phiên đăng nhập đã hết hạn')
}

async function notifySessionExpired() {
  await authHandlers.onSessionExpired?.()
}

async function refreshStoredSession() {
  if (!refreshInFlight) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (!refreshToken) {
      throw new Error('Missing refresh token')
    }

    refreshInFlight = rawApi
      .post<ApiSessionResponse>('/api/auth/refresh', { refreshToken })
      .then(async ({ data }) => {
        writeStoredValue(ACCESS_TOKEN_KEY, data.accessToken)
        writeStoredValue(REFRESH_TOKEN_KEY, data.refreshToken)
        await authHandlers.onSessionRefreshed?.(data)

        return data
      })
      .finally(() => {
        refreshInFlight = null
      })
  }

  return refreshInFlight
}

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)

  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers)

    headers.set('Authorization', `Bearer ${accessToken}`)
    config.headers = headers
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!hasAuthFailure(error) || !axios.isAxiosError(error)) {
      throw error
    }

    const requestConfig = error.config as RetriableRequestConfig | undefined
    const requestUrl = requestConfig?.url ?? ''

    if (isAuthSetupOrLoginRequest(requestUrl)) {
      throw error
    }

    if (isRefreshRequest(requestUrl)) {
      await notifySessionExpired()
      throw error
    }

    if (requestConfig && !requestConfig.authRetry && localStorage.getItem(REFRESH_TOKEN_KEY)) {
      requestConfig.authRetry = true

      try {
        const session = await refreshStoredSession()
        const headers = AxiosHeaders.from(requestConfig.headers)

        headers.set('Authorization', `Bearer ${session.accessToken}`)
        requestConfig.headers = headers

        return api.request(requestConfig)
      } catch {
        await notifySessionExpired()
        throw error
      }
    }

    if (hasExpiredSessionMessage(error) || localStorage.getItem(ACCESS_TOKEN_KEY)) {
      await notifySessionExpired()
    }

    throw error
  },
)
