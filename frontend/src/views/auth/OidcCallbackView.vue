<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { completeOidcCallback } from '../../services/api'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: API-018, SCREEN-009, DS-COMP-012 | Pack: v1.7.21-oidc-session-error-contracts
const route = useRoute()
const router = useRouter()
const invalidCallback = ref(false)
const invalidHeading = ref<HTMLElement | null>(null)

watch(invalidCallback, async (invalid) => {
  if (!invalid) return
  await nextTick()
  invalidHeading.value?.focus()
})

onMounted(async () => {
  const code = typeof route.query.code === 'string' ? route.query.code : ''
  const state = typeof route.query.state === 'string' ? route.query.state : ''
  if (!code || !state) {
    invalidCallback.value = true
    return
  }
  try {
    const returnTo = await completeOidcCallback(code, state)
    await router.replace(returnTo)
  } catch {
    // Valid 503 recovery is routed by the shared Axios interceptor; only unrecoverable callback input stays here.
    if (route.name === 'oidc-callback') invalidCallback.value = true
  }
})
</script>

<template>
  <main class="auth-page" aria-live="polite">
    <section
      :id="invalidCallback ? 'auth-callback-invalid' : 'auth-callback-processing'"
      class="auth-panel"
      :aria-busy="invalidCallback ? undefined : 'true'"
    >
      <template v-if="invalidCallback">
        <h1 ref="invalidHeading" tabindex="-1">Không thể hoàn tất đăng nhập</h1>
        <p>Phản hồi đăng nhập không hợp lệ hoặc đã hết hạn.</p>
        <a-button type="primary" @click="router.replace({ name: 'login' })">Quay lại đăng nhập</a-button>
      </template>
      <template v-else>
        <h1>Đang hoàn tất đăng nhập</h1>
        <p>Vui lòng chờ trong khi phiên đăng nhập được tạo.</p>
      </template>
    </section>
  </main>
</template>
