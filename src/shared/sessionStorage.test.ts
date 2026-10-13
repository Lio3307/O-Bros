import { describe, expect, it } from 'vitest'
import { isOlderThanDays, summarizeSessionFiles } from './sessionStorage'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = 100 * DAY_MS

describe('isOlderThanDays', () => {
  it('treats a null limit as every session', () => {
    expect(isOlderThanDays({ sizeBytes: 1, modifiedAt: NOW }, null, NOW)).toBe(true)
  })

  it('is true only when the file is at least the given number of days old', () => {
    expect(isOlderThanDays({ sizeBytes: 1, modifiedAt: NOW - 30 * DAY_MS }, 30, NOW)).toBe(true)
    expect(isOlderThanDays({ sizeBytes: 1, modifiedAt: NOW - 29 * DAY_MS }, 30, NOW)).toBe(false)
  })
})

describe('summarizeSessionFiles', () => {
  const files = [
    { sizeBytes: 100, modifiedAt: NOW - 1 * DAY_MS },
    { sizeBytes: 200, modifiedAt: NOW - 10 * DAY_MS },
    { sizeBytes: 400, modifiedAt: NOW - 60 * DAY_MS }
  ]

  it('totals everything and reports the oldest session', () => {
    const summary = summarizeSessionFiles(files, NOW)

    expect(summary.sessionCount).toBe(3)
    expect(summary.totalBytes).toBe(700)
    expect(summary.oldestAt).toBe(NOW - 60 * DAY_MS)
  })

  it('counts sessions and bytes per age choice', () => {
    const buckets = summarizeSessionFiles(files, NOW).buckets

    expect(buckets).toEqual([
      { days: 7, sessionCount: 2, totalBytes: 600 },
      { days: 30, sessionCount: 1, totalBytes: 400 },
      { days: 90, sessionCount: 0, totalBytes: 0 },
      { days: null, sessionCount: 3, totalBytes: 700 }
    ])
  })

  it('handles no sessions', () => {
    const summary = summarizeSessionFiles([], NOW)

    expect(summary.sessionCount).toBe(0)
    expect(summary.oldestAt).toBeNull()
  })
})
