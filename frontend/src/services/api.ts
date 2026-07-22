import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'

import { recordResponseCorrelation, requestId } from '../core/api'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: API-017–020, DS-COMP-012 | Pack: v1.7.21-oidc-session-error-contracts
const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
export const apiBaseUrl = runtimeEnv?.VITE_API_BASE_URL ?? 'http://localhost:4000'

export type ApiSessionResponse = {
  actor: { id: string; displayName: string; email?: string }
  expiresAt: string
  lastActivityAt: string
  idleExpiresAt: string
  csrfToken: string
}

export type OidcCallbackResponse = { returnTo: string }
export type OidcLoginResponse = { authorizationUrl: string }

type AuthLifecycleHandlers = {
  onSessionRefreshed?: (session: ApiSessionResponse) => void | Promise<void>
  onSessionExpired?: () => void | Promise<void>
  onRestartRequired?: (retryAfterSeconds: number) => void | Promise<void>
  onCallbackRetryRequired?: (retryAfterSeconds: number, callbackUrl: string) => void | Promise<void>
  onCallbackRecoveryInvalid?: () => void | Promise<void>
}

const authHandlers: AuthLifecycleHandlers = {}
let csrfToken = ''

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

export function configureAuthLifecycle(handlers: AuthLifecycleHandlers) {
  authHandlers.onSessionRefreshed = handlers.onSessionRefreshed
  authHandlers.onSessionExpired = handlers.onSessionExpired
  authHandlers.onRestartRequired = handlers.onRestartRequired
  authHandlers.onCallbackRetryRequired = handlers.onCallbackRetryRequired
  authHandlers.onCallbackRecoveryInvalid = handlers.onCallbackRecoveryInvalid
}

export function bindCsrfToken(value: string | null) {
  csrfToken = value ?? ''
}

export async function beginOidcLogin(returnTo: string) {
  const authorizationUrl = await requestOidcLogin(returnTo)
  window.location.assign(authorizationUrl)
}

export async function requestOidcLogin(returnTo: string): Promise<string> {
  const response = await api.post<OidcLoginResponse>('/api/v1/auth/login', {
    returnTo: isSafeReturnTo(returnTo) ? returnTo : '/',
  })
  const authorizationUrl = asRecord(response.data).authorizationUrl
  if (typeof authorizationUrl !== 'string' || !isHttpUrl(authorizationUrl)) {
    throw new Error('Invalid API-017 authorization URL.')
  }
  return authorizationUrl
}

export function applyRequestSecurity(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const method = config.method?.toUpperCase() ?? 'GET'
  const headers = AxiosHeaders.from(config.headers)
  if (!headers.has('X-Request-ID')) headers.set('X-Request-ID', requestId())
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-CSRF-Token', csrfToken)
  }
  config.headers = headers
  return config
}

export type SessionFetchResult =
  | { status: 200; session: ApiSessionResponse; etag: string }
  | { status: 304; session: null; etag: string }

export function interpretSessionResponse(status: number, data: unknown, etagHeader: unknown): SessionFetchResult {
  const etag = typeof etagHeader === 'string' ? etagHeader : ''
  if (status === 304) return { status: 304, session: null, etag }
  if (status !== 200 || !data || typeof data !== 'object') throw new Error('Invalid API-020 response.')
  return { status: 200, session: data as ApiSessionResponse, etag }
}

export async function fetchApiSession(etag = ''): Promise<SessionFetchResult> {
  const response = await api.get<ApiSessionResponse>('/api/v1/auth/session', {
    headers: etag ? { 'If-None-Match': etag } : undefined,
    validateStatus: (status) => status === 200 || status === 304,
  })
  return interpretSessionResponse(response.status, response.data, response.headers.etag)
}

export async function completeOidcCallback(code: string, state: string): Promise<string> {
  return completeOidcCallbackRequest(code, state)
}

export async function retryOidcCallback(callbackUrl: string): Promise<string> {
  const target = new URL(callbackUrl, apiBaseUrl)
  if (target.origin !== new URL(apiBaseUrl).origin || target.pathname !== '/api/v1/auth/callback') {
    throw new Error('Invalid API-018 retry target.')
  }
  const code = target.searchParams.get('code') ?? ''
  const state = target.searchParams.get('state') ?? ''
  if (!code || !state) throw new Error('Invalid API-018 retry target.')
  return completeOidcCallbackRequest(code, state)
}

async function completeOidcCallbackRequest(code: string, state: string): Promise<string> {
  const response = await api.post<OidcCallbackResponse>('/api/v1/auth/callback', { code, state })
  const returnTo = asRecord(response.data).returnTo
  if (typeof returnTo !== 'string' || !isSafeReturnTo(returnTo)) throw new Error('Invalid API-018 return path.')
  return returnTo
}

export async function handleAuthFailureResponse(response: { status: number; headers?: unknown; data?: unknown; config?: unknown }): Promise<boolean> {
  if (response.status === 401) {
    bindCsrfToken(null)
    await authHandlers.onSessionExpired?.()
    return true
  }
  const envelope = asRecord(asRecord(response.data).error)
  const details = asRecord(envelope.details)
  if (response.status !== 503) return false
  const rawHeaders = asRecord(response.headers)
  const headerSeconds = positiveInteger(rawHeaders['retry-after'] ?? rawHeaders['Retry-After'])
  const bodySeconds = positiveInteger(details.retry_after_seconds)
  const callbackUrl = callbackPath(response)
  const recoveryAction = details.recovery_action
  const validRecoveryAction = recoveryAction === undefined || recoveryAction === 'RESTART_LOGIN'
  if (!headerSeconds || headerSeconds !== bodySeconds || !validRecoveryAction) {
    if (!callbackUrl) return false
    bindCsrfToken(null)
    await authHandlers.onCallbackRecoveryInvalid?.()
    return true
  }
  if (details.recovery_action === 'RESTART_LOGIN') {
    if (!callbackUrl) return false
    bindCsrfToken(null)
    await authHandlers.onRestartRequired?.(headerSeconds)
    return true
  }
  if (!callbackUrl || details.recovery_action !== undefined) return false
  bindCsrfToken(null)
  await authHandlers.onCallbackRetryRequired?.(headerSeconds, callbackUrl)
  return true
}

api.interceptors.request.use(applyRequestSecurity)

api.interceptors.response.use(
  (response) => {
    recordResponseCorrelation(response.headers as Record<string, unknown>)
    return response
  },
  async (error) => {
    if (axios.isAxiosError(error) && error.response) await handleAuthFailureResponse(error.response)
    throw error
  },
)

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}
function positiveInteger(value: unknown): number {
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
  return typeof number === 'number' && Number.isInteger(number) && number >= 1 && number <= 86_400 ? number : 0
}

function callbackPath(response: { config?: unknown }): string {
  const config = asRecord(asRecord(response).config)
  if (typeof config.method !== 'string' || config.method.toUpperCase() !== 'POST') return ''
  const rawUrl = config.url
  if (typeof rawUrl !== 'string') return ''
  try {
    const url = new URL(rawUrl, apiBaseUrl)
    if (url.origin !== new URL(apiBaseUrl).origin || url.pathname !== '/api/v1/auth/callback') return ''
    const body = requestBody(config.data)
    const code = typeof body.code === 'string' ? body.code : ''
    const state = typeof body.state === 'string' ? body.state : ''
    if (!code || !state) return ''
    return `/api/v1/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
  } catch {
    return ''
  }
}

function requestBody(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') return asRecord(value)
  try { return asRecord(JSON.parse(value)) } catch { return {} }
}

function isHttpUrl(value: string): boolean {
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}

function isSafeReturnTo(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !value.includes('\u0000')
}
