<script setup lang="ts">
const taskBuckets = [
  { label: 'Chua lam', value: 0, tone: 'default' },
  { label: 'Dang tien hanh', value: 0, tone: 'processing' },
  { label: 'Dang o release', value: 0, tone: 'warning' },
  { label: 'San sang main', value: 0, tone: 'purple' },
  { label: 'Done', value: 0, tone: 'success' },
  { label: 'Blocked', value: 0, tone: 'error' },
]

const menuItems = [
  { key: 'dashboard', label: 'Tong quan' },
  { key: 'tasks', label: 'All Tasks' },
  { key: 'branches', label: 'Branches' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'settings', label: 'Cai dat' },
]
</script>

<template>
  <a-layout class="app-shell">
    <a-layout-sider class="app-sidebar" :width="232">
      <div class="brand">
        <div class="brand-mark">QL</div>
        <div>
          <strong>Quan ly cong viec</strong>
          <span>Ca nhan</span>
        </div>
      </div>

      <a-menu class="nav-menu" mode="inline" :items="menuItems" :selected-keys="['dashboard']" />
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="app-header">
        <a-space>
          <a-select class="project-select" value="all" size="middle">
            <a-select-option value="all">Tat ca du an</a-select-option>
          </a-select>
          <a-input-search class="global-search" placeholder="Tim task, branch..." />
        </a-space>
      </a-layout-header>

      <a-layout-content class="app-content">
        <section class="page-heading">
          <div>
            <h1>Tong quan</h1>
            <p>Task, branch, release va main</p>
          </div>
          <a-button type="primary">Them note</a-button>
        </section>

        <section class="bucket-grid">
          <a-card v-for="bucket in taskBuckets" :key="bucket.label" class="bucket-card">
            <a-statistic :title="bucket.label" :value="bucket.value" />
            <a-tag :color="bucket.tone">0 task</a-tag>
          </a-card>
        </section>

        <section class="workspace-grid">
          <a-card title="All Tasks" class="work-panel">
            <a-empty description="Chua co task" />
          </a-card>
          <a-card title="Branches" class="work-panel">
            <a-empty description="Chua co branch" />
          </a-card>
        </section>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
