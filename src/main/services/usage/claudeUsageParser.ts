import type { AccountUsage } from '../../../shared/types'
import { buildUsageWindow, isoToMilliseconds } from './usageWindow'

interface ClaudeWindowPayload {
  utilization?: number
  resets_at?: string
}

export interface ClaudeUsagePayload {
  five_hour?: ClaudeWindowPayload | null
  seven_day?: ClaudeWindowPayload | null
}

function toWindow(payload: ClaudeWindowPayload | null | undefined) {
  if (!payload) {
    return null
  }
  return buildUsageWindow(payload.utilization, isoToMilliseconds(payload.resets_at))
}

export function parseClaudeUsage(payload: ClaudeUsagePayload): AccountUsage {
  return {
    fiveHour: toWindow(payload.five_hour),
    weekly: toWindow(payload.seven_day),
    errorMessage: null
  }
}
