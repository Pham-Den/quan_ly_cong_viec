<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useSessionStore } from '../../stores/session'
import { AUTH_MESSAGES } from '../../core/auth/auth-messages'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: API-017, DS-COMP-012, PR-001 | Pack: v1.7.21-oidc-session-error-contracts

const route = useRoute()
const session = useSessionStore()
const recoveryHeading = ref<HTMLElement | null>(null)
const recovery = computed(() => session.callbackRecovery)
const forceSafeLogin = ref(false)

watch(recovery, async (value) => {
  if (!value) return
  await nextTick()
  recoveryHeading.value?.focus()
}, { immediate: true })

onMounted(() => {
  if (!import.meta.env.DEV || typeof route.query.recoveryFixture !== 'string') return
  const fixture = route.query.recoveryFixture
  if (fixture === 'pre-wait') session.startCallbackRetryCountdown(30, '/api/v1/auth/callback?code=fixture&state=fixture')
  if (fixture === 'pre-ready') session.startCallbackRetryCountdown(0, '/api/v1/auth/callback?code=fixture&state=fixture')
  if (fixture === 'pre-exhausted') {
    session.startCallbackRetryCountdown(0, '/api/v1/auth/callback?code=fixture&state=fixture')
    if (session.callbackRecovery) session.callbackRecovery.phase = 'EXHAUSTED'
  }
  if (fixture === 'post-wait') session.startRestartCountdown(30)
  if (fixture === 'post-ready') session.startRestartCountdown(0)
  if (fixture === 'navigation-error') {
    session.startRestartCountdown(0)
    if (session.callbackRecovery) session.callbackRecovery.phase = 'NAVIGATION_ERROR'
    session.lastError = AUTH_MESSAGES.navigationError
  }
  if (fixture === 'invalid-contract') session.startInvalidCallbackRecovery()
})

function submitLogin() {
  const returnTo = forceSafeLogin.value ? '/' : typeof route.query.returnTo === 'string' ? route.query.returnTo : '/'
  if (session.callbackRecovery && session.callbackRecovery.kind !== 'PRE_CLAIM') session.restartLogin('/')
  else session.login(returnTo)
}

function returnToLogin() {
  forceSafeLogin.value = true
  session.clearCallbackRecovery()
  session.lastError = null
}
</script>

<template>
  <main class="auth-page">
    <section :id="recovery ? 'auth-callback-recovery' : 'auth-login-entry'" class="auth-panel">
      <div class="auth-brand">
        <div class="brand-mark">QL</div>
        <div>
          <h1>{{ AUTH_MESSAGES.loginHeading }}</h1>
          <p>{{ AUTH_MESSAGES.loginSubtext }}</p>
        </div>
      </div>

      <section
        v-if="recovery?.kind === 'PRE_CLAIM'"
        :id="recovery.phase === 'EXHAUSTED' ? 'auth-callback-retry-exhausted' : 'auth-callback-retry-required'"
        :aria-busy="recovery.phase === 'WAITING' ? 'true' : undefined"
        role="alert"
      >
        <h2 ref="recoveryHeading" tabindex="-1">
          {{ recovery.phase === 'EXHAUSTED' ? AUTH_MESSAGES.callbackRetryExhaustedHeading : AUTH_MESSAGES.callbackRetryHeading }}
        </h2>
        <p>{{ recovery.phase === 'EXHAUSTED' ? AUTH_MESSAGES.callbackRetryExhausted : session.lastError }}</p>
        <p v-if="recovery.phase !== 'EXHAUSTED'" id="auth-callback-retry-countdown" aria-live="polite">
          <span v-if="recovery.phase === 'WAITING'">{{ AUTH_MESSAGES.callbackRetryWaiting(recovery.secondsRemaining) }}</span>
          <span v-else>{{ AUTH_MESSAGES.callbackRetryReady }}</span>
        </p>
        <a-button
          v-if="recovery.phase !== 'EXHAUSTED'"
          id="auth-callback-retry"
          block
          type="primary"
          :disabled="recovery.phase !== 'READY'"
          @click="session.retryCallback()"
        >
          {{ AUTH_MESSAGES.retryCallback }}
        </a-button>
        <a-button v-else block type="primary" @click="returnToLogin">{{ AUTH_MESSAGES.returnToLogin }}</a-button>
      </section>

      <section
        v-else-if="recovery?.kind === 'POST_CLAIM' || recovery?.kind === 'INVALID_CONTRACT'"
        :id="recovery.phase === 'CONTRACT_ERROR' ? 'auth-callback-recovery-invalid' : recovery.phase === 'NAVIGATION_ERROR' ? 'auth-restart-error' : 'auth-restart-required'"
        :aria-busy="recovery.phase === 'WAITING' ? 'true' : undefined"
        role="alert"
      >
        <h2 ref="recoveryHeading" tabindex="-1">
          {{ recovery.phase === 'CONTRACT_ERROR' ? AUTH_MESSAGES.invalidContractHeading : recovery.phase === 'NAVIGATION_ERROR' ? AUTH_MESSAGES.navigationError : AUTH_MESSAGES.postClaimHeading }}
        </h2>
        <p>{{ session.lastError }}</p>
        <p v-if="recovery.phase !== 'CONTRACT_ERROR'" id="auth-restart-countdown" aria-live="polite">
          <span v-if="recovery.phase === 'WAITING'">{{ AUTH_MESSAGES.postClaimWaiting(recovery.secondsRemaining) }}</span>
          <span v-else>{{ AUTH_MESSAGES.postClaimReady }}</span>
        </p>
        <a-button
          id="auth-restart-login"
          block
          type="primary"
          :disabled="recovery.phase === 'WAITING'"
          @click="submitLogin"
        >
          {{ recovery.phase === 'CONTRACT_ERROR' ? AUTH_MESSAGES.startLoginAgain : recovery.phase === 'NAVIGATION_ERROR' ? AUTH_MESSAGES.retryLogin : AUTH_MESSAGES.loginAgain }}
        </a-button>
      </section>
      <a-alert v-else-if="session.lastError" class="auth-alert" type="error" :message="session.lastError" />

      <a-button
        v-if="!recovery"
        block
        type="primary"
        :loading="session.loading"
        :disabled="session.restartAfterSeconds !== null && session.restartAfterSeconds > 0"
        @click="submitLogin"
      >
        {{ AUTH_MESSAGES.loginWithIam }}
      </a-button>
    </section>
  </main>
</template>
