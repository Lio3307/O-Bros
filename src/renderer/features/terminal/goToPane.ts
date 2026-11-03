import { useLayoutStore } from '../../state/layoutStore'
import { isTerminalTab, useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'

export function findTabOfPane(paneId: string): TerminalTab | null {
  return useWorkspaceStore.getState().tabs.filter(isTerminalTab).find((tab) => paneId in tab.panes) ?? null
}

export function goToPane(paneId: string): void {
  window.focus()
  const tab = findTabOfPane(paneId)
  if (tab !== null) {
    useWorkspaceStore.getState().focusPane(tab.id, paneId)
    useWorkspaceStore.getState().activateTab(tab.id)
    useLayoutStore.getState().showSection('projects')
  }
}
