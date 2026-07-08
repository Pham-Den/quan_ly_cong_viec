<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

import { useSessionStore } from '../../stores/session'

const router = useRouter()
const session = useSessionStore()
const formState = reactive({
  name: '',
  email: '',
  password: '',
})

async function submitSetup() {
  await session.setupAccount(formState)
  await router.push({ name: 'dashboard' })
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel">
      <div class="auth-brand">
        <div class="brand-mark">QL</div>
        <div>
          <h1>Tạo tài khoản đầu tiên</h1>
          <p>Thiết lập app local của bạn</p>
        </div>
      </div>

      <a-alert v-if="session.lastError" class="auth-alert" type="error" :message="session.lastError" />

      <a-form layout="vertical" :model="formState" @finish="submitSetup">
        <a-form-item
          label="Tên hiển thị"
          name="name"
          :rules="[{ required: true, message: 'Nhập tên hiển thị' }]"
        >
          <a-input v-model:value="formState.name" autocomplete="name" />
        </a-form-item>

        <a-form-item
          label="Email"
          name="email"
          :rules="[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]"
        >
          <a-input v-model:value="formState.email" autocomplete="email" />
        </a-form-item>

        <a-form-item
          label="Mật khẩu"
          name="password"
          :rules="[
            { required: true, message: 'Nhập mật khẩu' },
            { min: 8, message: 'Tối thiểu 8 ký tự' },
          ]"
        >
          <a-input-password v-model:value="formState.password" autocomplete="new-password" />
        </a-form-item>

        <a-button block type="primary" html-type="submit" :loading="session.loading">
          Tạo tài khoản
        </a-button>
      </a-form>
    </section>
  </main>
</template>
