import type { ShortcutAction } from '../../../shared/shortcuts'
import { useLayoutStore } from '../../state/layoutStore'
import { openTerminal } from '../../state/openTerminal'
import { requestClosePane } from '../../state/requestCloseTab'
import { useWorkspaceStore } from '../../state/workspaceStore'

function focusedTerminal() {
  const { tabs, activeTabId } = useWorkspaceStore.getState()
  const tab = tabs.find((candidate) => candidate.id === activeTabId)
  return tab !== undefined && tab.kind === 'terminal' ? tab : null
}

export const SHORTCUT_ACTIONS: Record<ShortcutAction, () => void> = {
  splitRight: () => {
    const tab = focusedTerminal()
    if (tab !== null) {
      useWorkspaceStore.getState().splitPane(tab.id, tab.focusedPaneId, 'horizontal')
    }
  },
  splitDown: () => {
    const tab = focusedTerminal()
    if (tab !== null) {
      useWorkspaceStore.getState().splitPane(tab.id, tab.focusedPaneId, 'vertical')
    }
  },
  closePane: () => {
    const tab = focusedTerminal()
    if (tab !== null) {
      void requestClosePane(tab.id, tab.focusedPaneId)
    }
  },
  newTerminal: () => openTerminal(null),
  openCommandPalette: () => useLayoutStore.getState().openCommandPalette()
}
