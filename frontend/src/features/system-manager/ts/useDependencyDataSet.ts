import { message } from 'ant-design-vue'
import { reactive, ref, type ComputedRef, type Ref } from 'vue'

import {
  createSystemManagerDependency,
  deleteSystemManagerDependency,
  loadSystemManagerTopology,
  updateSystemManagerDependency,
} from './service'
import type { SystemEnvironment, TopologyEdgeRecord } from './mockTopology'
import {
  assignForm,
  emptyDependencyForm,
  type DependencyForm,
} from './datasetForms'
import {
  formatDependencyConfigs,
  parseDependencyConfigText,
} from './datasetConfigText'

export function useDependencyDataSet(options: {
  currentEnvironment: ComputedRef<SystemEnvironment>
  expandedEdges: ComputedRef<TopologyEdgeRecord[]>
  saving: Ref<boolean>
  activate: () => void
  onSaved: (environmentKey?: SystemEnvironment) => void
}) {
  const loadingDependencyBinding = ref(false)
  const dependencyForm = reactive<DependencyForm>(emptyDependencyForm(options.currentEnvironment.value))

  function resetDependencyForm() {
    assignForm(dependencyForm, emptyDependencyForm(options.currentEnvironment.value))
  }

  function editDependency(edge: TopologyEdgeRecord) {
    assignForm(dependencyForm, {
      ...emptyDependencyForm(options.currentEnvironment.value),
      originalCode: edge.id,
      environmentKey: options.currentEnvironment.value,
      code: edge.id,
      sourceCode: edge.source,
      targetCode: edge.target,
      label: edge.label,
      connectionType: edge.connectionType,
      direction: edge.direction,
      port: edge.port,
      description: edge.description,
      configText: formatDependencyConfigs(edge.configItems),
    })
    options.activate()
  }

  async function loadDependencyConfigForEnvironment(environmentKey: SystemEnvironment) {
    if (!dependencyForm.originalCode) {
      return
    }

    loadingDependencyBinding.value = true

    try {
      const topology = await loadSystemManagerTopology(environmentKey)
      const edge = topology.expandedEdges.find((item) => item.id === dependencyForm.originalCode)

      dependencyForm.configText = edge ? formatDependencyConfigs(edge.configItems) : ''
    } catch (error) {
      console.error(error)
      message.error('Không tải được config dependency theo environment')
    } finally {
      loadingDependencyBinding.value = false
    }
  }

  function handleDependencyEnvironmentChange(environmentKey: SystemEnvironment) {
    dependencyForm.environmentKey = environmentKey
    void loadDependencyConfigForEnvironment(environmentKey)
  }

  async function saveDependency() {
    const configItems = parseDependencyConfigText(dependencyForm.configText)
    const hasExistingDependency = Boolean(dependencyForm.originalCode || dependencyForm.code.trim())
    const hasSourceTarget = Boolean(dependencyForm.sourceCode && dependencyForm.targetCode)

    if (!hasExistingDependency && !hasSourceTarget) {
      message.warning('Chọn dependency có sẵn hoặc chọn Source/Target để tạo dependency mới')
      return
    }

    if (!dependencyForm.label.trim() && !configItems.length) {
      message.warning('Nhập Label hoặc ít nhất một dòng Edge config')
      return
    }

    options.saving.value = true

    try {
      const savedEnvironment = dependencyForm.environmentKey
      const payload = {
        environmentKey: savedEnvironment,
        code: dependencyForm.code,
        sourceCode: dependencyForm.sourceCode,
        targetCode: dependencyForm.targetCode,
        label: dependencyForm.label,
        connectionType: dependencyForm.connectionType,
        direction: dependencyForm.direction,
        port: dependencyForm.port,
        description: dependencyForm.description,
        sortOrder: dependencyForm.sortOrder,
        configItems,
      }

      if (dependencyForm.originalCode) {
        await updateSystemManagerDependency(dependencyForm.originalCode, payload)
      } else {
        await createSystemManagerDependency(payload)
      }

      resetDependencyForm()
      message.success('Đã lưu dependency')
      options.onSaved(options.currentEnvironment.value)
    } catch (error) {
      console.error(error)
      message.error('Không lưu được dependency')
    } finally {
      options.saving.value = false
    }
  }

  async function removeDependency(edge: TopologyEdgeRecord) {
    options.saving.value = true

    try {
      await deleteSystemManagerDependency(options.currentEnvironment.value, edge.id)
      resetDependencyForm()
      message.success('Đã xóa dependency')
      options.onSaved(options.currentEnvironment.value)
    } catch (error) {
      console.error(error)
      message.error('Không xóa được dependency')
    } finally {
      options.saving.value = false
    }
  }

  function removeCurrentDependency() {
    const edge = options.expandedEdges.value.find((item) => item.id === dependencyForm.originalCode)

    if (edge) {
      void removeDependency(edge)
    }
  }

  return {
    dependencyForm,
    loadingDependencyBinding,
    resetDependencyForm,
    editDependency,
    saveDependency,
    removeCurrentDependency,
    handleDependencyEnvironmentChange,
  }
}
