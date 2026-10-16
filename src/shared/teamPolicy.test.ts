import { describe, expect, it } from 'vitest'
import { autoStopReason, DEFAULT_TEAM_POLICY, normalizeTeamPolicy } from './teamPolicy'

const MINUTE = 60_000
const NOW = 100 * MINUTE

describe('autoStopReason', () => {
  it('stops a member that finished and stayed idle long enough', () => {
    const check = { state: 'idle' as const, finishedSince: NOW - 10 * MINUTE, isSummonerOpen: true, now: NOW }
    expect(autoStopReason(check, DEFAULT_TEAM_POLICY)).toBe('it finished and stayed idle for 10 minutes')
  })

  it('keeps a member that finished only recently', () => {
    const check = { state: 'idle' as const, finishedSince: NOW - 9 * MINUTE, isSummonerOpen: true, now: NOW }
    expect(autoStopReason(check, DEFAULT_TEAM_POLICY)).toBeNull()
  })

  it('never stops a member that is working or asking a question because it was idle', () => {
    const longAgo = NOW - 60 * MINUTE
    expect(autoStopReason({ state: 'working', finishedSince: longAgo, isSummonerOpen: true, now: NOW }, DEFAULT_TEAM_POLICY)).toBeNull()
    expect(autoStopReason({ state: 'waiting', finishedSince: longAgo, isSummonerOpen: true, now: NOW }, DEFAULT_TEAM_POLICY)).toBeNull()
  })

  it('stops members when the summoning terminal closed, if the user wants that', () => {
    const check = { state: 'working' as const, finishedSince: null, isSummonerOpen: false, now: NOW }
    expect(autoStopReason(check, DEFAULT_TEAM_POLICY)).toBe('the terminal that summoned it was closed')
    expect(autoStopReason(check, { ...DEFAULT_TEAM_POLICY, stopWhenSummonerCloses: false })).toBeNull()
  })

  it('does nothing when the user turned idle stopping off', () => {
    const check = { state: 'exited' as const, finishedSince: 0, isSummonerOpen: true, now: NOW }
    expect(autoStopReason(check, { ...DEFAULT_TEAM_POLICY, stopIdleAfterMinutes: null })).toBeNull()
  })
})

describe('normalizeTeamPolicy', () => {
  it('keeps valid choices and falls back for unknown ones', () => {
    expect(normalizeTeamPolicy({ stopIdleAfterMinutes: 30, stopWhenSummonerCloses: false, deleteChatWhenStopped: true })).toEqual({
      stopIdleAfterMinutes: 30,
      stopWhenSummonerCloses: false,
      deleteChatWhenStopped: true
    })
    expect(normalizeTeamPolicy({ stopIdleAfterMinutes: null })).toEqual({ ...DEFAULT_TEAM_POLICY, stopIdleAfterMinutes: null })
    expect(normalizeTeamPolicy({ stopIdleAfterMinutes: 7 })).toEqual(DEFAULT_TEAM_POLICY)
    expect(normalizeTeamPolicy('broken')).toEqual(DEFAULT_TEAM_POLICY)
  })
})
