<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import { useSessionStore } from '../stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const menuItems = [
  { key: 'dashboard', label: 'Tổng quan' },
  { key: 'tasks', label: 'All Tasks', disabled: true },
  { key: 'branches', label: 'Branches', disabled: true },
  { key: 'timeline', label: 'Timeline', disabled: true },
  { key: 'settings', label: 'Cài đặt' },
]

const selectedMenuKeys = computed(() => [String(route.name ?? 'dashboard')])
const projectOptions = computed(() =>
  session.projects.map((project) => ({
    label: `${project.code} - ${project.name}`,
    value: project.id,
  })),
)
const selectedProjectId = computed({
  get: () => session.selectedProjectId,
  set: (value: string | null) => session.selectProject(value),
})
const userMenuItems = computed(() => [
  {
    key: 'profile',
    label: session.user?.email ?? '',
    disabled: true,
  },
  {
    key: 'logout',
    label: 'Đăng xuất',
  },
])

async function handleUserMenuClick({ key }: { key: string }) {
  if (key === 'logout') {
    await session.logout()
    await router.push({ name: 'login' })
  }
}

async function handleMenuClick({ key }: { key: string | number }) {
  if (key === 'dashboard') {
    await router.push({ name: 'dashboard' })
  }

  if (key === 'settings') {
    await router.push({ name: 'settings' })
  }
}
</script>

<template>
  <a-layout class="app-shell">
    <a-layout-sider class="app-sidebar" :width="232">
      <div class="brand">
        <div class="brand-mark">QL</div>
        <div>
          <strong>Quản lý công việc</strong>
          <span>Cá nhân</span>
        </div>
      </div>

      <a-menu
        class="nav-menu"
        mode="inline"
        :items="menuItems"
        :selected-keys="selectedMenuKeys"
        @click="handleMenuClick"
      />
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="app-header">
        <a-space class="header-left">
          <a-select
            v-model:value="selectedProjectId"
            class="project-select"
            :options="projectOptions"
            placeholder="Chọn dự án"
          />
          <a-input-search class="global-search" placeholder="Tìm task, branch..." disabled />
        </a-space>

        <a-dropdown :trigger="['click']">
          <a-button class="user-button">
            {{ session.user?.name ?? 'Tài khoản' }}
          </a-button>
          <template #overlay>
            <a-menu :items="userMenuItems" @click="handleUserMenuClick" />
          </template>
        </a-dropdown>
      </a-layout-header>

      <a-layout-content class="app-content">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
