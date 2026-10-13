import type { AccountUsage, UsageWindow } from '../../../shared/types'
import { buildUsageWindow, secondsToMilliseconds } from './usageWindow'

interface CodexWindowPayload {
  used_percent?: number
  limit_window_seconds?: number
  reset_at?: number
}

export interface CodexUsagePayload {
  rate_limit?: {
    primary_window?: CodexWindowPayload | null
    secondary_window?: CodexWindowPayload | null
  } | null
}

type WindowKind = 'five-hour' | 'weekly' | 'unknown'

const FIVE_HOURS_SECONDS = 5 * 60 * 60
const WEEK_SECONDS = 7 * 24 * 60 * 60
const DURATION_TOLERANCE_SECONDS = 120

function classifyByDuration(payload: CodexWindowPayload): WindowKind {
  const seconds = payload.limit_window_seconds
  if (typeof seconds !== 'number') {
    return 'unknown'
  }
  if (Math.abs(seconds - FIVE_HOURS_SECONDS) <= DURATION_TOLERANCE_SECONDS) {
    return 'five-hour'
  }
  if (Math.abs(seconds - WEEK_SECONDS) <= DURATION_TOLERANCE_SECONDS) {
    return 'weekly'
  }
  return 'unknown'
}

function toWindow(payload: CodexWindowPayload): UsageWindow | null {
  return buildUsageWindow(payload.used_percent, secondsToMilliseconds(payload.reset_at))
}

export function parseCodexUsage(payload: CodexUsagePayload): AccountUsage {
  const primary = payload.rate_limit?.primary_window ?? null
  const secondary = payload.rate_limit?.secondary_window ?? null
  const usage: AccountUsage = { fiveHour: null, weekly: null, errorMessage: null }

  for (const candidate of [primary, secondary]) {
    if (candidate === null) {
      continue
    }
    const kind = classifyByDuration(candidate)
    if (kind === 'five-hour' && usage.fiveHour === null) {
      usage.fiveHour = toWindow(candidate)
    } else if (kind === 'weekly' && usage.weekly === null) {
      usage.weekly = toWindow(candidate)
    }
  }

  if (usage.fiveHour === null && primary !== null && classifyByDuration(primary) === 'unknown') {
    usage.fiveHour = toWindow(primary)
  }
  if (usage.weekly === null && secondary !== null && classifyByDuration(secondary) === 'unknown') {
    usage.weekly = toWindow(secondary)
  }

  return usage
}
