import type { Terminal } from '@xterm/xterm'
import { useCallback, useState, type MouseEvent, type RefObject } from 'react'
import { useShortcutLabel } from '../../state/shortcutsStore'
import { isTerminalTab, useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import type { PopupMenuItem } from '../../ui/PopupMenu'
import { terminalMenuItems } from './terminalContextMenu'

const RIGHT_BUTTON = 2

interface OpenContextMenu {
  x: number
  y: number
  items: PopupMenuItem[]
}

function tabOfPane(paneId: string): TerminalTab | undefined {
  return useWorkspaceStore.getState().tabs.find((candidate): candidate is TerminalTab => isTerminalTab(candidate) && paneId in candidate.panes)
}

export function useTerminalContextMenu(terminalRef: RefObject<Terminal | null>, paneId: string) {
  const [contextMenu, setContextMenu] = useState<OpenContextMenu | null>(null)
  const closeContextMenu = useCallback(() => setContextMenu(null), [])
  const splitRightHint = useShortcutLabel('splitRight')
  const splitDownHint = useShortcutLabel('splitDown')

  function keepRightButtonFromTerminal(event: MouseEvent): void {
    if (event.button === RIGHT_BUTTON) {
      event.stopPropagation()
    }
  }

  function openContextMenu(event: MouseEvent): void {
    event.preventDefault()
    event.stopPropagation()
    const terminal = terminalRef.current
    const tab = tabOfPane(paneId)
    if (terminal === null || tab === undefined) {
      return
    }
    useWorkspaceStore.getState().focusPane(tab.id, paneId)
    const position = { x: event.clientX, y: event.clientY }
    const show = (items: PopupMenuItem[]): void => setContextMenu({ ...position, items })
    show(terminalMenuItems({ terminal, tab, paneId, splitRightHint, splitDownHint, reopen: show }))
  }

  const menuHandlers = {
    onMouseDownCapture: keepRightButtonFromTerminal,
    onMouseUpCapture: keepRightButtonFromTerminal,
    onContextMenuCapture: openContextMenu
  }

  return { contextMenu, closeContextMenu, menuHandlers }
}
