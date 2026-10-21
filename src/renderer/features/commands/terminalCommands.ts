import { useTerminalFontStore } from '../../state/terminalFontStore'
import { SHORTCUT_ACTIONS } from '../terminal/shortcutActions'
import type { AppCommand } from './commandTypes'

export const TERMINAL_COMMANDS: AppCommand[] = [
  {
    id: 'terminal.new',
    title: 'New terminal',
    group: 'Terminal',
    shortcutAction: 'newTerminal',
    run: SHORTCUT_ACTIONS.newTerminal
  },
  {
    id: 'terminal.splitRight',
    title: 'Split the terminal to the right',
    group: 'Terminal',
    shortcutAction: 'splitRight',
    run: SHORTCUT_ACTIONS.splitRight
  },
  {
    id: 'terminal.splitDown',
    title: 'Split the terminal downward',
    group: 'Terminal',
    shortcutAction: 'splitDown',
    run: SHORTCUT_ACTIONS.splitDown
  },
  {
    id: 'terminal.closePane',
    title: 'Close the focused pane',
    group: 'Terminal',
    shortcutAction: 'closePane',
    run: SHORTCUT_ACTIONS.closePane
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
