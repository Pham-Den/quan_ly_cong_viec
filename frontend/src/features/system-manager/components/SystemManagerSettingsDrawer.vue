<script setup lang="ts">
import { DownloadOutlined, FolderOpenOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { parse as parseYaml } from 'yaml'
import { computed, reactive, ref, watch } from 'vue'

import {
  applySystemManagerImport,
  exportSystemManagerTopology,
  previewSystemManagerImport,
  type SystemManagerImportPreview,
} from '../ts/service'
import type { SystemManagerSettings } from '../ts/localState'

const props = defineProps<{
  open: boolean
  settings: SystemManagerSettings
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:settings': [value: SystemManagerSettings]
  imported: []
}>()

const drawerOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})
const settingsForm = reactive<SystemManagerSettings>({ ...props.settings })
const importText = ref('')
const importFileName = ref('')
const importPreview = ref<SystemManagerImportPreview | null>(null)
const importDocument = ref<unknown | null>(null)
const importFileInput = ref<HTMLInputElement | null>(null)
const previewLoading = ref(false)
const applyLoading = ref(false)
const exportLoading = ref(false)

const defaultGraphViewOptions = [
  { label: 'Remember', value: 'remember' },
  { label: 'Collapsed', value: 'collapsed' },
  { label: 'Expanded', value: 'expanded' },
]
const detailPanelDefaultOptions = [
  { label: 'Remember', value: 'remember' },
  { label: 'Open', value: 'open' },
  { label: 'Collapsed', value: 'collapsed' },
]
const summaryRows = computed(() => {
  const summary = importPreview.value?.summary

  if (!summary) {
    return []
  }

  return [
    { label: 'Environments', value: summary.environments },
    { label: 'Hosts', value: summary.hosts },
    { label: 'Global nodes', value: summary.nodes },
    { label: 'Node bindings', value: summary.nodeBindings },
    { label: 'Global dependencies', value: summary.dependencies },
    { label: 'Dependency bindings', value: summary.dependencyBindings },
  ]
})

function assignSettings(settings: SystemManagerSettings) {
  settingsForm.defaultGraphView = settings.defaultGraphView
  settingsForm.detailPanelDefault = settings.detailPanelDefault
  settingsForm.resetSearchOnEnvironmentChange = settings.resetSearchOnEnvironmentChange
}

function saveSettings() {
  emit('update:settings', { ...settingsForm })
  message.success('Đã lưu settings local')
}

function clearImportPreview() {
  importPreview.value = null
  importDocument.value = null
}

function parseImportDocument() {
  const content = importText.value.trim()

  if (!content) {
    throw new Error('Chưa có nội dung import.')
  }

  const lowerFileName = importFileName.value.toLowerCase()

  if (lowerFileName.endsWith('.yaml') || lowerFileName.endsWith('.yml')) {
    return parseYaml(content)
  }

  try {
    return JSON.parse(content) as unknown
  } catch (jsonError) {
    try {
      return parseYaml(content)
    } catch {
      throw jsonError
    }
  }
}

async function handleImportFile(event: Event) {
  const input = event.target

  if (!(input instanceof HTMLInputElement)) {
    return
  }

  const file = input.files?.[0]

  if (!file) {
    return
  }

  importFileName.value = file.name
  importText.value = await file.text()
  clearImportPreview()
  input.value = ''
}

async function previewImport() {
  previewLoading.value = true

  try {
    const document = parseImportDocument()

    importDocument.value = document
    importPreview.value = await previewSystemManagerImport(document)
    message.success('Đã preview import')
  } catch (error) {
    clearImportPreview()
    console.error(error)
    message.error('Không preview được file import')
  } finally {
    previewLoading.value = false
  }
}

async function applyImport() {
  const document = importDocument.value

  if (!document || !importPreview.value?.valid) {
    return
  }

  applyLoading.value = true

  try {
    importPreview.value = await applySystemManagerImport(document)
    message.success('Đã apply import')
    emit('imported')
  } catch (error) {
    console.error(error)
    message.error('Không apply được import')
  } finally {
    applyLoading.value = false
  }
}

async function exportTopology() {
  exportLoading.value = true

  try {
    const document = await exportSystemManagerTopology()
    const blob = new Blob([JSON.stringify(document, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')

    link.href = url
    link.download = `system-manager-topology-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    message.success('Đã export topology')
  } catch (error) {
    console.error(error)
    message.error('Không export được topology')
  } finally {
    exportLoading.value = false
  }
}

watch(
  () => props.settings,
  (settings) => assignSettings(settings),
  { deep: true },
)
</script>

<template>
  <a-drawer v-model:open="drawerOpen" title="System Manager Settings" :width="760">
    <a-tabs size="small">
      <a-tab-pane key="settings" tab="Settings">
        <a-form class="settings-form" layout="vertical">
          <a-form-item label="Default graph view">
            <a-radio-group
              v-model:value="settingsForm.defaultGraphView"
              :options="defaultGraphViewOptions"
              option-type="button"
              button-style="solid"
            />
          </a-form-item>

          <a-form-item label="Detail panel default">
            <a-radio-group
              v-model:value="settingsForm.detailPanelDefault"
              :options="detailPanelDefaultOptions"
              option-type="button"
              button-style="solid"
            />
          </a-form-item>

          <a-form-item>
            <a-checkbox v-model:checked="settingsForm.resetSearchOnEnvironmentChange">
              Reset search when changing environment
            </a-checkbox>
          </a-form-item>

          <a-button type="primary" @click="saveSettings">Lưu settings</a-button>
        </a-form>
      </a-tab-pane>

      <a-tab-pane key="import-export" tab="Import / Export">
        <div class="import-export-actions">
          <a-button :loading="exportLoading" @click="exportTopology">
            <template #icon>
              <DownloadOutlined />
            </template>
            Export JSON
          </a-button>
          <a-button @click="importFileInput?.click()">
            <template #icon>
              <FolderOpenOutlined />
            </template>
            Chọn JSON/YAML
          </a-button>
          <input
            ref="importFileInput"
            accept=".json,.yaml,.yml,application/json,text/yaml"
            class="hidden-file-input"
            type="file"
            @change="handleImportFile"
          />
        </div>

        <a-form layout="vertical">
          <a-form-item :label="importFileName || 'Import document'">
            <a-textarea
              v-model:value="importText"
              :rows="10"
              placeholder="{ ... }"
              @change="clearImportPreview"
            />
          </a-form-item>
        </a-form>

        <div class="import-export-actions">
          <a-button type="primary" :loading="previewLoading" @click="previewImport">Preview import</a-button>
          <a-button
            danger
            :disabled="!importPreview?.valid"
            :loading="applyLoading"
            @click="applyImport"
          >
            Apply import
          </a-button>
        </div>

        <section v-if="importPreview" class="import-preview">
          <header>
            <strong>Preview</strong>
            <a-tag :color="importPreview.valid ? 'green' : 'red'">
              {{ importPreview.valid ? 'Valid' : 'Blocked' }}
            </a-tag>
          </header>

          <div class="preview-grid">
            <div v-for="row in summaryRows" :key="row.label" class="preview-card">
              <span>{{ row.label }}</span>
              <strong>{{ row.value.total }}</strong>
              <small>+{{ row.value.create }} / update {{ row.value.update }}</small>
            </div>
          </div>

          <div v-if="importPreview.issues.length" class="preview-issues">
            <a-alert
              v-for="issue in importPreview.issues"
              :key="`${issue.level}:${issue.message}`"
              :type="issue.level === 'error' ? 'error' : 'warning'"
              :message="issue.message"
              show-icon
            />
          </div>
        </section>
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
</template>

<style scoped>
.settings-form {
  max-width: 520px;
}

.import-export-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;
}

.hidden-file-input {
  display: none;
}

.import-preview {
  margin-top: 16px;
}

.import-preview header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.preview-card {
  padding: 10px;
  background: #ffffff;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
}

.preview-card span,
.preview-card small {
  display: block;
  color: #667085;
}

.preview-card strong {
  display: block;
  margin-top: 4px;
  color: #101828;
  font-size: 20px;
  line-height: 1.2;
}

.preview-issues {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}
</style>
