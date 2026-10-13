import type { UsageWindow } from '../../../shared/types'

const MAX_PERCENT = 100
const MIN_PERCENT = 0
const MILLISECONDS_PER_SECOND = 1000

export function buildUsageWindow(percentUsed: unknown, resetsAtMs: number | null): UsageWindow | null {
  if (typeof percentUsed !== 'number' || !Number.isFinite(percentUsed) || resetsAtMs === null) {
    return null
  }
  const clamped = Math.min(Math.max(percentUsed, MIN_PERCENT), MAX_PERCENT)
  return { percentUsed: Math.round(clamped), resetsAt: resetsAtMs }
}

export function secondsToMilliseconds(seconds: unknown): number | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null
  }
  return seconds * MILLISECONDS_PER_SECOND
}

export function isoToMilliseconds(isoText: unknown): number | null {
  if (typeof isoText !== 'string') {
    return null
  }
  const parsed = Date.parse(isoText)
  return Number.isNaN(parsed) ? null : parsed
}
