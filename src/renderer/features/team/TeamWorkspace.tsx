import { Bot, ChevronRight, Square } from 'lucide-react'
import { accountToRef } from '../../../shared/accounts'
import { providerOfCommand } from '../../../shared/agentLaunchers'
import type { AccountRef, TeamMember } from '../../../shared/types'
import { selectActiveAccount, useAccountsStore } from '../../state/accountsStore'
import { focusTerminalPane } from '../../state/focusTerminalPane'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { useTeamStore } from '../../state/teamStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { Button } from '../../ui/Button'
import { TerminalView } from '../terminal/TerminalView'
import { stopTeamMember } from './stopTeamMember'
import { firstLineOf, leadOf } from './teamMemberText'
import { AgentStateBadge } from '../../ui/AgentStateBadge'
import './team.css'

function accountFor(command: string): AccountRef | null {
  const provider = providerOfCommand(command)
  return provider === null ? null : accountToRef(selectActiveAccount(useAccountsStore.getState(), provider))
}

function MemberHeader({ member }: { member: TeamMember }) {
  useWorkspaceStore((state) => state.tabs)
  const lead = leadOf(member)

  return (
    <header className="team-header">
      <div className="team-flow">
        <button
          type="button"
          className="team-flow-lead"
          disabled={!lead.isOpen}
          title={lead.isOpen ? "Go to the lead's terminal" : 'The terminal that summoned this member is closed'}
          onClick={() => void focusTerminalPane(lead.paneId)}
        >
          {lead.command === null ? <Bot size={16} /> : <AgentIcon command={lead.command} size={16} />}
          <span className="team-flow-text">
            <span className="team-flow-role">Lead</span>
            <span className="team-flow-name">{lead.title}</span>
          </span>
        </button>
        <ChevronRight size={16} className="team-flow-arrow" />
        <span className="team-flow-member">
          <AgentIcon command={member.command} size={16} />
          <span className="team-flow-text">
            <span className="team-flow-role">Team member · {member.agentName}</span>
            <span className="team-flow-name">{member.name}</span>
          </span>
        </span>
        <span className="team-state-pill">
          <AgentStateBadge state={member.state} />
        </span>
        <Button variant="outline" className="hover-danger" title={`Stop "${member.name}"`} onClick={() => stopTeamMember(member)}>
          <Square size={12} /> Stop
        </Button>
      </div>
      <p className="team-task" title={member.task}>
        <span className="team-task-label">Task</span>
        {firstLineOf(member.task)}
      </p>
      {member.state === 'waiting' && (
        <p className="team-waiting-hint">
          It is asking a question. The lead usually answers; you can also type the answer in the terminal below.
        </p>
      )}
    </header>
  )
}

export function TeamWorkspace({ isVisible }: { isVisible: boolean }) {
  const members = useTeamStore((state) => state.members)
  const selectedMemberId = useTeamStore((state) => state.selectedMemberId)

  return (
    <div className={isVisible ? 'workspace' : 'workspace workspace-hidden'}>
      <div className="workspace-content">
        {members.length === 0 && (
          <div className="empty-state team-empty-main">
            <p className="team-empty-title">No team members right now</p>
            <p className="muted">
              You talk to one agent, the lead. When you ask it to bring in another agent, that agent joins as a team member:
              the lead gives it a task, reads its answer and stops it when it is done. Each member shows up here with its
              live terminal, and on the left under the lead that summoned it.
            </p>
          </div>
        )}
        {members.map((member) => {
          const isSelected = member.id === selectedMemberId
          return (
            <div key={member.id} className={isSelected ? 'tab-content team-frame' : 'tab-content tab-content-hidden team-frame'}>
              <MemberHeader member={member} />
              <div className="team-terminal">
                <TerminalView
                  paneId={member.id}
                  cwd={member.cwd}
                  account={accountFor(member.command)}
                  startCommand={member.command}
                  startsAgent
                  isVisible={isVisible && isSelected}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
