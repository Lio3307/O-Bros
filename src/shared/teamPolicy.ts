import type { TeamMemberState } from './types'

export const IDLE_STOP_CHOICES_MINUTES = [5, 10, 30]
export const DEFAULT_IDLE_STOP_MINUTES = 10

const MINUTE_MS = 60_000
const FINISHED_STATES: TeamMemberState[] = ['idle', 'exited']

export interface TeamPolicy {
  stopIdleAfterMinutes: number | null
  stopWhenSummonerCloses: boolean
  deleteChatWhenStopped: boolean
}

export const DEFAULT_TEAM_POLICY: TeamPolicy = {
  stopIdleAfterMinutes: DEFAULT_IDLE_STOP_MINUTES,
  stopWhenSummonerCloses: true,
  deleteChatWhenStopped: false
}

export interface MemberCheck {
  state: TeamMemberState
  finishedSince: number | null
  isSummonerOpen: boolean
  now: number
}

export function isFinishedState(state: TeamMemberState): boolean {
  return FINISHED_STATES.includes(state)
}

export function autoStopReason(check: MemberCheck, policy: TeamPolicy): string | null {
  if (policy.stopWhenSummonerCloses && !check.isSummonerOpen) {
    return 'the terminal that summoned it was closed'
  }
  const minutes = policy.stopIdleAfterMinutes
  if (minutes === null || check.finishedSince === null || !isFinishedState(check.state)) {
    return null
  }
  return check.now - check.finishedSince >= minutes * MINUTE_MS ? `it finished and stayed idle for ${minutes} minutes` : null
}

export function normalizeTeamPolicy(raw: unknown): TeamPolicy {
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_TEAM_POLICY
  }
  const record = raw as Record<string, unknown>
  const minutes = record.stopIdleAfterMinutes
  const isKnownChoice = typeof minutes === 'number' && IDLE_STOP_CHOICES_MINUTES.includes(minutes)
  return {
    stopIdleAfterMinutes: minutes === null ? null : isKnownChoice ? minutes : DEFAULT_IDLE_STOP_MINUTES,
    stopWhenSummonerCloses: typeof record.stopWhenSummonerCloses === 'boolean' ? record.stopWhenSummonerCloses : true,
    deleteChatWhenStopped: record.deleteChatWhenStopped === true
  }
}
