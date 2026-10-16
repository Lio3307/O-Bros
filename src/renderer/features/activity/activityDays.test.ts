import { describe, expect, it } from 'vitest'
import type { ActivityEntry } from '../../../shared/activity'
import { groupActivityByDay } from './activityDays'

function entryAt(at: number, text: string): ActivityEntry {
  return { id: text, at, kind: 'session', agentCommand: 'claude', folder: null, text, detail: null, outcome: null, durationMs: null }
}

describe('groupActivityByDay', () => {
  it('puts the newest day and the newest entry first', () => {
    const now = new Date(2026, 9, 16, 15, 0).getTime()
    const days = groupActivityByDay(
      [
        entryAt(new Date(2026, 9, 14, 9, 0).getTime(), 'older'),
        entryAt(new Date(2026, 9, 16, 9, 0).getTime(), 'morning'),
        entryAt(new Date(2026, 9, 15, 23, 59).getTime(), 'last night'),
        entryAt(new Date(2026, 9, 16, 14, 0).getTime(), 'afternoon')
      ],
      now
    )
    expect(days.map((day) => day.label).slice(0, 2)).toEqual(['Today', 'Yesterday'])
    expect(days[0].entries.map((entry) => entry.text)).toEqual(['afternoon', 'morning'])
    expect(days).toHaveLength(3)
  })
})
