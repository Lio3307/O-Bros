import { useLayoutStore } from '../../state/layoutStore'
import { useWorkspaceStore } from '../../state/workspaceStore'

export function goToPane(paneId: string): void {
  window.focus()
  const tab = useWorkspaceStore.getState().tabs.find((candidate) => candidate.kind === 'terminal' && paneId in candidate.panes)
  if (tab !== undefined) {
    useWorkspaceStore.getState().focusPane(tab.id, paneId)
    useWorkspaceStore.getState().activateTab(tab.id)
    useLayoutStore.getState().showSection('projects')
  }
}
