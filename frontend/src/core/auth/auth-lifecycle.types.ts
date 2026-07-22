import type { ApiSessionResponse } from '../../services/api'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: DS-COMP-012, API-017–020 | Pack: v1.7.21-oidc-session-error-contracts

export type AuthSessionStore = {
  isAuthenticated: boolean
  accessToken: null
  refreshToken: null
  setSession: (session: ApiSessionResponse) => void
  clearSession: () => void
  startRestartCountdown: (seconds: number) => void
  startCallbackRetryCountdown: (seconds: number, callbackUrl: string) => void
  startInvalidCallbackRecovery: () => void
}

export type AuthSessionData = ApiSessionResponse

export type AuthRouter = {
  currentRoute: { value: { name?: unknown; fullPath: string } }
  replace: (target: { name: string; query?: { returnTo: string } }) => void | Promise<unknown>
}
