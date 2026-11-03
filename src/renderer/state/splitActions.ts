import { DEFAULT_SPLIT_RATIO, type SplitDirection } from '../features/terminal/paneTree'
import { dropPartner, splitFromDrop, type DropSide, type WorkspaceSplit } from '../features/terminal/workspaceSplit'
import { openTerminal } from './openTerminal'
import { useWorkspaceStore } from './workspaceStore'

export function areBothTerminals(firstTabId: string | null, secondTabId: string | null): boolean {
  const isTerminal = (tabId: string | null) => useWorkspaceStore.getState().tabs.some((tab) => tab.id === tabId && tab.kind === 'terminal')
  return isTerminal(firstTabId) && isTerminal(secondTabId)
}

function showTogether(split: WorkspaceSplit, keptTabId: string, movedTabId: string): void {
  const workspace = useWorkspaceStore.getState()
  if (areBothTerminals(keptTabId, movedTabId)) {
    workspace.joinTabs(keptTabId, movedTabId, split)
    return
  }
  workspace.showSplit(split, movedTabId)
}

function showBeside(previousTabId: string | null, tabId: string | null, direction: SplitDirection): void {
  if (previousTabId !== null && tabId !== null && previousTabId !== tabId) {
    showTogether({ first: previousTabId, second: tabId, direction, ratio: DEFAULT_SPLIT_RATIO }, previousTabId, tabId)
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
  showTogether(splitFromDrop(side, draggedTabId, partner), partner, draggedTabId)
}
