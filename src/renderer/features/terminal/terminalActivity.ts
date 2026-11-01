export const LONG_COMMAND_MS = 8000
export const QUIET_MS = 4000

export interface WatchedCommand {
  startedAt: number
  lastOutputAt: number | null
  lastCheckedAt: number | null
  tail: string
}

export function lastSignOfLife(command: WatchedCommand): number {
  return command.lastOutputAt ?? command.startedAt
}

export function isTimeToCheckIfEnded(command: WatchedCommand, now: number): boolean {
  const signOfLife = lastSignOfLife(command)
  return now - signOfLife >= QUIET_MS && command.lastCheckedAt !== signOfLife
}

export function ranLongEnoughToNotify(command: WatchedCommand): boolean {
  return lastSignOfLife(command) - command.startedAt >= LONG_COMMAND_MS
}
