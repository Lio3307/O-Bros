import { Cpu, MemoryStick, Timer } from 'lucide-react'
import type { LiveAgent } from '../../../../shared/activity'
import { groupAgentsByFolder } from '../../../../shared/activityStats'
import { formatBytes, formatPercent } from '../../../../shared/format'
import { lastPathSegment } from '../../../../shared/paths'
import { formatShortDuration } from '../../../../shared/time'
import { findTerminalPane, focusTerminalPane } from '../../../state/focusTerminalPane'
import { useResourcesStore } from '../../../state/resourcesStore'
import { useTeamStore } from '../../../state/teamStore'
import { useWorkspaceStore } from '../../../state/workspaceStore'
import { AgentName } from '../../../ui/AgentName'
import { AgentStateBadge } from '../../../ui/AgentStateBadge'
import { useAgentLabel } from '../../../ui/useAgentLabel'
import { useNow } from '../../../ui/useNow'
import { openTeamMember } from '../../team/openTeamMember'
import { leadOf } from '../../team/teamMemberText'

const TICK_MS = 1000

function openAgent(agent: LiveAgent): void {
  const member = useTeamStore.getState().members.find((candidate) => candidate.id === agent.paneId)
  if (member !== undefined) {
    openTeamMember(member)
    return
  }
  focusTerminalPane(agent.paneId)
}

function folderName(folder: string | null): string {
  return folder === null ? 'Home' : lastPathSegment(folder)
}

function folderHint(folder: string | null): string {
  return `${folder ?? 'Home'}. This is where the terminal started; a later cd is not followed.`
}

function LiveAgentCard({ agent, now, showsFolder }: { agent: LiveAgent; now: number; showsFolder: boolean }) {
  const agentLabel = useAgentLabel()
  useWorkspaceStore((state) => state.tabs)
  const member = useTeamStore((state) => state.members.find((candidate) => candidate.id === agent.paneId))
  const usage = useResourcesStore((state) => state.snapshot?.terminals.find((terminal) => terminal.paneId === agent.paneId))
  const role = member === undefined ? findTerminalPane(agent.paneId)?.title ?? 'Terminal' : `Team member "${member.name}"`
  const origin = member === undefined ? null : `Summoned by ${leadOf(member).title}`
  const originParts = [origin, showsFolder ? folderName(agent.cwd) : null].filter((part) => part !== null)

  return (
    <button type="button" className={`live-card live-card-${agent.state}`} onClick={() => openAgent(agent)}>
      <span className="live-card-head">
        <AgentName command={agent.agentCommand} size={18} isStrong />
        <AgentStateBadge state={agent.state} />
      </span>
      <span className="live-card-role">{role}</span>
      {originParts.length > 0 && (
        <span className="muted live-card-origin" title={showsFolder ? folderHint(agent.cwd) : undefined}>
          {originParts.join(' · ')}
        </span>
      )}
      {agent.alsoRunning.length > 0 && (
        <span className="muted live-card-origin">Also in this terminal: {agent.alsoRunning.map(agentLabel).join(', ')}</span>
      )}
      <span className="live-card-numbers">
        <span title="Running for">
          <Timer size={12} /> {formatShortDuration(now - agent.startedAt)}
        </span>
        <span title="Processor use of this terminal">
          <Cpu size={12} /> {usage === undefined ? '–' : formatPercent(usage.cpuPercent)}
        </span>
        <span title="Memory of this terminal and everything it started">
          <MemoryStick size={12} /> {usage === undefined ? '–' : formatBytes(usage.privateBytes)}
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
  const groups = groupAgentsByFolder(agents)
  if (groups.length === 1) {
    return (
      <div className="live-cards">
        {agents.map((agent) => (
          <LiveAgentCard key={agent.paneId} agent={agent} now={now} showsFolder />
        ))}
      </div>
    )
  }
  return (
    <div className="live-folders">
      {groups.map(({ folder, agents: agentsInFolder }) => (
        <section key={folder ?? 'home'} className="live-folder">
          <h3 className="live-folder-title" title={folderHint(folder)}>
            {folderName(folder)} <span className="muted">{agentsInFolder.length}</span>
          </h3>
          <div className="live-cards">
            {agentsInFolder.map((agent) => (
              <LiveAgentCard key={agent.paneId} agent={agent} now={now} showsFolder={false} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
