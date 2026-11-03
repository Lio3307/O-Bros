import { describe, expect, it } from 'vitest'
import type { ActivityEntry } from '../../../shared/activity'
import { filterActivity } from './activityLogFilter'

function entry(id: string, at: number, changes: Partial<ActivityEntry>): ActivityEntry {
  return { id, at, kind: 'session', agentCommand: 'gemini', folder: null, text: 'started', detail: null, outcome: null, durationMs: null, ...changes }
}

const ENTRIES = [
  entry('old', 1, { text: 'closed after 5m', folder: 'C:\\work\\nia' }),
  entry('git', 2, { kind: 'git', text: 'tried to commit', detail: 'git commit -m fix', outcome: 'denied' }),
  entry('team', 3, { kind: 'team', agentCommand: 'codex', text: 'joined the team' })
]

function idsFor(query: string): string[] {
  return filterActivity(ENTRIES, query).map((found) => found.id)
}

describe('filterActivity', () => {
  it('puts the newest first and does not change the original list', () => {
    expect(idsFor('')).toEqual(['team', 'git', 'old'])
    expect(ENTRIES[0].id).toBe('old')
  })

  it('searches the agent, text, detail, folder and outcome, ignoring case', () => {
    expect(idsFor('CODEX')).toEqual(['team'])
    expect(idsFor('fix')).toEqual(['git'])
    expect(idsFor('nia')).toEqual(['old'])
    expect(idsFor('denied')).toEqual(['git'])
  })

  it('needs every word, and ignores spaces around them', () => {
    expect(idsFor('  commit   denied ')).toEqual(['git'])
    expect(idsFor('commit codex')).toEqual([])
  })
})
