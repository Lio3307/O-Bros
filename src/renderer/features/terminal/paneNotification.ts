import { agentLabelOf } from '../../../shared/agentLaunchers'
import { describePaneNotice, type PaneNotice } from '../../../shared/paneNoticeText'
import { lastPathSegment } from '../../../shared/paths'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useAttentionStore } from '../../state/attentionStore'
import { useLayoutStore } from '../../state/layoutStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { useWorkspaceStore, type TerminalPaneInfo, type TerminalTab } from '../../state/workspaceStore'
import { isAgentPane } from './agentStatusTracking'
import { findTabOfPane, goToPane } from './goToPane'

function isUserWatching(tab: TerminalTab): boolean {
  const isTabShown = useWorkspaceStore.getState().activeTabId === tab.id && useLayoutStore.getState().section === 'projects'
  return isTabShown && document.hasFocus()
}


function showSystemNotification(paneId: string, title: string, body: string): void {
  try {
    const notification = new Notification(title, { body })
    notification.onclick = () => goToPane(paneId)
  } catch {
    return
  }
}

function agentLabelOfPane(pane: TerminalPaneInfo): string | null {
  return isAgentPane(pane.id) && pane.agentCommand !== null ? agentLabelOf(pane.agentCommand, useAgentLaunchersStore.getState().launchers, useAgentCatalogStore.getState().registry) : null
}

function describeForPane(tab: TerminalTab, paneId: string, notice: PaneNotice): { title: string; body: string } {
  const pane = tab.panes[paneId]
  const folderName = pane.cwd === null ? 'your home folder' : lastPathSegment(pane.cwd)
  const hasOwnTitle = !tab.isTitleFromAgent && tab.title !== folderName && !tab.title.startsWith('Home')
  const agentLabel = agentLabelOfPane(pane)
  const hasLookalikeBeside = Object.values(tab.panes).some((other) => other.id !== paneId && agentLabelOfPane(other) === agentLabel)
  return describePaneNotice(notice, { agentLabel, folderName, customTabTitle: hasOwnTitle ? tab.title : null, paneTitle: hasLookalikeBeside ? pane.title : null })
}

export function announceForPane(paneId: string, notice: PaneNotice): void {
  const tab = findTabOfPane(paneId)
  if (tab === null || isUserWatching(tab)) {
    return
  }
  useAttentionStore.getState().mark(tab.id)
  if (useTerminalSettingsStore.getState().notifyWhenFinished) {
    const { title, body } = describeForPane(tab, paneId, notice)
    showSystemNotification(paneId, title, body)
  }
}
