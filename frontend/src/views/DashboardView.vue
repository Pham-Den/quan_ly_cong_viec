<script setup lang="ts">
const taskBuckets = [
  { label: 'Chưa làm', value: 0, tone: 'default' },
  { label: 'Đang tiến hành', value: 0, tone: 'processing' },
  { label: 'Đang test/review', value: 0, tone: 'cyan' },
  { label: 'Đang ở release', value: 0, tone: 'warning' },
  { label: 'Sẵn sàng main', value: 0, tone: 'blue' },
  { label: 'Done', value: 0, tone: 'success' },
  { label: 'Blocked', value: 0, tone: 'error' },
]
</script>

<template>
  <section class="page-heading">
    <div>
      <h1>Tổng quan</h1>
      <p>Task, branch, release và main</p>
    </div>
    <a-button type="primary" disabled>Thêm note</a-button>
  </section>

  <section class="bucket-grid">
    <a-card v-for="bucket in taskBuckets" :key="bucket.label" class="bucket-card">
      <a-statistic :title="bucket.label" :value="bucket.value" />
      <a-tag :color="bucket.tone">0 task</a-tag>
    </a-card>
  </section>

  <section class="workspace-grid">
    <a-card title="All Tasks" class="work-panel">
      <a-empty description="Chưa có task" />
    </a-card>
    <a-card title="Branches" class="work-panel">
      <a-empty description="Chưa có branch" />
    </a-card>
  </section>
</template>
