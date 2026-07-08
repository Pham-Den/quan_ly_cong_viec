<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import { api } from '../services/api'
import { useSessionStore } from '../stores/session'

type SearchResult = {
  type: 'task' | 'branch' | 'note'
  id: string
  label: string
  description: string
}

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const globalSearch = ref('')
const globalSearchResults = ref<SearchResult[]>([])

const menuItems = [
  { key: 'dashboard', label: 'Tổng quan' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'tasks', label: 'Tất cả task' },
  { key: 'branches', label: 'Nhánh' },
  { key: 'timeline', label: 'Dòng thời gian' },
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
const globalSearchOptions = computed(() =>
  globalSearchResults.value.map((result) => ({
    value: `${result.type}:${result.id}`,
    label: `${result.label} - ${result.description}`,
  })),
)

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

  if (key === 'inbox') {
    await router.push({ name: 'inbox' })
  }

  if (key === 'tasks') {
    await router.push({ name: 'tasks' })
  }

  if (key === 'branches') {
    await router.push({ name: 'branches' })
  }

  if (key === 'timeline') {
    await router.push({ name: 'timeline' })
  }
}

async function loadGlobalSearch(value: string) {
  globalSearch.value = value

  if (!value.trim() || !session.selectedProjectId) {
    globalSearchResults.value = []
    return
  }

  const params = new URLSearchParams({
    projectId: session.selectedProjectId,
    q: value,
  })
  const { data } = await api.get<SearchResult[]>(`/api/search?${params.toString()}`)

  globalSearchResults.value = data
}

async function openSearchResult(value: string) {
  const [type, id] = value.split(':')

  globalSearch.value = ''
  globalSearchResults.value = []

  if (type === 'task') {
    await router.push({ name: 'tasks', query: { taskId: id } })
  }

  if (type === 'branch') {
    await router.push({ name: 'branches', query: { branchId: id } })
  }

  if (type === 'note') {
    await router.push({ name: 'inbox' })
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
          <a-select
            v-model:value="globalSearch"
            class="global-search"
            show-search
            allow-clear
            :filter-option="false"
            :options="globalSearchOptions"
            placeholder="Tìm task, branch..."
            @search="loadGlobalSearch"
            @select="openSearchResult"
          />
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
