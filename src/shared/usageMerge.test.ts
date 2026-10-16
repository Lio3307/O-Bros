import { describe, expect, it } from 'vitest'
import { mergeUsage, type KnownUsage } from './usageMerge'

const HOUR = 3_600_000
const NOW = 1_000 * HOUR

const GOOD: KnownUsage = {
  fiveHour: { percentUsed: 57, resetsAt: NOW + HOUR },
  weekly: { percentUsed: 66, resetsAt: NOW + 72 * HOUR },
  errorMessage: null,
  measuredAt: NOW - 5 * 60_000,
  isStale: false
}

const FAILED = { fiveHour: null, weekly: null, errorMessage: 'The usage service answered with status 429.' }

describe('mergeUsage', () => {
  it('uses fresh numbers when the request worked', () => {
    const next = { fiveHour: { percentUsed: 60, resetsAt: NOW + HOUR }, weekly: null, errorMessage: null }
    expect(mergeUsage(GOOD, next, NOW)).toEqual({ ...next, measuredAt: NOW, isStale: false })
  })

  it('keeps the last known numbers when a refresh fails, marked as stale', () => {
    expect(mergeUsage(GOOD, FAILED, NOW)).toEqual({
      fiveHour: GOOD.fiveHour,
      weekly: GOOD.weekly,
      errorMessage: FAILED.errorMessage,
      measuredAt: GOOD.measuredAt,
      isStale: true
    })
  })

  it('drops a remembered window once its reset time has passed', () => {
    const merged = mergeUsage(GOOD, FAILED, NOW + 2 * HOUR)
    expect(merged.fiveHour).toBeNull()
    expect(merged.weekly).toEqual(GOOD.weekly)
  })

  it('shows the failure when nothing was ever measured', () => {
    expect(mergeUsage(undefined, FAILED, NOW)).toEqual({ ...FAILED, measuredAt: null, isStale: false })
  })
})
