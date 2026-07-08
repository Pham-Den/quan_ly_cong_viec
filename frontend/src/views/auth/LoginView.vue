<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

import { useSessionStore } from '../../stores/session'

const router = useRouter()
const session = useSessionStore()
const formState = reactive({
  email: '',
  password: '',
})

async function submitLogin() {
  await session.login(formState)
  await router.push({ name: 'dashboard' })
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel">
      <div class="auth-brand">
        <div class="brand-mark">QL</div>
        <div>
          <h1>Đăng nhập</h1>
          <p>Quản lý task và branch cá nhân</p>
        </div>
      </div>

      <a-alert v-if="session.lastError" class="auth-alert" type="error" :message="session.lastError" />

      <a-form layout="vertical" :model="formState" @finish="submitLogin">
        <a-form-item
          label="Email"
          name="email"
          :rules="[{ required: true, message: 'Nhập email' }]"
        >
          <a-input v-model:value="formState.email" autocomplete="email" />
        </a-form-item>

        <a-form-item
          label="Mật khẩu"
          name="password"
          :rules="[{ required: true, message: 'Nhập mật khẩu' }]"
        >
          <a-input-password v-model:value="formState.password" autocomplete="current-password" />
        </a-form-item>

        <a-button block type="primary" html-type="submit" :loading="session.loading">
          Đăng nhập
        </a-button>
      </a-form>
    </section>
  </main>
</template>
