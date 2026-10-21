import { useAttentionStore } from '../../state/attentionStore'
import { useLayoutStore } from '../../state/layoutStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { classifyActivity, recordOutput, type TerminalActivity } from './terminalActivity'
import { appendToTail, looksLikeWaitingForInput } from '../../../shared/waitingPrompt'

const CHECK_INTERVAL_MS = 1000
const WAITING_AFTER_QUIET_MS = 1500

interface WatchedTerminal {
  activity: TerminalActivity
  tail: string
}

const activities = new Map<string, WatchedTerminal>()
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

function announce(paneId: string, happened: string, detail: string): void {
  const tab = findTabOfPane(paneId)
  if (tab === null || isUserWatching(tab)) {
    return
  }
  useAttentionStore.getState().mark(tab.id)
  if (useTerminalSettingsStore.getState().notifyWhenFinished) {
    showSystemNotification(tab, `${tab.panes[paneId].title} ${happened}`, detail)
  }
}

function checkActivities(): void {
  const now = Date.now()
  for (const [paneId, watched] of activities) {
    const quietMs = now - watched.activity.lastOutputAt
    if (quietMs >= WAITING_AFTER_QUIET_MS && looksLikeWaitingForInput(watched.tail)) {
      activities.delete(paneId)
      announce(paneId, 'is waiting for you', 'It asked a question and needs your answer.')
      continue
    }
    const status = classifyActivity(watched.activity, now)
    if (status === 'running') {
      continue
    }
    activities.delete(paneId)
    if (status === 'finished-long-run') {
      announce(paneId, 'finished', 'The terminal output has gone quiet.')
    }
  }
  if (activities.size === 0 && checkTimer !== null) {
    clearInterval(checkTimer)
    checkTimer = null
  }
}

export function noteTerminalOutput(paneId: string, chunk: string): void {
  const previous = activities.get(paneId)
  activities.set(paneId, {
    activity: recordOutput(previous?.activity, Date.now()),
    tail: appendToTail(previous?.tail ?? '', chunk)
  })
  if (checkTimer === null) {
    checkTimer = setInterval(checkActivities, CHECK_INTERVAL_MS)
  }
}

export function forgetTerminalActivity(paneId: string): void {
  activities.delete(paneId)
}
