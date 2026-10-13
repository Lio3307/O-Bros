import { describe, expect, it } from 'vitest'
import { parseClaudeUsage } from './claudeUsageParser'
import { parseCodexUsage } from './codexUsageParser'

const RESET_ISO = '2026-10-13T12:00:00.000Z'
const RESET_UNIX_SECONDS = Date.parse(RESET_ISO) / 1000

describe('parseClaudeUsage', () => {
  it('maps the 5 hour and 7 day windows', () => {
    const usage = parseClaudeUsage({
      five_hour: { utilization: 41.4, resets_at: RESET_ISO },
      seven_day: { utilization: 6, resets_at: RESET_ISO }
    })
    expect(usage.fiveHour).toEqual({ percentUsed: 41, resetsAt: Date.parse(RESET_ISO) })
    expect(usage.weekly).toEqual({ percentUsed: 6, resetsAt: Date.parse(RESET_ISO) })
  })

  it('leaves a missing window empty', () => {
    const usage = parseClaudeUsage({ five_hour: null })
    expect(usage.fiveHour).toBeNull()
    expect(usage.weekly).toBeNull()
  })

  it('clamps percentages to 0..100', () => {
    const usage = parseClaudeUsage({ five_hour: { utilization: 140, resets_at: RESET_ISO } })
    expect(usage.fiveHour?.percentUsed).toBe(100)
  })
})

describe('parseCodexUsage', () => {
  it('classifies windows by their duration, not their position', () => {
    const usage = parseCodexUsage({
      rate_limit: {
        primary_window: { used_percent: 16, limit_window_seconds: 604800, reset_at: RESET_UNIX_SECONDS },
        secondary_window: null
      }
    })
    expect(usage.fiveHour).toBeNull()
    expect(usage.weekly).toEqual({ percentUsed: 16, resetsAt: Date.parse(RESET_ISO) })
  })

  it('reads both windows when both exist', () => {
    const usage = parseCodexUsage({
      rate_limit: {
        primary_window: { used_percent: 9, limit_window_seconds: 18000, reset_at: RESET_UNIX_SECONDS },
        secondary_window: { used_percent: 15, limit_window_seconds: 604800, reset_at: RESET_UNIX_SECONDS }
      }
    })
    expect(usage.fiveHour?.percentUsed).toBe(9)
    expect(usage.weekly?.percentUsed).toBe(15)
  })

  it('falls back to position when the duration is unknown', () => {
    const usage = parseCodexUsage({
      rate_limit: {
        primary_window: { used_percent: 3, reset_at: RESET_UNIX_SECONDS },
        secondary_window: { used_percent: 4, reset_at: RESET_UNIX_SECONDS }
      }
    })
    expect(usage.fiveHour?.percentUsed).toBe(3)
    expect(usage.weekly?.percentUsed).toBe(4)
  })

  it('is empty without a rate limit block', () => {
    expect(parseCodexUsage({}).fiveHour).toBeNull()
  })
})
