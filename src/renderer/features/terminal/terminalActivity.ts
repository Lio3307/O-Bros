export interface TerminalActivity {
  runStartedAt: number
  lastOutputAt: number
}

export type ActivityStatus = 'running' | 'finished-long-run' | 'finished-short-run'

export const LONG_RUN_MS = 8000
export const SAME_RUN_GAP_MS = 3000
export const FINISHED_AFTER_QUIET_MS = 4000

export function recordOutput(activity: TerminalActivity | undefined, now: number): TerminalActivity {
  const isSameRun = activity !== undefined && now - activity.lastOutputAt <= SAME_RUN_GAP_MS
  return { runStartedAt: isSameRun ? activity.runStartedAt : now, lastOutputAt: now }
}

export function classifyActivity(activity: TerminalActivity, now: number): ActivityStatus {
  if (now - activity.lastOutputAt < FINISHED_AFTER_QUIET_MS) {
    return 'running'
  }
  const runDuration = activity.lastOutputAt - activity.runStartedAt
  return runDuration >= LONG_RUN_MS ? 'finished-long-run' : 'finished-short-run'
}
