import { ArrowUpRight, Bot, Square } from 'lucide-react'
import type { TeamMember } from '../../../shared/types'
import { focusTerminalPane } from '../../state/focusTerminalPane'
import { useLayoutStore } from '../../state/layoutStore'
import { useTeamStore } from '../../state/teamStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { Button } from '../../ui/Button'
import { PanelHeader } from '../../ui/PanelHeader'
import { stopTeamMember } from './stopTeamMember'
import { exampleAgentName, useInstalledTeamAgents } from './useInstalledTeamAgents'
import { groupByLead, type TeamGroup } from './teamMemberText'
import { AGENT_STATE_LABELS, toneOfAgentState } from '../../ui/agentState'
import { StatusDot } from '../../ui/StatusDot'
import './team.css'

function EmptyTeam() {
  const openSection = useLayoutStore((state) => state.openSection)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)
  const agents = useInstalledTeamAgents()

  function openSetup(): void {
    selectSettingsPage('team')
    openSection('settings')
  }

  return (
    <div className="panel-empty team-empty">
      <p>No team members yet.</p>
      <p>
        In the terminal of an agent that has wot, ask it to bring in another agent installed on this computer, for
        example &quot;ask {exampleAgentName(agents, 1)} to review this file&quot;. That agent becomes the lead, and the
        agents it summons show up here under it.
      </p>
      <Button variant="link" onClick={openSetup}>
        Set up the wot skill
      </Button>
    </div>
  )
}

function MemberRow({ member }: { member: TeamMember }) {
  const selectedMemberId = useTeamStore((state) => state.selectedMemberId)
  const select = useTeamStore((state) => state.select)
  const showSection = useLayoutStore((state) => state.showSection)

  return (
    <div className="team-member">
      <button
        type="button"
        className={member.id === selectedMemberId ? 'row team-member-row row-selected' : 'row team-member-row'}
        onClick={() => {
          select(member.id)
          showSection('team')
        }}
      >
        <StatusDot tone={toneOfAgentState(member.state)} isPulsing={member.state === 'working'} />
        <AgentIcon command={member.command} size={16} />
        <span className="team-member-text">
          <span className="team-member-name">{member.name}</span>
          <span className="muted">
            {member.agentName} · {AGENT_STATE_LABELS[member.state]}
          </span>
        </span>
      </button>
      <Button variant="icon" className="hover-danger" title={`Stop "${member.name}"`} onClick={() => stopTeamMember(member)}>
        <Square size={12} />
      </Button>
    </div>
  )
}

function LeadGroup({ group }: { group: TeamGroup }) {
  const { lead, members } = group
  const memberCount = members.length === 1 ? '1 member' : `${members.length} members`

  return (
    <section className="team-group">
      <div className="team-lead-row" title="The agent that summoned these members. You talk to it; it talks to them.">
        {lead.command === null ? <Bot size={16} /> : <AgentIcon command={lead.command} size={16} />}
        <span className="team-member-text">
          <span className="team-member-name">{lead.title}</span>
          <span className="muted">Lead · {memberCount}</span>
        </span>
        {lead.isOpen && (
          <Button variant="icon" className="hover-positive" title="Go to the lead's terminal" onClick={() => void focusTerminalPane(lead.paneId)}>
            <ArrowUpRight size={14} />
          </Button>
        )}
      </div>
      <div className="team-group-members">
        {members.map((member) => (
          <MemberRow key={member.id} member={member} />
        ))}
      </div>
    </section>
  )
}

export function TeamPanel() {
  const members = useTeamStore((state) => state.members)
  useWorkspaceStore((state) => state.tabs)

  return (
    <div className="panel-content">
      <PanelHeader title="Team" />
      {members.length === 0 && <EmptyTeam />}
      {groupByLead(members).map((group) => (
        <LeadGroup key={group.lead.paneId} group={group} />
      ))}
    </div>
  )
}
