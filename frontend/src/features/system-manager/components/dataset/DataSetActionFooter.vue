<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  editing: boolean
  saving: boolean
  entityLabel: string
  deleteTitle?: string
}>()

const emit = defineEmits<{
  save: []
  reset: []
  remove: []
}>()

const saveText = computed(() =>
  props.editing ? `Cập nhật ${props.entityLabel}` : `Lưu mới ${props.entityLabel}`,
)
const resetText = computed(() => (props.editing ? 'Hủy sửa' : 'Clear form'))
</script>

<template>
  <div class="manager-actions">
    <a-button type="primary" :loading="saving" @click="emit('save')">
      {{ saveText }}
    </a-button>
    <a-button @click="emit('reset')">{{ resetText }}</a-button>
    <a-popconfirm
      v-if="editing"
      :title="deleteTitle"
      ok-text="Xóa"
      cancel-text="Hủy"
      @confirm="emit('remove')"
    >
      <a-button danger>Xóa</a-button>
    </a-popconfirm>
  </div>
</template>
