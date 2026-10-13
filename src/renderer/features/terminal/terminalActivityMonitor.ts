import { useAttentionStore } from '../../state/attentionStore'
import { useLayoutStore } from '../../state/layoutStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { classifyActivity, recordOutput, type TerminalActivity } from './terminalActivity'

const CHECK_INTERVAL_MS = 1000

const activities = new Map<string, TerminalActivity>()
let checkTimer: ReturnType<typeof setInterval> | null = null

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

function showSystemNotification(tab: TerminalTab, paneTitle: string): void {
  try {
    const notification = new Notification(`${paneTitle} finished`, { body: 'The terminal output has gone quiet.' })
    notification.onclick = () => {
      window.focus()
      useWorkspaceStore.getState().activateTab(tab.id)
      useLayoutStore.getState().showSection('projects')
    }
  } catch {
    return
  }
}

function announceFinished(paneId: string): void {
  const tab = findTabOfPane(paneId)
  if (tab === null || isUserWatching(tab)) {
    return
  }
  useAttentionStore.getState().mark(tab.id)
  if (useTerminalSettingsStore.getState().notifyWhenFinished) {
    showSystemNotification(tab, tab.panes[paneId].title)
  }
}

function checkActivities(): void {
  const now = Date.now()
  for (const [paneId, activity] of activities) {
    const status = classifyActivity(activity, now)
    if (status === 'running') {
      continue
    }
    activities.delete(paneId)
    if (status === 'finished-long-run') {
      announceFinished(paneId)
    }
  }
  if (activities.size === 0 && checkTimer !== null) {
    clearInterval(checkTimer)
    checkTimer = null
  }
}

export function noteTerminalOutput(paneId: string): void {
  activities.set(paneId, recordOutput(activities.get(paneId), Date.now()))
  if (checkTimer === null) {
    checkTimer = setInterval(checkActivities, CHECK_INTERVAL_MS)
  }
}

export function forgetTerminalActivity(paneId: string): void {
  activities.delete(paneId)
}
