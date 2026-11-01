import { isSubmit } from '../../../shared/agentStatus'
import { appendToTail, looksLikeStillWorking, looksLikeWaitingForInput } from '../../../shared/waitingPrompt'
import { isAgentPane } from './agentStatusTracking'
import { announceForPane } from './paneNotification'
import { isTimeToCheckIfEnded, lastSignOfLife, ranLongEnoughToNotify, type WatchedCommand } from './terminalActivity'
import { readTerminalText } from './terminalRegistry'

const CHECK_INTERVAL_MS = 1000
const WAITING_AFTER_QUIET_MS = 1500
const SCREEN_LINES = 15
const CTRL_C = '\u0003'

const commands = new Map<string, WatchedCommand>()
let checkTimer: ReturnType<typeof setInterval> | null = null

function isStillWorkingOnScreen(paneId: string): boolean {
  const screen = readTerminalText(paneId, SCREEN_LINES)
  return screen !== null && looksLikeStillWorking(screen)
}

async function announceIfEnded(paneId: string, command: WatchedCommand): Promise<void> {
  const signOfLife = lastSignOfLife(command)
  command.lastCheckedAt = signOfLife
  const tasks = await window.api.app.listRunningTasks().catch(() => null)
  const isOutdated = commands.get(paneId) !== command || lastSignOfLife(command) !== signOfLife
  if (isOutdated || tasks === null || tasks.some((task) => task.paneId === paneId)) {
    return
  }
  commands.delete(paneId)
  if (ranLongEnoughToNotify(command)) {
    announceForPane(paneId, 'finished')
  }
}

function checkCommands(): void {
  const now = Date.now()
  for (const [paneId, command] of commands) {
    if (isAgentPane(paneId)) {
      commands.delete(paneId)
    } else if (now - lastSignOfLife(command) >= WAITING_AFTER_QUIET_MS && looksLikeWaitingForInput(command.tail)) {
      commands.delete(paneId)
      announceForPane(paneId, 'asking')
    } else if (isTimeToCheckIfEnded(command, now) && !isStillWorkingOnScreen(paneId)) {
      void announceIfEnded(paneId, command)
    }
  }
  if (commands.size === 0 && checkTimer !== null) {
    clearInterval(checkTimer)
    checkTimer = null
  }
}

export function noteCommandStarted(paneId: string): void {
  commands.set(paneId, { startedAt: Date.now(), lastOutputAt: null, lastCheckedAt: null, tail: '' })
  checkTimer ??= setInterval(checkCommands, CHECK_INTERVAL_MS)
}

export function noteTerminalInput(paneId: string, data: string): void {
  if (data.includes(CTRL_C)) {
    commands.delete(paneId)
  } else if (isSubmit(data)) {
    noteCommandStarted(paneId)
  }
}

export function noteTerminalOutput(paneId: string, chunk: string): void {
  const command = commands.get(paneId)
  if (command !== undefined) {
    command.lastOutputAt = Date.now()
    command.tail = appendToTail(command.tail, chunk)
  }
}

export function forgetTerminalActivity(paneId: string): void {
  commands.delete(paneId)
}
