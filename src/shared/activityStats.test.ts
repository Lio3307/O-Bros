import { describe, expect, it } from 'vitest'
import type { ActivityEntry, LiveAgent } from './activity'
import { activityByHour, describeActivity, sumOfHours, summarizeToday, timeByAgent } from './activityStats'

const NOW = new Date(2026, 9, 16, 15, 0).getTime()
const MINUTE = 60_000

function entry(changes: Partial<ActivityEntry>): ActivityEntry {
  return {
    id: String(Math.random()),
    at: new Date(2026, 9, 16, 9, 30).getTime(),
    kind: 'session',
    agentCommand: 'claude',
    folder: null,
    text: 'started',
    detail: null,
    outcome: null,
    durationMs: null,
    ...changes
  }
}

const ENTRIES = [
  entry({}),
  entry({ at: new Date(2026, 9, 16, 10, 0).getTime(), text: 'closed after 30m', durationMs: 30 * MINUTE }),
  entry({ at: new Date(2026, 9, 16, 11, 0).getTime(), kind: 'git', outcome: 'allowed' }),
  entry({ at: new Date(2026, 9, 16, 11, 5).getTime(), kind: 'git', outcome: 'denied' }),
  entry({ at: new Date(2026, 9, 16, 12, 0).getTime(), kind: 'team', agentCommand: 'codex', text: 'joined the team as "a"' }),
  entry({ at: new Date(2026, 9, 16, 12, 3).getTime(), kind: 'team', agentCommand: 'codex', text: 'left the team ("a")', durationMs: 3 * MINUTE }),
  entry({ at: new Date(2026, 9, 15, 12, 0).getTime(), durationMs: 600 * MINUTE, text: 'closed after 10h' })
]

const LIVE: LiveAgent[] = [
  { paneId: 'p', agentCommand: 'codex --session-id x', cwd: null, startedAt: NOW - 20 * MINUTE, state: 'working', isTeamMember: true }
]

describe('activity stats', () => {
  it('sums today only, including agents that still run', () => {
    expect(summarizeToday(ENTRIES, LIVE, NOW)).toEqual({
      agentTimeMs: 53 * MINUTE,
      sessionCount: 1,
      gitAllowed: 1,
      gitDenied: 1,
      teamJoined: 1
    })
  })

  it('counts what happened in each hour of today, the same way as the day totals', () => {
    const hours = activityByHour(ENTRIES, NOW)
    expect(hours).toHaveLength(24)
    expect(hours[9]).toEqual({ sessions: 1, gitActions: 0, teamMembers: 0 })
    expect(hours[10]).toEqual({ sessions: 0, gitActions: 0, teamMembers: 0 })
    expect(hours[11]).toEqual({ sessions: 0, gitActions: 2, teamMembers: 0 })
    expect(hours[12]).toEqual({ sessions: 0, gitActions: 0, teamMembers: 1 })
    expect(sumOfHours(hours)).toEqual({ sessions: 1, gitActions: 2, teamMembers: 1 })
  })

  it('describes an hour in plain words', () => {
    expect(describeActivity({ sessions: 1, gitActions: 2, teamMembers: 0 })).toBe('1 agent session started, 2 git actions')
    expect(describeActivity({ sessions: 0, gitActions: 0, teamMembers: 3 })).toBe('3 team members summoned')
    expect(describeActivity({ sessions: 0, gitActions: 0, teamMembers: 0 })).toBe('nothing happened')
  })

  it('ranks agents by time and merges commands of the same program', () => {
    expect(timeByAgent(ENTRIES, LIVE, NOW).map((agent) => [agent.agentCommand, agent.timeMs])).toEqual([
      ['claude', 30 * MINUTE],
      ['codex', 23 * MINUTE]
    ])
  })
})
