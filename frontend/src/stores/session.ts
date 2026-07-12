import axios from 'axios'
import { defineStore } from 'pinia'

import { ACCESS_TOKEN_KEY, api, REFRESH_TOKEN_KEY } from '../services/api'

export type SessionUser = {
  id: string
  email: string
  name: string
}

export type ShellProject = {
  id: string
  code: string
  name: string
  defaultRepoId: string | null
}

type BootstrapResponse = {
  setupRequired: boolean
}

type SessionResponse = {
  user: SessionUser
  projects: ShellProject[]
  accessToken: string
  refreshToken: string
}

type CurrentUserResponse = {
  user: SessionUser
  projects: ShellProject[]
}

type LoginPayload = {
  email: string
  password: string
}

type SetupPayload = LoginPayload & {
  name: string
}

const SELECTED_PROJECT_KEY = 'qlcv.selectedProjectId'

let restorePromise: Promise<void> | null = null

function readStoredValue(key: string) {
  return localStorage.getItem(key)
}

function writeStoredValue(key: string, value: string | null) {
  if (value) {
    localStorage.setItem(key, value)
  } else {
    localStorage.removeItem(key)
  }
}

function toErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (data && typeof data === 'object' && 'message' in data) {
      const message = data.message

      if (typeof message === 'string') {
        return message
      }
    }
  }

  return fallback
}

function isExpectedRestoreAuthFailure(error: unknown) {
  return axios.isAxiosError(error) && [400, 401].includes(error.response?.status ?? 0)
}

function chooseProjectId(projects: ShellProject[], currentProjectId: string | null) {
  if (currentProjectId && projects.some((project) => project.id === currentProjectId)) {
    return currentProjectId
  }

  return projects[0]?.id ?? null
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    user: null as SessionUser | null,
    projects: [] as ShellProject[],
    accessToken: readStoredValue(ACCESS_TOKEN_KEY),
    refreshToken: readStoredValue(REFRESH_TOKEN_KEY),
    selectedProjectId: readStoredValue(SELECTED_PROJECT_KEY),
    setupRequired: null as boolean | null,
    loading: false,
    lastError: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user && state.accessToken),
    selectedProject: (state) =>
      state.projects.find((project) => project.id === state.selectedProjectId) ?? null,
  },
  actions: {
    selectProject(projectId: string | null) {
      this.selectedProjectId = projectId
      writeStoredValue(SELECTED_PROJECT_KEY, projectId)
    },
    setSession(session: SessionResponse) {
      this.user = session.user
      this.projects = session.projects
      this.accessToken = session.accessToken
      this.refreshToken = session.refreshToken
      this.setupRequired = false
      this.lastError = null

      writeStoredValue(ACCESS_TOKEN_KEY, session.accessToken)
      writeStoredValue(REFRESH_TOKEN_KEY, session.refreshToken)

      this.selectProject(chooseProjectId(session.projects, this.selectedProjectId))
    },
    clearSession() {
      this.user = null
      this.projects = []
      this.accessToken = null
      this.refreshToken = null
      this.selectedProjectId = null

      writeStoredValue(ACCESS_TOKEN_KEY, null)
      writeStoredValue(REFRESH_TOKEN_KEY, null)
      writeStoredValue(SELECTED_PROJECT_KEY, null)
    },
    async checkBootstrap() {
      const { data } = await api.get<BootstrapResponse>('/api/auth/bootstrap')

      this.setupRequired = data.setupRequired
      return data.setupRequired
    },
    async fetchMe() {
      const { data } = await api.get<CurrentUserResponse>('/api/auth/me')

      this.user = data.user
      this.projects = data.projects
      this.setupRequired = false

      this.selectProject(chooseProjectId(data.projects, this.selectedProjectId))
    },
    async refreshSession() {
      if (!this.refreshToken) {
        throw new Error('Missing refresh token')
      }

      const { data } = await api.post<SessionResponse>('/api/auth/refresh', {
        refreshToken: this.refreshToken,
      })

      this.setSession(data)
    },
    async restoreSession(force = false) {
      if (restorePromise && !force) {
        return restorePromise
      }

      restorePromise = this.restoreSessionOnce()

      try {
        await restorePromise
      } finally {
        restorePromise = null
      }
    },
    async restoreSessionOnce() {
      this.loading = true
      this.lastError = null

      try {
        const setupRequired = await this.checkBootstrap()

        if (setupRequired) {
          this.clearSession()
          return
        }

        if (this.accessToken) {
          try {
            await this.fetchMe()
            return
          } catch (error) {
            if (!this.refreshToken || isExpectedRestoreAuthFailure(error)) {
              this.clearSession()
              return
            }

            try {
              await this.refreshSession()
            } catch (refreshError) {
              if (isExpectedRestoreAuthFailure(refreshError)) {
                this.clearSession()
                return
              }

              throw refreshError
            }

            return
          }
        }

        if (this.refreshToken) {
          try {
            await this.refreshSession()
          } catch (error) {
            if (isExpectedRestoreAuthFailure(error)) {
              this.clearSession()
              return
            }

            throw error
          }
        }
      } catch (error) {
        this.lastError = toErrorMessage(error, 'Khong the khoi phuc phien dang nhap.')
        this.clearSession()
      } finally {
        this.loading = false
      }
    },
    async setupAccount(payload: SetupPayload) {
      this.loading = true
      this.lastError = null

      try {
        const { data } = await api.post<SessionResponse>('/api/auth/setup', payload)

        this.setSession(data)
      } catch (error) {
        this.lastError = toErrorMessage(error, 'Khong the tao tai khoan dau tien.')
        throw error
      } finally {
        this.loading = false
      }
    },
    async login(payload: LoginPayload) {
      this.loading = true
      this.lastError = null

      try {
        const { data } = await api.post<SessionResponse>('/api/auth/login', payload)

        this.setSession(data)
      } catch (error) {
        this.lastError = toErrorMessage(error, 'Dang nhap khong thanh cong.')
        throw error
      } finally {
        this.loading = false
      }
    },
    async logout() {
      const token = this.refreshToken

      this.clearSession()

      if (token) {
        await api.post('/api/auth/logout', { refreshToken: token })
      }
    },
  },
})
