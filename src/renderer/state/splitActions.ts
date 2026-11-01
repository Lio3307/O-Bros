import { DEFAULT_SPLIT_RATIO, type SplitDirection } from '../features/terminal/paneTree'
import { dropPartner, splitFromDrop, type DropSide } from '../features/terminal/workspaceSplit'
import { openTerminal } from './openTerminal'
import { useWorkspaceStore } from './workspaceStore'

function showBeside(previousTabId: string | null, tabId: string | null, direction: SplitDirection): void {
  if (previousTabId !== null && tabId !== null && previousTabId !== tabId) {
    useWorkspaceStore.getState().showSplit({ first: previousTabId, second: tabId, direction, ratio: DEFAULT_SPLIT_RATIO }, tabId)
  }
}

export function openTabBeside(tabId: string, direction: SplitDirection): void {
  showBeside(useWorkspaceStore.getState().activeTabId, tabId, direction)
}

export function openFileBeside(filePath: string): void {
  const workspace = useWorkspaceStore.getState()
  const previousTabId = workspace.activeTabId
  const hadSplit = workspace.split !== null
  workspace.openFileTab(filePath)
  if (!hadSplit) {
    showBeside(previousTabId, useWorkspaceStore.getState().activeTabId, 'horizontal')
  }
}

export function openTerminalBeside(direction: SplitDirection): void {
  const previousTabId = useWorkspaceStore.getState().activeTabId
  openTerminal(null)
  showBeside(previousTabId, useWorkspaceStore.getState().activeTabId, direction)
}

export function dropTabOnSide(draggedTabId: string, side: DropSide): void {
  const workspace = useWorkspaceStore.getState()
  const partner = dropPartner(workspace.split, workspace.activeTabId, draggedTabId)
  if (side === 'center' || partner === null) {
    workspace.activateTab(draggedTabId)
    return
  }
  workspace.showSplit(splitFromDrop(side, draggedTabId, partner), draggedTabId)
}
