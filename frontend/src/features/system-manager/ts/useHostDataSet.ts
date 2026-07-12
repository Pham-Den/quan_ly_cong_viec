import { message } from 'ant-design-vue'
import { reactive, ref, type ComputedRef, type Ref } from 'vue'

import {
  createSystemManagerHost,
  deleteSystemManagerHost,
  loadSystemManagerHosts,
  updateSystemManagerHost,
  type SystemManagerHost,
} from './service'
import type { SystemEnvironment } from './mockTopology'
import { assignForm, emptyHostForm, type HostForm } from './datasetForms'

export function useHostDataSet(options: {
  currentEnvironment: ComputedRef<SystemEnvironment>
  saving: Ref<boolean>
  activate: () => void
  onSaved: (environmentKey?: SystemEnvironment) => void
}) {
  const loadingHosts = ref(false)
  const hosts = ref<SystemManagerHost[]>([])
  const hostForm = reactive<HostForm>(emptyHostForm(options.currentEnvironment.value))

  function resetHostForm() {
    assignForm(hostForm, emptyHostForm(options.currentEnvironment.value))
  }

  function editHost(host: SystemManagerHost) {
    assignForm(hostForm, {
      id: host.id,
      environmentKey: options.currentEnvironment.value,
      name: host.name,
      ip: host.ip,
      description: host.description ?? '',
      sortOrder: host.sortOrder,
    })
    options.activate()
  }

  async function refreshHosts() {
    loadingHosts.value = true

    try {
      hosts.value = await loadSystemManagerHosts(options.currentEnvironment.value)
    } catch (error) {
      console.error(error)
      message.error('Không tải được host System Manager')
    } finally {
      loadingHosts.value = false
    }
  }

  async function saveHost() {
    options.saving.value = true

    try {
      const payload = {
        environmentKey: options.currentEnvironment.value,
        name: hostForm.name,
        ip: hostForm.ip,
        description: hostForm.description,
        sortOrder: hostForm.sortOrder,
      }

      if (hostForm.id) {
        await updateSystemManagerHost(hostForm.id, payload)
      } else {
        await createSystemManagerHost(payload)
      }

      resetHostForm()
      await refreshHosts()
      message.success('Đã lưu host')
      options.onSaved(options.currentEnvironment.value)
    } catch (error) {
      console.error(error)
      message.error('Không lưu được host')
    } finally {
      options.saving.value = false
    }
  }

  async function removeHost(host: SystemManagerHost) {
    options.saving.value = true

    try {
      await deleteSystemManagerHost(host.id)
      resetHostForm()
      await refreshHosts()
      message.success('Đã xóa host')
      options.onSaved(options.currentEnvironment.value)
    } catch (error) {
      console.error(error)
      message.error('Không xóa được host')
    } finally {
      options.saving.value = false
    }
  }

  function removeCurrentHost() {
    if (!hostForm.id) {
      return
    }

    void removeHost({
      id: hostForm.id,
      environmentId: '',
      name: hostForm.name,
      ip: hostForm.ip,
      description: hostForm.description ?? null,
      sortOrder: hostForm.sortOrder ?? 0,
    })
  }

  return {
    hosts,
    loadingHosts,
    hostForm,
    resetHostForm,
    editHost,
    refreshHosts,
    saveHost,
    removeCurrentHost,
  }
}
