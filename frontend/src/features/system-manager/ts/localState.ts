import type { SystemEnvironment } from './mockTopology'

export type LocalNodePosition = {
  x: number
  y: number
}

export type SystemManagerSettings = {
  defaultGraphView: 'remember' | 'collapsed' | 'expanded'
  detailPanelDefault: 'remember' | 'open' | 'collapsed'
  resetSearchOnEnvironmentChange: boolean
}

export type SystemManagerLocalState = {
  selectedEnvironment?: SystemEnvironment
  appExpanded: boolean
  selectedNodeId: string
  selectedEdgeId: string
  activeTab: string
  detailPanelCollapsed: boolean
  nodePositions: Record<string, LocalNodePosition>
  settings: SystemManagerSettings
}

const storageKey = 'qlcv.systemManager.localState.v1'

const defaultState: SystemManagerLocalState = {
  appExpanded: false,
  selectedNodeId: '',
  selectedEdgeId: '',
  activeTab: 'overview',
  detailPanelCollapsed: false,
  nodePositions: {},
  settings: {
    defaultGraphView: 'remember',
    detailPanelDefault: 'remember',
    resetSearchOnEnvironmentChange: true,
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeNodePositions(value: unknown) {
  if (!isRecord(value)) {
    return {}
  }

  const positions: Record<string, LocalNodePosition> = {}

  for (const [nodeId, position] of Object.entries(value)) {
    if (!isRecord(position)) {
      continue
    }

    const x = Number(position.x)
    const y = Number(position.y)

    if (Number.isFinite(x) && Number.isFinite(y)) {
      positions[nodeId] = { x, y }
    }
  }

  return positions
}

function normalizeSettings(value: unknown): SystemManagerSettings {
  if (!isRecord(value)) {
    return { ...defaultState.settings }
  }

  const defaultGraphView =
    value.defaultGraphView === 'collapsed' || value.defaultGraphView === 'expanded'
      ? value.defaultGraphView
      : defaultState.settings.defaultGraphView
  const detailPanelDefault =
    value.detailPanelDefault === 'open' || value.detailPanelDefault === 'collapsed'
      ? value.detailPanelDefault
      : defaultState.settings.detailPanelDefault

  return {
    defaultGraphView,
    detailPanelDefault,
    resetSearchOnEnvironmentChange:
      typeof value.resetSearchOnEnvironmentChange === 'boolean'
        ? value.resetSearchOnEnvironmentChange
        : defaultState.settings.resetSearchOnEnvironmentChange,
  }
}

function normalizeState(value: unknown): SystemManagerLocalState {
  if (!isRecord(value)) {
    return { ...defaultState }
  }

  return {
    selectedEnvironment: typeof value.selectedEnvironment === 'string' ? value.selectedEnvironment : undefined,
    appExpanded: typeof value.appExpanded === 'boolean' ? value.appExpanded : defaultState.appExpanded,
    selectedNodeId: typeof value.selectedNodeId === 'string' ? value.selectedNodeId : defaultState.selectedNodeId,
    selectedEdgeId: typeof value.selectedEdgeId === 'string' ? value.selectedEdgeId : defaultState.selectedEdgeId,
    activeTab: typeof value.activeTab === 'string' ? value.activeTab : defaultState.activeTab,
    detailPanelCollapsed:
      typeof value.detailPanelCollapsed === 'boolean'
        ? value.detailPanelCollapsed
        : defaultState.detailPanelCollapsed,
    nodePositions: normalizeNodePositions(value.nodePositions),
    settings: normalizeSettings(value.settings),
  }
}

export function loadSystemManagerLocalState() {
  try {
    const rawState = localStorage.getItem(storageKey)

    return normalizeState(rawState ? JSON.parse(rawState) : null)
  } catch {
    return { ...defaultState }
  }
}

export function saveSystemManagerLocalState(state: SystemManagerLocalState) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // Best effort local persistence; the UI can continue without storage.
  }

  return state
}
