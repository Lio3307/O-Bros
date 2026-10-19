import { openTerminal } from '../../state/openTerminal'
import { useTerminalFontStore } from '../../state/terminalFontStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import type { AppCommand } from './commandTypes'

function focusedTerminal() {
  const { tabs, activeTabId } = useWorkspaceStore.getState()
  const tab = tabs.find((candidate) => candidate.id === activeTabId)
  return tab !== undefined && tab.kind === 'terminal' ? tab : null
}

export const TERMINAL_COMMANDS: AppCommand[] = [
  {
    id: 'terminal.new',
    title: 'New terminal',
    group: 'Terminal',
    shortcutAction: 'newTerminal',
    run: () => openTerminal(null)
  },
  {
    id: 'terminal.splitRight',
    title: 'Split the terminal to the right',
    group: 'Terminal',
    shortcutAction: 'splitRight',
    run: () => {
      const tab = focusedTerminal()
      if (tab !== null) {
        useWorkspaceStore.getState().splitPane(tab.id, tab.focusedPaneId, 'horizontal')
      }
    }
  },
  {
    id: 'terminal.splitDown',
    title: 'Split the terminal downward',
    group: 'Terminal',
    shortcutAction: 'splitDown',
    run: () => {
      const tab = focusedTerminal()
      if (tab !== null) {
        useWorkspaceStore.getState().splitPane(tab.id, tab.focusedPaneId, 'vertical')
      }
    }
  },
  {
    id: 'terminal.closePane',
    title: 'Close the focused pane',
    group: 'Terminal',
    shortcutAction: 'closePane',
    run: () => {
      const tab = focusedTerminal()
      if (tab !== null) {
        useWorkspaceStore.getState().closePane(tab.id, tab.focusedPaneId)
      }
    }
  },
  {
    id: 'terminal.zoomIn',
    title: 'Make terminal text larger',
    group: 'Terminal',
    keywords: ['zoom', 'font', 'bigger'],
    shortcutText: 'Ctrl+=',
    run: () => useTerminalFontStore.getState().increase()
  },
  {
    id: 'terminal.zoomOut',
    title: 'Make terminal text smaller',
    group: 'Terminal',
    keywords: ['zoom', 'font'],
    shortcutText: 'Ctrl+-',
    run: () => useTerminalFontStore.getState().decrease()
  },
  {
    id: 'terminal.zoomReset',
    title: 'Reset terminal text size',
    group: 'Terminal',
    keywords: ['zoom', 'font'],
    shortcutText: 'Ctrl+0',
    run: () => useTerminalFontStore.getState().reset()
  }
]
