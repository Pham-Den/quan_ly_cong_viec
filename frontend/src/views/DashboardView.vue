<script setup lang="ts">
import { reactive, ref } from 'vue'

import { api } from '../services/api'
import { useSessionStore } from '../stores/session'

const session = useSessionStore()
const savingNote = ref(false)
const quickNote = reactive({
  content: '',
  source: '',
})
const taskBuckets = [
  { label: 'Chưa làm', value: 0, tone: 'default' },
  { label: 'Đang tiến hành', value: 0, tone: 'processing' },
  { label: 'Đang test/review', value: 0, tone: 'cyan' },
  { label: 'Đang ở release', value: 0, tone: 'warning' },
  { label: 'Sẵn sàng main', value: 0, tone: 'blue' },
  { label: 'Done', value: 0, tone: 'success' },
  { label: 'Blocked', value: 0, tone: 'error' },
]

async function submitQuickNote() {
  if (!quickNote.content.trim()) {
    return
  }

  savingNote.value = true

  try {
    await api.post('/api/notes', {
      projectId: session.selectedProjectId,
      content: quickNote.content,
      source: quickNote.source,
    })
    quickNote.content = ''
    quickNote.source = ''
  } finally {
    savingNote.value = false
  }
}
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

  <a-card class="quick-note-card" title="Inbox nhanh">
    <a-form layout="inline" :model="quickNote" @finish="submitQuickNote">
      <a-form-item name="content" :rules="[{ required: true, message: 'Nhập nội dung note' }]">
        <a-input v-model:value="quickNote.content" class="quick-note-input" placeholder="Ghi nhanh yêu cầu mới..." />
      </a-form-item>
      <a-form-item>
        <a-input v-model:value="quickNote.source" placeholder="Nguồn" />
      </a-form-item>
      <a-button type="primary" html-type="submit" :loading="savingNote">Thêm note</a-button>
    </a-form>
  </a-card>

  <section class="workspace-grid">
    <a-card title="All Tasks" class="work-panel">
      <a-empty description="Chưa có task" />
    </a-card>
    <a-card title="Branches" class="work-panel">
      <a-empty description="Chưa có branch" />
    </a-card>
  </section>
</template>
