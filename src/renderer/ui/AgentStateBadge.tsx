import type { TeamMemberState } from '../../shared/types'
import { AGENT_STATE_LABELS, toneOfAgentState } from './agentState'
import { StatusDot } from './StatusDot'

export function AgentStateBadge({ state }: { state: TeamMemberState }) {
  const tone = toneOfAgentState(state)
  return (
    <span className={tone === 'danger' ? 'status-label status-label-danger' : 'status-label'}>
      <StatusDot tone={tone} isPulsing={state === 'working'} />
      {AGENT_STATE_LABELS[state]}
    </span>
  )
}
