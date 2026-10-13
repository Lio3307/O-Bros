import { askToConfirm } from './confirmStore'
import { useWorkspaceStore } from './workspaceStore'

function unsavedTitles(exceptTabId: string | null): string[] {
  return useWorkspaceStore
    .getState()
    .tabs.filter((tab) => tab.kind === 'file' && tab.isModified && tab.id !== exceptTabId)
    .map((tab) => tab.title)
}

async function confirmDiscard(titles: string[]): Promise<boolean> {
  if (titles.length === 0) {
    return true
  }
  return askToConfirm({
    title: 'Close without saving?',
    message: `Unsaved changes in ${titles.join(', ')} will be lost.`,
    confirmLabel: 'Close anyway'
  })
}

export async function requestCloseTab(tabId: string): Promise<void> {
  const tab = useWorkspaceStore.getState().tabs.find((candidate) => candidate.id === tabId)
  const unsaved = tab?.kind === 'file' && tab.isModified ? [tab.title] : []
  if (await confirmDiscard(unsaved)) {
    useWorkspaceStore.getState().closeTab(tabId)
  }
}

export async function requestCloseOtherTabs(tabId: string): Promise<void> {
  if (await confirmDiscard(unsavedTitles(tabId))) {
    useWorkspaceStore.getState().closeOtherTabs(tabId)
  }
}
