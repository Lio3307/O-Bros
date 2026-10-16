import { describe, expect, it } from 'vitest'
import { parseClaudeUsage } from './claudeUsageParser'

const RESET = '2026-10-18T09:59:59.000+00:00'

describe('parseClaudeUsage', () => {
  it('reads the five hour and weekly windows', () => {
    const usage = parseClaudeUsage({
      five_hour: { utilization: 6, resets_at: RESET },
      seven_day: { utilization: 52, resets_at: RESET }
    })
    expect(usage.fiveHour?.percentUsed).toBe(6)
    expect(usage.weekly?.percentUsed).toBe(52)
  })

  it('falls back to the limits list when a window is missing', () => {
    const usage = parseClaudeUsage({
      five_hour: null,
      seven_day: null,
      limits: [
        { kind: 'session', percent: 6, resets_at: RESET },
        { kind: 'weekly_all', percent: 52, resets_at: RESET }
      ]
    })
    expect(usage.fiveHour?.percentUsed).toBe(6)
    expect(usage.weekly?.percentUsed).toBe(52)
  })

  it('returns no weekly window when nothing reports it', () => {
    expect(parseClaudeUsage({ five_hour: { utilization: 1, resets_at: RESET } }).weekly).toBeNull()
  })
})
