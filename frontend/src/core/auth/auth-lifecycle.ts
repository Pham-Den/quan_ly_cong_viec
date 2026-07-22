import type { AuthRouter, AuthSessionData, AuthSessionStore } from './auth-lifecycle.types'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: DS-COMP-012, API-017–020 | Pack: v1.7.21-oidc-session-error-contracts
export function createAuthLifecycleHandlers(
  session: AuthSessionStore,
  router: AuthRouter,
  notifyExpired: () => void,
) {
  let handlingExpiredSession = false
  return {
    onSessionRefreshed: (sessionData: AuthSessionData) => { session.setSession(sessionData) },
    onSessionExpired: async () => {
      if (handlingExpiredSession) return
      handlingExpiredSession = true
      try {
        if (session.isAuthenticated || session.accessToken || session.refreshToken) notifyExpired()
        session.clearSession()
        if (router.currentRoute.value.name && router.currentRoute.value.name !== 'login') {
          await router.replace({ name: 'login' })
        }
      } finally {
        handlingExpiredSession = false
      }
    },
    onRestartRequired: async (retryAfterSeconds: number) => {
      session.startRestartCountdown(retryAfterSeconds)
      if (router.currentRoute.value.name !== 'login') {
        await router.replace({ name: 'login' })
      }
    },
    onCallbackRetryRequired: async (retryAfterSeconds: number, callbackUrl: string) => {
      session.startCallbackRetryCountdown(retryAfterSeconds, callbackUrl)
      if (router.currentRoute.value.name !== 'login') await router.replace({ name: 'login' })
    },
    onCallbackRecoveryInvalid: async () => {
      session.startInvalidCallbackRecovery()
      if (router.currentRoute.value.name !== 'login') await router.replace({ name: 'login' })
    },
  }
}
