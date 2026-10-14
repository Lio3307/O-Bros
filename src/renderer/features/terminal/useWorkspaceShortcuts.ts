import { useEffect } from 'react'
import { findShortcutAction, type ShortcutAction } from '../../../shared/shortcuts'
import { useLayoutStore } from '../../state/layoutStore'
import { openTerminal } from '../../state/openTerminal'
import { useShortcutsStore } from '../../state/shortcutsStore'
import { useWorkspaceStore } from '../../state/workspaceStore'

function focusedTerminal() {
  const { tabs, activeTabId } = useWorkspaceStore.getState()
  const tab = tabs.find((candidate) => candidate.id === activeTabId)
  return tab !== undefined && tab.kind === 'terminal' ? tab : null
}

const RUN_ACTION: Record<ShortcutAction, () => void> = {
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
      useWorkspaceStore.getState().closePane(tab.id, tab.focusedPaneId)
    }
  },
  newTerminal: () => openTerminal(null),
  openPrompts: () => useLayoutStore.getState().openPromptPicker(),
  openCommandPalette: () => useLayoutStore.getState().openCommandPalette()
}

export function useWorkspaceShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const { shortcuts, isRecording } = useShortcutsStore.getState()
      if (isRecording) {
        return
      }
      const action = findShortcutAction(shortcuts, event)
      if (action === null) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      if (event.repeat) {
        return
      }
      RUN_ACTION[action]()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])
}
