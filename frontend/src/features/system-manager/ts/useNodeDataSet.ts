import { message } from 'ant-design-vue'
import { computed, reactive, ref, type ComputedRef, type Ref } from 'vue'

import {
  createSystemManagerNode,
  deleteSystemManagerNode,
  loadSystemManagerHosts,
  loadSystemManagerTopology,
  updateSystemManagerNode,
  type SystemManagerHost,
} from './service'
import type { SystemEnvironment, TopologyNodeRecord } from './mockTopology'
import {
  assignForm,
  emptyNodeForm,
  listFromText,
  type NodeForm,
} from './datasetForms'
import { formatNodeConfigs, parseNodeConfigText } from './datasetConfigText'

export function useNodeDataSet(options: {
  currentEnvironment: ComputedRef<SystemEnvironment>
  expandedNodes: ComputedRef<TopologyNodeRecord[]>
  hosts: Ref<SystemManagerHost[]>
  saving: Ref<boolean>
  activate: () => void
  onSaved: (environmentKey?: SystemEnvironment) => void
}) {
  const loadingNodeBinding = ref(false)
  const nodeBindingHosts = ref<SystemManagerHost[]>([])
  const nodeForm = reactive<NodeForm>(emptyNodeForm(options.currentEnvironment.value))
  const hostOptions = computed(() => [
    { label: 'Không gắn host', value: '' },
    ...nodeBindingHosts.value.map((host) => ({
      label: `${host.name} - ${host.ip}`,
      value: host.id,
    })),
  ])

  function resetNodeForm() {
    assignForm(nodeForm, emptyNodeForm(options.currentEnvironment.value))
    nodeBindingHosts.value = options.hosts.value
  }

  function syncCurrentEnvironmentHosts(hosts = options.hosts.value) {
    if (nodeForm.environmentKey === options.currentEnvironment.value) {
      nodeBindingHosts.value = hosts
    }
  }

  function editNode(node: TopologyNodeRecord) {
    assignForm(nodeForm, {
      ...emptyNodeForm(options.currentEnvironment.value),
      originalCode: node.id,
      environmentKey: options.currentEnvironment.value,
      hostId: node.runtime.hostId ?? '',
      code: node.id,
      name: node.name,
      kind: node.kind,
      type: node.type,
      status: node.status,
      description: node.description,
      tagsText: node.tags.join(', '),
      containerName: node.runtime.containerName,
      image: node.runtime.image,
      portsText: node.runtime.ports.join(', '),
      network: node.runtime.network,
      notes: node.notes,
      positionX: node.position.x,
      positionY: node.position.y,
      configText: formatNodeConfigs(node.configs),
    })
    nodeBindingHosts.value = options.hosts.value
    options.activate()
  }

  function assignNodeBindingFields(node: TopologyNodeRecord | undefined) {
    nodeForm.hostId = node?.runtime.hostId ?? ''
    nodeForm.status = node?.status ?? 'unknown'
    nodeForm.tagsText = node?.tags.join(', ') ?? ''
    nodeForm.containerName = node?.runtime.containerName ?? ''
    nodeForm.image = node?.runtime.image ?? ''
    nodeForm.portsText = node?.runtime.ports.join(', ') ?? ''
    nodeForm.network = node?.runtime.network ?? ''
    nodeForm.configText = node ? formatNodeConfigs(node.configs) : ''
  }

  async function loadNodeBindingForEnvironment(environmentKey: SystemEnvironment) {
    loadingNodeBinding.value = true
    nodeForm.environmentKey = environmentKey

    try {
      const [nextHosts, topology] = await Promise.all([
        loadSystemManagerHosts(environmentKey),
        nodeForm.originalCode ? loadSystemManagerTopology(environmentKey) : Promise.resolve(null),
      ])

      nodeBindingHosts.value = nextHosts

      if (!nodeForm.originalCode) {
        if (nodeForm.hostId && !nextHosts.some((host) => host.id === nodeForm.hostId)) {
          nodeForm.hostId = ''
        }

        return
      }

      const node = topology?.expandedNodes.find((item) => item.id === nodeForm.originalCode)

      assignNodeBindingFields(node)
    } catch (error) {
      console.error(error)
      message.error('Không tải được runtime/config node theo environment')
    } finally {
      loadingNodeBinding.value = false
    }
  }

  function handleNodeEnvironmentChange(environmentKey: SystemEnvironment) {
    void loadNodeBindingForEnvironment(environmentKey)
  }

  async function saveNode() {
    options.saving.value = true

    try {
      const savedEnvironment = nodeForm.environmentKey
      const payload = {
        environmentKey: savedEnvironment,
        hostId: nodeForm.hostId,
        code: nodeForm.code,
        name: nodeForm.name,
        kind: nodeForm.kind,
        type: nodeForm.type,
        status: nodeForm.status,
        description: nodeForm.description,
        tags: listFromText(nodeForm.tagsText),
        containerName: nodeForm.containerName,
        image: nodeForm.image,
        ports: listFromText(nodeForm.portsText),
        network: nodeForm.network,
        notes: nodeForm.notes,
        positionX: nodeForm.positionX,
        positionY: nodeForm.positionY,
        configs: parseNodeConfigText(nodeForm.configText),
      }

      if (nodeForm.originalCode) {
        await updateSystemManagerNode(nodeForm.originalCode, payload)
      } else {
        await createSystemManagerNode(payload)
      }

      resetNodeForm()
      message.success('Đã lưu node')
      options.onSaved(options.currentEnvironment.value)
    } catch (error) {
      console.error(error)
      message.error('Không lưu được node')
    } finally {
      options.saving.value = false
    }
  }

  async function removeNode(node: TopologyNodeRecord) {
    options.saving.value = true

    try {
      await deleteSystemManagerNode(options.currentEnvironment.value, node.id)
      resetNodeForm()
      message.success('Đã xóa node')
      options.onSaved(options.currentEnvironment.value)
    } catch (error) {
      console.error(error)
      message.error('Không xóa được node')
    } finally {
      options.saving.value = false
    }
  }

  function removeCurrentNode() {
    const node = options.expandedNodes.value.find((item) => item.id === nodeForm.originalCode)

    if (node) {
      void removeNode(node)
    }
  }

  return {
    nodeForm,
    hostOptions,
    loadingNodeBinding,
    resetNodeForm,
    syncCurrentEnvironmentHosts,
    editNode,
    saveNode,
    removeCurrentNode,
    handleNodeEnvironmentChange,
  }
}
