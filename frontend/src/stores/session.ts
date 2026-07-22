import axios from 'axios'
import { defineStore } from 'pinia'

import { api, beginOidcLogin, bindCsrfToken, fetchApiSession, retryOidcCallback, type ApiSessionResponse } from '../services/api'
import {
  createCallbackRecovery,
  runCallbackRecovery,
  tickCallbackRecovery,
  type CallbackRecoveryState,
} from '../core/auth/callback-recovery'
import { AUTH_MESSAGES } from '../core/auth/auth-messages'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: API-020, DS-COMP-012, PR-001 | Pack: v1.7.21-oidc-session-error-contracts

export type SessionUser = { id: string; email: string; name: string }
export type ShellProject = { id: string; code: string; name: string; defaultRepoId: string | null }

const SELECTED_PROJECT_KEY = 'qlcv.selectedProjectId'
let restorePromise: Promise<void> | null = null
type SessionScheduler = {
  setInterval: (handler: () => void, milliseconds: number) => ReturnType<typeof setInterval>
  clearInterval: (handle: ReturnType<typeof setInterval>) => void
}
const nativeScheduler: SessionScheduler = {
  setInterval: (handler, milliseconds) => setInterval(handler, milliseconds),
  clearInterval: (handle) => clearInterval(handle),
}
let sessionScheduler = nativeScheduler

export function configureSessionScheduler(scheduler?: SessionScheduler) {
  sessionScheduler = scheduler ?? nativeScheduler
}

function readSelectedProject() { return localStorage.getItem(SELECTED_PROJECT_KEY) }
function chooseProjectId(projects: ShellProject[], current: string | null) {
  return current && projects.some((project) => project.id === current) ? current : projects[0]?.id ?? null
}
function expectedAuthFailure(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401
}
function errorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback
  const data = error.response?.data
  if (data && typeof data === 'object' && 'error' in data) {
    const envelope = data.error
    if (envelope && typeof envelope === 'object' && 'message' in envelope && typeof envelope.message === 'string') return envelope.message
  }
  return fallback
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    user: null as SessionUser | null,
    projects: [] as ShellProject[],
    // Compatibility fields remain null so pre-cutover shell code compiles; no bearer token is stored.
    accessToken: null as null,
    refreshToken: null as null,
    selectedProjectId: readSelectedProject(),
    setupRequired: false as boolean,
    loading: false,
    lastError: null as string | null,
    sessionEtag: '',
    restartAfterSeconds: null as number | null,
    restartTimer: null as ReturnType<typeof setInterval> | null,
    callbackRecovery: null as CallbackRecoveryState | null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    selectedProject: (state) => state.projects.find((project) => project.id === state.selectedProjectId) ?? null,
  },
  actions: {
    selectProject(projectId: string | null) {
      this.selectedProjectId = projectId
      if (projectId) localStorage.setItem(SELECTED_PROJECT_KEY, projectId)
      else localStorage.removeItem(SELECTED_PROJECT_KEY)
    },
    setSession(session: ApiSessionResponse, projects?: ShellProject[]) {
      const resolvedProjects = projects ?? this.projects
      this.user = {
        id: session.actor.id,
        email: session.actor.email ?? '',
        name: session.actor.displayName,
      }
      this.projects = resolvedProjects
      this.lastError = null
      bindCsrfToken(session.csrfToken)
      this.selectProject(chooseProjectId(resolvedProjects, this.selectedProjectId))
    },
    clearSession() {
      this.user = null
      this.projects = []
      bindCsrfToken(null)
      this.sessionEtag = ''
    },
    clearCallbackRecovery() {
      if (this.restartTimer) sessionScheduler.clearInterval(this.restartTimer)
      this.restartTimer = null
      this.restartAfterSeconds = null
      this.callbackRecovery = null
    },
    async restoreSession(force = false) {
      if (restorePromise && !force) return restorePromise
      restorePromise = this.restoreSessionOnce()
      try { await restorePromise } finally { restorePromise = null }
    },
    async restoreSessionOnce() {
      this.loading = true
      this.lastError = null
      try {
        const [sessionResult, { data: projects }] = await Promise.all([
          fetchApiSession(this.sessionEtag),
          api.get<ShellProject[]>('/api/projects'),
        ])
        this.sessionEtag = sessionResult.etag
        if (sessionResult.status === 200) this.setSession(sessionResult.session, projects)
        else this.projects = projects
      } catch (error) {
        if (expectedAuthFailure(error)) this.clearSession()
        else this.lastError = errorMessage(error, 'Không thể khôi phục phiên đăng nhập.')
      } finally {
        this.loading = false
      }
    },
    async fetchMe() {
      const [sessionResult, { data: projects }] = await Promise.all([
        fetchApiSession(this.sessionEtag),
        api.get<ShellProject[]>('/api/projects'),
      ])
      this.sessionEtag = sessionResult.etag
      if (sessionResult.status === 200) this.setSession(sessionResult.session, projects)
      else this.projects = projects
    },
    async login(returnTo = '/') {
      this.loading = true
      this.lastError = null
      try { await beginOidcLogin(returnTo) }
      catch (error) { this.lastError = errorMessage(error, AUTH_MESSAGES.navigationError) }
      finally { this.loading = false }
    },
    startRestartCountdown(seconds: number) {
      this.clearSession()
      this.clearCallbackRecovery()
      this.restartAfterSeconds = seconds
      this.callbackRecovery = createCallbackRecovery('POST_CLAIM', seconds)
      this.lastError = AUTH_MESSAGES.MSG_046
      this.restartTimer = sessionScheduler.setInterval(() => {
        if (!this.callbackRecovery) return
        this.callbackRecovery = tickCallbackRecovery(this.callbackRecovery)
        this.restartAfterSeconds = this.callbackRecovery.secondsRemaining
        if (this.callbackRecovery.phase !== 'WAITING') {
          this.restartAfterSeconds = 0
          if (this.restartTimer) sessionScheduler.clearInterval(this.restartTimer)
          this.restartTimer = null
          return
        }
      }, 1_000)
    },
    startCallbackRetryCountdown(seconds: number, callbackUrl: string) {
      this.clearSession()
      this.clearCallbackRecovery()
      this.callbackRecovery = createCallbackRecovery('PRE_CLAIM', seconds, callbackUrl)
      this.lastError = AUTH_MESSAGES.MSG_047
      this.restartTimer = sessionScheduler.setInterval(() => {
        if (!this.callbackRecovery) return
        this.callbackRecovery = tickCallbackRecovery(this.callbackRecovery)
        if (this.callbackRecovery.phase !== 'WAITING' && this.restartTimer) {
          sessionScheduler.clearInterval(this.restartTimer)
          this.restartTimer = null
        }
      }, 1_000)
    },
    startInvalidCallbackRecovery() {
      this.clearSession()
      this.clearCallbackRecovery()
      this.callbackRecovery = createCallbackRecovery('INVALID_CONTRACT', 0)
      this.lastError = AUTH_MESSAGES.MSG_048
    },
    async retryCallback(retry: (url: string) => void | Promise<void> = async (url) => {
      const returnTo = await retryOidcCallback(url)
      window.location.assign(returnTo)
    }) {
      if (!this.callbackRecovery || this.callbackRecovery.kind !== 'PRE_CLAIM') return
      this.callbackRecovery = await runCallbackRecovery(this.callbackRecovery, (target) => {
        if (!target) throw new Error('Missing callback URL.')
        return retry(target)
      })
    },
    async restartLogin(returnTo = '/', navigate: (returnTo: string) => void | Promise<void> = beginOidcLogin) {
      if (!this.callbackRecovery || this.callbackRecovery.kind === 'PRE_CLAIM') return
      const next = await runCallbackRecovery(this.callbackRecovery, () => navigate(returnTo))
      this.callbackRecovery = next
      if (next.phase === 'CONTRACT_ERROR') {
        this.restartAfterSeconds = null
        this.lastError = AUTH_MESSAGES.MSG_048
      } else if (next.phase !== 'NAVIGATION_ERROR') {
        this.restartAfterSeconds = null
        this.lastError = null
      } else {
        this.lastError = AUTH_MESSAGES.navigationError
      }
    },
    async logout() {
      try { await api.post('/api/v1/auth/logout') } finally {
        this.clearSession()
        this.selectProject(null)
      }
    },
  },
})
