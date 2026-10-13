import { describe, expect, it } from 'vitest'
import { describeCompactWindow, listUsageWindows, nearestReset } from './usageText'

const NOW = 1_000_000_000_000
const HOUR = 3_600_000
const MINUTE = 60_000

describe('describeCompactWindow', () => {
  it('splits the percent from the time left', () => {
    const window = { percentUsed: 54, resetsAt: NOW + HOUR + 37 * MINUTE }
    expect(describeCompactWindow(window, NOW)).toEqual({ percent: '54%', remaining: '1h 37m' })
  })

  it('drops a zero unit like "5d" instead of "5d 0h"', () => {
    const window = { percentUsed: 17, resetsAt: NOW + 5 * 24 * HOUR }
    expect(describeCompactWindow(window, NOW).remaining).toBe('5d')
  })
})

describe('listUsageWindows', () => {
  it('keeps only the windows that exist, in 5h then weekly order', () => {
    const usage = {
      fiveHour: null,
      weekly: { percentUsed: 16, resetsAt: NOW + 5 * HOUR },
      errorMessage: null
    }
    expect(listUsageWindows(usage)).toEqual([{ label: 'wk', window: usage.weekly }])
  })

  it('is empty when usage is unknown', () => {
    expect(listUsageWindows(undefined)).toEqual([])
  })
})

describe('nearestReset', () => {
  it('picks the window that resets first', () => {
    const soon = { percentUsed: 41, resetsAt: NOW + 2 * HOUR }
    const later = { percentUsed: 6, resetsAt: NOW + 48 * HOUR }
    expect(nearestReset([{ label: 'wk', window: later }, { label: '5h', window: soon }])).toEqual(soon)
  })

  it('is null without windows', () => {
    expect(nearestReset([])).toBeNull()
  })
})
