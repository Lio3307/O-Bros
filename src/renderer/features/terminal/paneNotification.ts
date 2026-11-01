import { agentLabelOf } from '../../../shared/agentLaunchers'
import { describePaneNotice, type PaneNotice } from '../../../shared/paneNoticeText'
import { lastPathSegment } from '../../../shared/paths'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useAttentionStore } from '../../state/attentionStore'
import { useLayoutStore } from '../../state/layoutStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { isAgentPane } from './agentStatusTracking'

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

function describeForPane(tab: TerminalTab, paneId: string, notice: PaneNotice): { title: string; body: string } {
  const pane = tab.panes[paneId]
  const folderName = pane.cwd === null ? 'your home folder' : lastPathSegment(pane.cwd)
  const hasOwnTitle = !tab.isTitleFromAgent && tab.title !== folderName && !tab.title.startsWith('Home')
  const agentLabel = isAgentPane(paneId) && pane.agentCommand !== null ? agentLabelOf(pane.agentCommand, useAgentLaunchersStore.getState().launchers) : null
  return describePaneNotice(notice, { agentLabel, folderName, customTabTitle: hasOwnTitle ? tab.title : null })
}

export function announceForPane(paneId: string, notice: PaneNotice): void {
  const tab = findTabOfPane(paneId)
  if (tab === null || isUserWatching(tab)) {
    return
  }
  useAttentionStore.getState().mark(tab.id)
  if (useTerminalSettingsStore.getState().notifyWhenFinished) {
    const { title, body } = describeForPane(tab, paneId, notice)
    showSystemNotification(tab, title, body)
  }
}
