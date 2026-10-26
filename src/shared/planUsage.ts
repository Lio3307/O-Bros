import { isRecord } from './isRecord'
import type { UsageWindow } from './types'

export type PlanUsageId = 'grok' | 'clinepass'

export interface PlanWindow {
  label: string
  window: UsageWindow
}

export interface PlanUsage {
  id: PlanUsageId
  name: string
  logoCommand: string
  plan: string | null
  windows: PlanWindow[]
  errorMessage: string | null
}

export interface PlanReading {
  plan: string | null
  windows: PlanWindow[]
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const FIVE_HOUR_LIMIT_MS = 6 * HOUR_MS
const WEEK_LIMIT_MS = 8 * DAY_MS
const FIVE_HOUR_LABEL = '5h'
const WEEK_LABEL = 'wk'
const MONTH_LABEL = 'mo'
const CLINEPASS_LABELS: Record<string, string> = { five_hour: FIVE_HOUR_LABEL, weekly: WEEK_LABEL, monthly: MONTH_LABEL }
const WINDOW_ORDER = [FIVE_HOUR_LABEL, WEEK_LABEL, MONTH_LABEL]

function percentOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.min(100, Math.max(0, value))) : null
}

function timeOf(value: unknown): number | null {
  if (typeof value !== 'string' || value === '') {
    return null
  }
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : null
}

function amountOf(value: unknown): number | null {
  return isRecord(value) && typeof value.val === 'number' && Number.isFinite(value.val) ? value.val : null
}

function labelForPeriod(periodMs: number | null): string {
  if (periodMs === null || periodMs <= 0) {
    return WEEK_LABEL
  }
  if (periodMs <= FIVE_HOUR_LIMIT_MS) {
    return FIVE_HOUR_LABEL
  }
  return periodMs <= WEEK_LIMIT_MS ? WEEK_LABEL : MONTH_LABEL
}

export function grokPlanName(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null
  }
  const letters = raw.toLowerCase().split('').filter((character) => character >= 'a' && character <= 'z').join('')
  if (letters.includes('heavy')) {
    return 'SuperGrok Heavy'
  }
  return letters.includes('supergrok') ? 'SuperGrok' : raw.trim()
}

function grokPercent(config: Record<string, unknown>): number | null {
  const reported = percentOf(config.creditUsagePercent)
  if (reported !== null) {
    return reported
  }
  const cap = amountOf(config.onDemandCap)
  const used = amountOf(config.onDemandUsed)
  return cap === null || cap <= 0 || used === null ? null : percentOf((used / cap) * 100)
}

export function parseGrokBilling(raw: unknown): PlanReading | null {
  if (!isRecord(raw) || !isRecord(raw.config)) {
    return null
  }
  const config = raw.config
  const currentPeriod = isRecord(config.currentPeriod) ? config.currentPeriod : {}
  const currentEnd = timeOf(currentPeriod.end)
  const resetsAt = currentEnd ?? timeOf(config.billingPeriodEnd)
  const startsAt = currentEnd === null ? timeOf(config.billingPeriodStart) : timeOf(currentPeriod.start)
  const percentUsed = grokPercent(config)
  const plan = grokPlanName(config.subscriptionTier ?? raw.subscriptionTier)
  if (percentUsed === null || resetsAt === null) {
    return { plan, windows: [] }
  }
  const periodMs = startsAt === null ? null : resetsAt - startsAt
  return { plan, windows: [{ label: labelForPeriod(periodMs), window: { percentUsed, resetsAt } }] }
}

function clinePassWindow(limit: unknown): PlanWindow[] {
  if (!isRecord(limit) || typeof limit.type !== 'string') {
    return []
  }
  const label = CLINEPASS_LABELS[limit.type] as string | undefined
  const percentUsed = percentOf(limit.percentUsed)
  const resetsAt = timeOf(limit.resetsAt)
  return label === undefined || percentUsed === null || resetsAt === null ? [] : [{ label, window: { percentUsed, resetsAt } }]
}

export function parseClinePassLimits(raw: unknown): PlanWindow[] | null {
  if (!isRecord(raw) || raw.success !== true || !isRecord(raw.data) || !Array.isArray(raw.data.limits)) {
    return null
  }
  return raw.data.limits
    .flatMap(clinePassWindow)
    .sort((first, second) => WINDOW_ORDER.indexOf(first.label) - WINDOW_ORDER.indexOf(second.label))
}
