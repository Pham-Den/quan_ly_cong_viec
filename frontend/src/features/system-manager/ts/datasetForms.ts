import type {
  SaveSystemDependencyInput,
  SaveSystemEnvironmentInput,
  SaveSystemHostInput,
  SaveSystemNodeInput,
} from './service'
import type { SystemEnvironment } from './mockTopology'

export type EnvironmentForm = Omit<SaveSystemEnvironmentInput, 'color'> & {
  id: string
  color: string
}

export type HostForm = SaveSystemHostInput & {
  id: string
}

export type NodeForm = Omit<SaveSystemNodeInput, 'tags' | 'ports' | 'configs'> & {
  originalCode: string
  tagsText: string
  portsText: string
  configText: string
}

export type DependencyForm = Omit<SaveSystemDependencyInput, 'configItems'> & {
  originalCode: string
  configText: string
}

export const kindOptions = [
  { label: 'App', value: 'app' },
  { label: 'Component', value: 'component' },
  { label: 'Service', value: 'service' },
]

export const statusValues = ['healthy', 'warning', 'down', 'unknown', 'maintenance', 'disabled']

export const directionOptions = ['request', 'read', 'write', 'publish', 'consume', 'proxy'].map(
  (direction) => ({
    label: direction,
    value: direction,
  }),
)

export const environmentColorPresets = [
  '#475467',
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#dc2626',
]

export function emptyEnvironmentForm(): EnvironmentForm {
  return {
    id: '',
    key: '',
    name: '',
    description: '',
    color: '#2563eb',
    sortOrder: 0,
  }
}

export function emptyHostForm(environmentKey: SystemEnvironment): HostForm {
  return {
    id: '',
    environmentKey,
    name: '',
    ip: '',
    description: '',
    sortOrder: 0,
  }
}

export function emptyNodeForm(environmentKey: SystemEnvironment): NodeForm {
  return {
    originalCode: '',
    environmentKey,
    hostId: '',
    code: '',
    name: '',
    kind: 'service',
    type: 'Service',
    status: 'unknown',
    description: '',
    tagsText: '',
    containerName: '',
    image: '',
    portsText: '',
    network: '',
    notes: '',
    positionX: 120,
    positionY: 160,
    configText: '',
  }
}

export function emptyDependencyForm(environmentKey: SystemEnvironment): DependencyForm {
  return {
    originalCode: '',
    environmentKey,
    code: '',
    sourceCode: '',
    targetCode: '',
    label: '',
    connectionType: 'dependency',
    direction: 'request',
    port: '',
    description: '',
    sortOrder: 0,
    configText: '',
  }
}

export function assignForm<T extends object>(target: T, source: T) {
  Object.assign(target, source)
}

export function listFromText(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}
