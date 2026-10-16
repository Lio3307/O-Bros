import { Cpu, MemoryStick, Timer } from 'lucide-react'
import type { LiveAgent } from '../../../../shared/activity'
import { formatBytes, formatPercent } from '../../../../shared/format'
import { lastPathSegment } from '../../../../shared/paths'
import { formatShortDuration } from '../../../../shared/time'
import { findTerminalPane, focusTerminalPane } from '../../../state/focusTerminalPane'
import { useLayoutStore } from '../../../state/layoutStore'
import { useResourcesStore } from '../../../state/resourcesStore'
import { useTeamStore } from '../../../state/teamStore'
import { useWorkspaceStore } from '../../../state/workspaceStore'
import { AgentName } from '../../../ui/AgentName'
import { AgentStateBadge } from '../../../ui/AgentStateBadge'
import { useNow } from '../../../ui/useNow'
import { leadOf } from '../../team/teamMemberText'

const TICK_MS = 1000

function openAgent(agent: LiveAgent): void {
  if (agent.isTeamMember) {
    useTeamStore.getState().select(agent.paneId)
    useLayoutStore.getState().openSection('team')
    return
  }
  focusTerminalPane(agent.paneId)
}

function LiveAgentCard({ agent, now }: { agent: LiveAgent; now: number }) {
  useWorkspaceStore((state) => state.tabs)
  const member = useTeamStore((state) => state.members.find((candidate) => candidate.id === agent.paneId))
  const usage = useResourcesStore((state) => state.snapshot?.terminals.find((terminal) => terminal.paneId === agent.paneId))
  const role = member === undefined ? findTerminalPane(agent.paneId)?.title ?? 'Terminal' : `Team member "${member.name}"`
  const origin = member === undefined ? null : `Summoned by ${leadOf(member).title}`

  return (
    <button type="button" className={`live-card live-card-${agent.state}`} onClick={() => openAgent(agent)}>
      <span className="live-card-head">
        <AgentName command={agent.agentCommand} size={18} isStrong />
        <AgentStateBadge state={agent.state} />
      </span>
      <span className="live-card-role">{role}</span>
      <span className="muted live-card-origin">
        {origin === null ? '' : `${origin} · `}
        {agent.cwd === null ? 'Home' : lastPathSegment(agent.cwd)}
      </span>
      <span className="live-card-numbers">
        <span title="Running for">
          <Timer size={12} /> {formatShortDuration(now - agent.startedAt)}
        </span>
        <span title="Processor use of this terminal">
          <Cpu size={12} /> {usage === undefined ? '–' : formatPercent(usage.cpuPercent)}
        </span>
        <span title="Memory of this terminal and everything it started">
          <MemoryStick size={12} /> {usage === undefined ? '–' : formatBytes(usage.workingSetBytes)}
        </span>
      </span>
    </button>
  )
}

export function LiveAgentCards({ agents }: { agents: LiveAgent[] }) {
  const now = useNow(TICK_MS)
  if (agents.length === 0) {
    return <p className="monitor-empty">No agent is running right now. Start one from Projects and it shows up here.</p>
  }
  return (
    <div className="live-cards">
      {agents.map((agent) => (
        <LiveAgentCard key={agent.paneId} agent={agent} now={now} />
      ))}
    </div>
  )
}
