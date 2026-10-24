import type { Terminal } from '@xterm/xterm'
import { ClipboardPaste, Columns2, Copy, Eraser, Forward, Rows2, TextSelect } from 'lucide-react'
import { toast } from '../../state/toastStore'
import { useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import type { PopupMenuItem } from '../../ui/PopupMenu'
import { continueInAnotherAgentItem } from '../history/continueFromTab'
import { pasteClipboardImage } from './pasteClipboardImage'

const ICON_SIZE = 14

export interface TerminalMenuContext {
  terminal: Terminal
  tab: TerminalTab
  paneId: string
  splitRightHint: string
  splitDownHint: string
  reopen: (items: PopupMenuItem[]) => void
}

async function pasteClipboard(terminal: Terminal): Promise<void> {
  try {
    const text = await navigator.clipboard.readText()
    if (text === '') {
      await pasteClipboardImage(terminal)
      return
    }
    terminal.paste(text)
  } catch {
    toast.warning('Could not read the clipboard.')
  }
  terminal.focus()
}

function copySelection(terminal: Terminal): void {
  void navigator.clipboard.writeText(terminal.getSelection()).then(
    () => terminal.focus(),
    () => toast.warning('Could not copy the selection.')
  )
}

export function terminalMenuItems({ terminal, tab, paneId, splitRightHint, splitDownHint, reopen }: TerminalMenuContext): PopupMenuItem[] {
  const continueItem = continueInAnotherAgentItem(tab, reopen)
  const workspace = useWorkspaceStore.getState()
  return [
    { label: 'Copy', icon: <Copy size={ICON_SIZE} />, isDisabled: !terminal.hasSelection(), onSelect: () => copySelection(terminal) },
    { label: 'Paste', icon: <ClipboardPaste size={ICON_SIZE} />, hint: 'Ctrl+V', onSelect: () => void pasteClipboard(terminal) },
    { label: 'Select all', icon: <TextSelect size={ICON_SIZE} />, onSelect: () => terminal.selectAll() },
    ...(continueItem === null ? [] : [{ ...continueItem, icon: <Forward size={ICON_SIZE} />, hasSeparatorBefore: true }]),
    {
      label: 'Split right',
      icon: <Columns2 size={ICON_SIZE} />,
      hint: splitRightHint,
      hasSeparatorBefore: true,
      onSelect: () => workspace.splitPane(tab.id, paneId, 'horizontal')
    },
    { label: 'Split down', icon: <Rows2 size={ICON_SIZE} />, hint: splitDownHint, onSelect: () => workspace.splitPane(tab.id, paneId, 'vertical') },
    {
      label: 'Clear screen',
      icon: <Eraser size={ICON_SIZE} />,
      hasSeparatorBefore: true,
      onSelect: () => {
        terminal.clear()
        terminal.focus()
      }
    }
  ]
}
