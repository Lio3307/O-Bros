import { describe, expect, it } from 'vitest'
import { findTeamSessionId, isSessionFileOf, readTeamSessionRecords, taskStartOf, type TeamSessionRecord } from './teamSessions'

const RECORD: TeamSessionRecord = {
  memberId: 'team-1',
  memberName: 'reviewer',
  agentName: 'Codex',
  provider: 'codex',
  sessionId: null,
  cwd: 'C:\\dev\\app',
  startedAt: 1000,
  taskStart: taskStartOf('Review   README.md\nand report back what you find in it')
}

const MATCHING = { sessionId: 'abc', provider: 'codex' as const, projectPath: 'c:/dev/app', title: 'Review README.md and report back what', modifiedAt: 2000 }

describe('findTeamSessionId', () => {
  it('finds the member session by folder, time and the task it was given', () => {
    expect(findTeamSessionId(RECORD, [MATCHING], new Set(), true)).toBe('abc')
  })

  it('skips sessions of another folder, older sessions, other tasks and sessions already claimed', () => {
    expect(findTeamSessionId(RECORD, [{ ...MATCHING, projectPath: 'C:/dev/other' }], new Set(), true)).toBeNull()
    expect(findTeamSessionId(RECORD, [{ ...MATCHING, modifiedAt: 500 }], new Set(), true)).toBeNull()
    expect(findTeamSessionId(RECORD, [{ ...MATCHING, title: 'Fix the login bug' }], new Set(), true)).toBeNull()
    expect(findTeamSessionId(RECORD, [MATCHING], new Set(['abc']), true)).toBeNull()
  })

  it('does not guess when the member got no task', () => {
    expect(findTeamSessionId({ ...RECORD, taskStart: '' }, [MATCHING], new Set(), true)).toBeNull()
  })
})

describe('isSessionFileOf and readTeamSessionRecords', () => {
  it('matches Claude and Codex file names', () => {
    expect(isSessionFileOf('1234-abcd', '1234-abcd')).toBe(true)
    expect(isSessionFileOf('rollout-2026-10-16T08-00-00-1234-abcd', '1234-abcd')).toBe(true)
    expect(isSessionFileOf('other', '1234-abcd')).toBe(false)
  })

  it('keeps only valid records', () => {
    expect(readTeamSessionRecords([RECORD, { memberId: 1 }, null])).toEqual([RECORD])
    expect(readTeamSessionRecords('broken')).toEqual([])
  })
})
