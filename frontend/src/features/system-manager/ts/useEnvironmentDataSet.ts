import { message } from 'ant-design-vue'
import { reactive, type Ref } from 'vue'

import { normalizeEnvironmentColor } from './environmentColor'
import {
  createSystemManagerEnvironment,
  deleteSystemManagerEnvironment,
  updateSystemManagerEnvironment,
  type SystemManagerEnvironment,
} from './service'
import type { SystemEnvironment } from './mockTopology'
import {
  assignForm,
  emptyEnvironmentForm,
  type EnvironmentForm,
} from './datasetForms'

export function useEnvironmentDataSet(options: {
  saving: Ref<boolean>
  activate: () => void
  onSaved: (environmentKey?: SystemEnvironment) => void
}) {
  const environmentForm = reactive<EnvironmentForm>(emptyEnvironmentForm())

  function resetEnvironmentForm() {
    assignForm(environmentForm, emptyEnvironmentForm())
  }

  function editEnvironment(environment: SystemManagerEnvironment) {
    assignForm(environmentForm, {
      id: environment.id,
      key: environment.key,
      name: environment.label,
      description: environment.description ?? '',
      color: normalizeEnvironmentColor(environment.color, environment.key),
      sortOrder: environment.sortOrder ?? 0,
    })
    options.activate()
  }

  async function saveEnvironment() {
    options.saving.value = true

    try {
      const payload = {
        key: environmentForm.key,
        name: environmentForm.name,
        description: environmentForm.description,
        color: environmentForm.color,
        sortOrder: environmentForm.sortOrder,
      }
      const saved = environmentForm.id
        ? await updateSystemManagerEnvironment(environmentForm.id, payload)
        : await createSystemManagerEnvironment(payload)

      resetEnvironmentForm()
      message.success('Đã lưu environment')
      options.onSaved(saved.key)
    } catch (error) {
      console.error(error)
      message.error('Không lưu được environment')
    } finally {
      options.saving.value = false
    }
  }

  async function removeEnvironment(environment: SystemManagerEnvironment) {
    options.saving.value = true

    try {
      await deleteSystemManagerEnvironment(environment.id)
      resetEnvironmentForm()
      message.success('Đã xóa environment')
      options.onSaved()
    } catch (error) {
      console.error(error)
      message.error('Không xóa được environment')
    } finally {
      options.saving.value = false
    }
  }

  function removeCurrentEnvironment() {
    if (!environmentForm.id) {
      return
    }

    void removeEnvironment({
      id: environmentForm.id,
      key: environmentForm.key,
      label: environmentForm.name,
      description: environmentForm.description ?? null,
      color: environmentForm.color,
      sortOrder: environmentForm.sortOrder,
    })
  }

  return {
    environmentForm,
    resetEnvironmentForm,
    editEnvironment,
    saveEnvironment,
    removeCurrentEnvironment,
  }
}
