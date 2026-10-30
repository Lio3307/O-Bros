import { classifyActivity, recordOutput, type TerminalActivity } from './terminalActivity'
import { appendToTail, looksLikeStillWorking, looksLikeWaitingForInput } from '../../../shared/waitingPrompt'
import { isAgentPane } from './agentStatusTracking'
import { announceForPane } from './paneNotification'
import { readTerminalText } from './terminalRegistry'

const CHECK_INTERVAL_MS = 1000
const WAITING_AFTER_QUIET_MS = 1500
const SCREEN_LINES = 15

interface WatchedTerminal {
  activity: TerminalActivity
  tail: string
}

const activities = new Map<string, WatchedTerminal>()
let checkTimer: ReturnType<typeof setInterval> | null = null

function isStillWorkingOnScreen(paneId: string): boolean {
  const screen = readTerminalText(paneId, SCREEN_LINES)
  return screen !== null && looksLikeStillWorking(screen)
}

function checkActivities(): void {
  const now = Date.now()
  for (const [paneId, watched] of activities) {
    if (isAgentPane(paneId)) {
      activities.delete(paneId)
      continue
    }
    const quietMs = now - watched.activity.lastOutputAt
    if (quietMs >= WAITING_AFTER_QUIET_MS && looksLikeWaitingForInput(watched.tail)) {
      activities.delete(paneId)
      announceForPane(paneId, 'is waiting for you', 'It asked a question and needs your answer.')
      continue
    }
    const status = classifyActivity(watched.activity, now)
    if (status === 'running' || isStillWorkingOnScreen(paneId)) {
      continue
    }
    activities.delete(paneId)
    if (status === 'finished-long-run') {
      announceForPane(paneId, 'finished', 'The terminal output has gone quiet.')
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
