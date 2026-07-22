<script setup lang="ts">
import { useSessionStore } from '../../stores/session'

// Sprint: v1 | Feature: NFR-004 | Task Group: 02C Browser session cutover
// Contract: ADR-006 Central-IAM-only cutover | Pack: v1.7.21-oidc-session-error-contracts

const session = useSessionStore()
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel">
      <h1>Đăng nhập tập trung</h1>
      <p>Tài khoản và chính sách truy cập được quản lý bởi Central IAM.</p>
      <a-button block type="primary" @click="session.login('/')">
        Đăng nhập với Central IAM
      </a-button>
    </section>
  </main>
</template>
