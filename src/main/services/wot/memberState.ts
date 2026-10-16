import type { TeamMemberState } from '../../../shared/types'
import { looksLikeWaitingForInput } from '../../../shared/waitingPrompt'

export const STARTUP_MS = 5000
export const READY_QUIET_MS = 2500
export const IDLE_AFTER_QUIET_MS = 5000

export interface TerminalFacts {
  startedAt: number
  lastOutputAt: number | null
  lastInputAt: number | null
  hasExited: boolean
  isBracketedPaste: boolean
  tail: string
}

function quietSince(facts: TerminalFacts): number {
  return Math.max(facts.lastOutputAt ?? facts.startedAt, facts.lastInputAt ?? 0)
}

export function memberStateOf(facts: TerminalFacts, now: number): TeamMemberState {
  if (facts.hasExited) {
    return 'exited'
  }
  if (facts.lastOutputAt === null || now - facts.startedAt < STARTUP_MS) {
    return 'starting'
  }
  if (now - quietSince(facts) < IDLE_AFTER_QUIET_MS) {
    return 'working'
  }
  return looksLikeWaitingForInput(facts.tail) ? 'waiting' : 'idle'
}

export function isReadyForInput(facts: TerminalFacts, now: number): boolean {
  if (facts.hasExited || facts.lastOutputAt === null) {
    return false
  }
  return now - facts.startedAt >= STARTUP_MS && now - facts.lastOutputAt >= READY_QUIET_MS
}

export function isSettled(state: TeamMemberState): boolean {
  return state === 'idle' || state === 'waiting' || state === 'exited'
}
