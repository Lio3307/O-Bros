import { useLayoutStore } from './layoutStore'
import { isTerminalTab, useWorkspaceStore, type TerminalPaneInfo } from './workspaceStore'

export function findTerminalPane(paneId: string): TerminalPaneInfo | null {
  const tab = useWorkspaceStore.getState().tabs.filter(isTerminalTab).find((candidate) => candidate.panes[paneId] !== undefined)
  return tab?.panes[paneId] ?? null
}

export function focusTerminalPane(paneId: string): boolean {
  const workspace = useWorkspaceStore.getState()
  const tab = workspace.tabs.filter(isTerminalTab).find((candidate) => candidate.panes[paneId] !== undefined)
  if (tab === undefined) {
    return false
  }
  workspace.activateTab(tab.id)
  workspace.focusPane(tab.id, paneId)
  useLayoutStore.getState().openSection('projects')
  return true
}
