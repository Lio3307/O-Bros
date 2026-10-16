import type { AccountUsage, UsageWindow } from './types'

export interface KnownUsage extends AccountUsage {
  measuredAt: number | null
  isStale: boolean
}

function stillValid(window: UsageWindow | null, now: number): UsageWindow | null {
  return window !== null && window.resetsAt > now ? window : null
}

function hasNumbers(usage: AccountUsage): boolean {
  return usage.fiveHour !== null || usage.weekly !== null
}

export function mergeUsage(previous: KnownUsage | undefined, next: AccountUsage, now: number): KnownUsage {
  if (hasNumbers(next) || previous === undefined || !hasNumbers(previous)) {
    return { ...next, measuredAt: hasNumbers(next) ? now : null, isStale: false }
  }
  const fiveHour = stillValid(previous.fiveHour, now)
  const weekly = stillValid(previous.weekly, now)
  if (fiveHour === null && weekly === null) {
    return { ...next, measuredAt: null, isStale: false }
  }
  return { fiveHour, weekly, errorMessage: next.errorMessage, measuredAt: previous.measuredAt, isStale: true }
}
