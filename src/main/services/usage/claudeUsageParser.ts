import type { AccountUsage, UsageWindow } from '../../../shared/types'
import { buildUsageWindow, isoToMilliseconds } from './usageWindow'

interface ClaudeWindowPayload {
  utilization?: number
  resets_at?: string
}

interface ClaudeLimitPayload {
  kind?: string
  percent?: number
  resets_at?: string
}

export interface ClaudeUsagePayload {
  five_hour?: ClaudeWindowPayload | null
  seven_day?: ClaudeWindowPayload | null
  limits?: ClaudeLimitPayload[] | null
}

const SESSION_LIMIT_KIND = 'session'
const WEEKLY_LIMIT_KIND = 'weekly_all'

function toWindow(payload: ClaudeWindowPayload | null | undefined): UsageWindow | null {
  if (!payload) {
    return null
  }
  return buildUsageWindow(payload.utilization, isoToMilliseconds(payload.resets_at))
}

function windowFromLimits(limits: ClaudeLimitPayload[] | null | undefined, kind: string): UsageWindow | null {
  const limit = limits?.find((candidate) => candidate.kind === kind)
  if (limit === undefined) {
    return null
  }
  return buildUsageWindow(limit.percent, isoToMilliseconds(limit.resets_at))
}

export function parseClaudeUsage(payload: ClaudeUsagePayload): AccountUsage {
  return {
    fiveHour: toWindow(payload.five_hour) ?? windowFromLimits(payload.limits, SESSION_LIMIT_KIND),
    weekly: toWindow(payload.seven_day) ?? windowFromLimits(payload.limits, WEEKLY_LIMIT_KIND),
    errorMessage: null
  }
}
