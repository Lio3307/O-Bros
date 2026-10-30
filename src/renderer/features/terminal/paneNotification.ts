import { useAttentionStore } from '../../state/attentionStore'
import { useLayoutStore } from '../../state/layoutStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'

function findTabOfPane(paneId: string): TerminalTab | null {
  for (const tab of useWorkspaceStore.getState().tabs) {
    if (tab.kind === 'terminal' && paneId in tab.panes) {
      return tab
    }
  }
  return null
}

function isUserWatching(tab: TerminalTab): boolean {
  const isTabShown = useWorkspaceStore.getState().activeTabId === tab.id && useLayoutStore.getState().section === 'projects'
  return isTabShown && document.hasFocus()
}

function showSystemNotification(tab: TerminalTab, title: string, body: string): void {
  try {
    const notification = new Notification(title, { body })
    notification.onclick = () => {
      window.focus()
      useWorkspaceStore.getState().activateTab(tab.id)
      useLayoutStore.getState().showSection('projects')
    }
  } catch {
    return
  }
}

export function announceForPane(paneId: string, happened: string, detail: string): void {
  const tab = findTabOfPane(paneId)
  if (tab === null || isUserWatching(tab)) {
    return
  }
  useAttentionStore.getState().mark(tab.id)
  if (useTerminalSettingsStore.getState().notifyWhenFinished) {
    showSystemNotification(tab, `${tab.title} ${happened}`, detail)
  }
}
