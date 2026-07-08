<script setup lang="ts">
import { ref, useSlots } from 'vue'

type KanbanItem = Record<string, unknown>

type KanbanColumn = {
  key: string
  label: string
  color?: string
  items: KanbanItem[]
  dropDisabled?: boolean
  hint?: string
  emptyText?: string
}

type KanbanPayload = {
  item: KanbanItem
  column: KanbanColumn
  sourceColumn: KanbanColumn | null
}

type KanbanReorderPayload = KanbanPayload & {
  targetItem: KanbanItem
}

type KanbanExternalDropPayload = {
  itemKey: string
  column: KanbanColumn
  sourceColumn: null
}

const props = withDefaults(
  defineProps<{
    columns: KanbanColumn[]
    boardTestId?: string
    emptyText?: string
    allowSameColumnDrop?: boolean
    columnTestIdPrefix?: string
    cardTestIdPrefix?: string
    getItemKey?: (item: KanbanItem) => string | number
    getColumnTestId?: (column: KanbanColumn) => string
    getCardTestId?: (item: KanbanItem, column: KanbanColumn) => string
    getItemClass?: (item: KanbanItem, column: KanbanColumn) => string | string[] | Record<string, boolean>
  }>(),
  {
    boardTestId: 'app-kanban',
    emptyText: 'Không có dữ liệu',
    allowSameColumnDrop: false,
    columnTestIdPrefix: 'kanban-column',
    cardTestIdPrefix: 'kanban-card',
  },
)

const emit = defineEmits<{
  'item-drop': [payload: KanbanPayload]
  'blocked-drop': [payload: KanbanPayload]
  'external-drop': [payload: KanbanExternalDropPayload]
  'item-reorder': [payload: KanbanReorderPayload]
  'item-click': [payload: KanbanPayload & { event: MouseEvent }]
}>()

const slots = useSlots()
const draggedItemKey = ref('')
const draggedSourceColumnKey = ref('')
const dragOverColumnKey = ref('')
const openActionCardKey = ref('')

function itemKey(item: KanbanItem) {
  if (props.getItemKey) {
    return props.getItemKey(item)
  }

  return String(item.id ?? '')
}

function columnTestId(column: KanbanColumn) {
  return props.getColumnTestId?.(column) ?? `${props.columnTestIdPrefix}-${column.key}`
}

function cardTestId(item: KanbanItem, column: KanbanColumn) {
  return props.getCardTestId?.(item, column) ?? `${props.cardTestIdPrefix}-${itemKey(item)}`
}

function actionCardKey(item: KanbanItem, column: KanbanColumn) {
  return `${column.key}:${itemKey(item)}`
}

function isActionPopoverOpen(item: KanbanItem, column: KanbanColumn) {
  return openActionCardKey.value === actionCardKey(item, column)
}

function setActionPopoverOpen(item: KanbanItem, column: KanbanColumn, open: boolean) {
  openActionCardKey.value = open ? actionCardKey(item, column) : ''
}

function closeActionPopover() {
  openActionCardKey.value = ''
}

function findDraggedItem() {
  for (const column of props.columns) {
    const item = column.items.find((entry) => String(itemKey(entry)) === draggedItemKey.value)

    if (item) {
      return {
        item,
        sourceColumn: column,
      }
    }
  }

  return null
}

function startDrag(item: KanbanItem, column: KanbanColumn, event: DragEvent) {
  draggedItemKey.value = String(itemKey(item))
  draggedSourceColumnKey.value = column.key
  event.dataTransfer?.setData('text/plain', draggedItemKey.value)

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function markDragOver(column: KanbanColumn) {
  dragOverColumnKey.value = column.key
}

function clearDrag() {
  draggedItemKey.value = ''
  draggedSourceColumnKey.value = ''
  dragOverColumnKey.value = ''
}

function dropIntoColumn(column: KanbanColumn, event: DragEvent) {
  draggedItemKey.value = event.dataTransfer?.getData('text/plain') || draggedItemKey.value

  const dragged = findDraggedItem()

  if (!dragged) {
    if (draggedItemKey.value) {
      emit('external-drop', {
        itemKey: draggedItemKey.value,
        column,
        sourceColumn: null,
      })
    }
    clearDrag()
    return
  }

  if (!props.allowSameColumnDrop && draggedSourceColumnKey.value === column.key) {
    clearDrag()
    return
  }

  const payload = {
    item: dragged.item,
    column,
    sourceColumn: dragged.sourceColumn,
  }

  if (column.dropDisabled) {
    emit('blocked-drop', payload)
    clearDrag()
    return
  }

  emit('item-drop', payload)
  clearDrag()
}

function dropOnCard(targetItem: KanbanItem, column: KanbanColumn, event: DragEvent) {
  draggedItemKey.value = event.dataTransfer?.getData('text/plain') || draggedItemKey.value

  const dragged = findDraggedItem()

  if (!dragged) {
    if (draggedItemKey.value) {
      emit('external-drop', {
        itemKey: draggedItemKey.value,
        column,
        sourceColumn: null,
      })
    }
    clearDrag()
    return
  }

  if (String(itemKey(targetItem)) === String(itemKey(dragged.item))) {
    clearDrag()
    return
  }

  const payload = {
    item: dragged.item,
    targetItem,
    column,
    sourceColumn: dragged.sourceColumn,
  }

  if (dragged.sourceColumn?.key === column.key) {
    emit('item-reorder', payload)
    clearDrag()
    return
  }

  if (column.dropDisabled) {
    emit('blocked-drop', payload)
    clearDrag()
    return
  }

  emit('item-drop', payload)
  clearDrag()
}
</script>

<template>
  <section class="app-kanban" :data-testid="boardTestId">
    <div class="app-kanban-row">
      <div
        v-for="column in columns"
        :key="column.key"
        class="app-kanban-column"
        :class="{
          'app-kanban-column-over': dragOverColumnKey === column.key,
          'app-kanban-column-locked': column.dropDisabled,
        }"
        :data-testid="columnTestId(column)"
        @dragover.prevent="markDragOver(column)"
        @dragleave="dragOverColumnKey === column.key && (dragOverColumnKey = '')"
        @drop.prevent="dropIntoColumn(column, $event)"
      >
        <div class="app-kanban-column-header">
          <slot name="column-header" :column="column">
            <a-space>
              <a-tag :color="column.color">{{ column.items.length }}</a-tag>
              <strong>{{ column.label }}</strong>
            </a-space>
            <span v-if="column.hint" class="muted-text">{{ column.hint }}</span>
          </slot>
        </div>

        <div class="app-kanban-column-body">
          <article
            v-for="item in column.items"
            :key="itemKey(item)"
            class="app-kanban-card"
            :class="getItemClass?.(item, column)"
            draggable="true"
            :data-testid="cardTestId(item, column)"
            @dragstart="startDrag(item, column, $event)"
            @dragover.prevent="markDragOver(column)"
            @drop.stop.prevent="dropOnCard(item, column, $event)"
            @dragend="clearDrag"
            @click="emit('item-click', { item, column, sourceColumn: column, event: $event })"
          >
            <a-popover
              v-if="slots['card-actions']"
              trigger="click"
              placement="bottomRight"
              :open="isActionPopoverOpen(item, column)"
              @update:open="setActionPopoverOpen(item, column, $event)"
            >
              <template #content>
                <div class="app-kanban-card-action-panel" @click.stop @mousedown.stop>
                  <slot name="card-actions" :item="item" :column="column" :close-actions="closeActionPopover" />
                </div>
              </template>
              <button
                class="app-kanban-card-action-trigger"
                type="button"
                aria-label="Mở action"
                :data-testid="`${cardTestId(item, column)}-actions`"
                draggable="false"
                @click.stop
                @mousedown.stop
                @dragstart.stop.prevent
              >
                <span class="app-kanban-card-menu-icon" aria-hidden="true" />
              </button>
            </a-popover>
            <slot name="card" :item="item" :column="column" />
          </article>

          <div v-if="!column.items.length" class="app-kanban-empty">
            <slot name="empty" :column="column">
              {{ column.emptyText ?? emptyText }}
            </slot>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
