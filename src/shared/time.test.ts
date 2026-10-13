import { describe, expect, it } from 'vitest'
import { formatAge, formatResetsIn, groupByDay, dayRangeFromInput } from './time'

const NOW = new Date(2026, 9, 13, 12, 0, 0).getTime()
const HOUR = 3_600_000
const MINUTE = 60_000
const DAY = 24 * HOUR

describe('formatResetsIn', () => {
  it('shows hours and minutes under a day', () => {
    expect(formatResetsIn(NOW + 4 * HOUR + 29 * MINUTE, NOW)).toBe('4h 29m')
  })

  it('shows days and hours from a day up', () => {
    expect(formatResetsIn(NOW + 5 * DAY + 9 * HOUR, NOW)).toBe('5d 9h')
  })

  it('drops a unit that is exactly zero', () => {
    expect(formatResetsIn(NOW + 5 * DAY, NOW)).toBe('5d')
    expect(formatResetsIn(NOW + 2 * HOUR, NOW)).toBe('2h')
  })

  it('never goes negative', () => {
    expect(formatResetsIn(NOW - HOUR, NOW)).toBe('0m')
  })
})

describe('formatAge', () => {
  it('uses the largest whole unit', () => {
    expect(formatAge(NOW - 3 * MINUTE, NOW)).toBe('3m ago')
    expect(formatAge(NOW - 2 * HOUR, NOW)).toBe('2h ago')
    expect(formatAge(NOW - 2 * DAY, NOW)).toBe('2d ago')
  })
})

describe('groupByDay', () => {
  it('groups by calendar day', () => {
    expect(groupByDay(NOW - HOUR, NOW)).toBe('Today')
    expect(groupByDay(NOW - 15 * HOUR, NOW)).toBe('Yesterday')
    expect(groupByDay(NOW - 3 * DAY, NOW)).toBe('Earlier')
  })
})

describe('dayRangeFromInput', () => {
  it('covers one local calendar day', () => {
    const range = dayRangeFromInput('2026-03-05')
    expect(range?.start).toBe(new Date(2026, 2, 5).getTime())
    expect(range?.end).toBe(new Date(2026, 2, 6).getTime())
  })

  it('rejects text that is not a real date', () => {
    expect(dayRangeFromInput('')).toBeNull()
    expect(dayRangeFromInput('2026-02-31')).toBeNull()
    expect(dayRangeFromInput('hello')).toBeNull()
  })
})
