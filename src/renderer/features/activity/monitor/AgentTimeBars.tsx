import type { AgentTime } from '../../../../shared/activityStats'
import { formatShortDuration } from '../../../../shared/time'
import { AgentName } from '../../../ui/AgentName'
import { Card } from '../../../ui/Card'

export function AgentTimeBars({ agents }: { agents: AgentTime[] }) {
  const longest = Math.max(...agents.map((agent) => agent.timeMs), 1)

  return (
    <Card title="Time per agent today">
      {agents.length === 0 && <p className="monitor-empty">No agent has run today.</p>}
      <div className="agent-bars">
        {agents.map((agent) => (
          <div key={agent.agentCommand} className="agent-bar-row">
            <AgentName command={agent.agentCommand} />
            <span className="agent-bar-track">
              <span className="agent-bar-fill" style={{ width: `${(agent.timeMs / longest) * 100}%` }} />
            </span>
            <span className="agent-bar-value">{formatShortDuration(agent.timeMs)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
