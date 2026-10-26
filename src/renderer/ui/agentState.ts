import type { TeamMemberState } from '../../shared/types'
import type { StatusTone } from './StatusDot'

export const AGENT_STATE_LABELS: Record<TeamMemberState, string> = {
  starting: 'Starting',
  working: 'Working',
  idle: 'Finished its turn',
  waiting: 'Waiting for an answer',
  exited: 'Stopped'
}

const TONE_BY_STATE: Record<TeamMemberState, StatusTone> = {
  starting: 'neutral',
  working: 'warning',
  idle: 'success',
  waiting: 'info',
  exited: 'neutral'
}

export function toneOfAgentState(state: TeamMemberState): StatusTone {
  return TONE_BY_STATE[state]
}
