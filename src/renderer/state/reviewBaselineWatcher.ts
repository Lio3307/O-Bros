import { useReviewStore } from './reviewStore'
import { isTerminalTab, useWorkspaceStore } from './workspaceStore'

export function startReviewBaselines(): () => void {
  const seenTabIds = new Set<string>()

  function syncWithTabs(): void {
    const terminalTabs = useWorkspaceStore.getState().tabs.filter(isTerminalTab)
    const openIds = new Set(terminalTabs.map((tab) => tab.id))

    for (const tab of terminalTabs) {
      if (!seenTabIds.has(tab.id) && tab.cwd !== null) {
        seenTabIds.add(tab.id)
        void useReviewStore.getState().capture(tab.id, tab.cwd)
      }
    }
    for (const tabId of seenTabIds) {
      if (!openIds.has(tabId)) {
        seenTabIds.delete(tabId)
        useReviewStore.getState().forget(tabId)
      }
    }
  }

  syncWithTabs()
  return useWorkspaceStore.subscribe(syncWithTabs)
}
