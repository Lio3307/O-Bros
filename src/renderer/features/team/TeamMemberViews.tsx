import { ArrowLeft, Bot, ChevronRight, Square } from 'lucide-react'
import { accountToRef } from '../../../shared/accounts'
import { providerOfCommand } from '../../../shared/agentLaunchers'
import type { AccountRef, TeamMember } from '../../../shared/types'
import { selectActiveAccount, useAccountsStore } from '../../state/accountsStore'
import { focusTerminalPane } from '../../state/focusTerminalPane'
import { useTeamStore } from '../../state/teamStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { AgentStateBadge } from '../../ui/AgentStateBadge'
import { Button } from '../../ui/Button'
import { TerminalView } from '../terminal/TerminalView'
import { stopTeamMember } from './stopTeamMember'
import { firstLineOf, leadOf } from './teamMemberText'
import './team.css'

function accountFor(command: string): AccountRef | null {
  const provider = providerOfCommand(command)
  return provider === null ? null : accountToRef(selectActiveAccount(useAccountsStore.getState(), provider))
}

function MemberHeader({ member }: { member: TeamMember }) {
  useWorkspaceStore((state) => state.tabs)
  const hideMember = useTeamStore((state) => state.hideMember)
  const lead = leadOf(member)

  function goToLead(): void {
    hideMember()
    void focusTerminalPane(lead.paneId)
  }

  return (
    <header className="team-header">
      <div className="team-flow">
        <Button variant="outline" title="Back to the terminals" onClick={hideMember}>
          <ArrowLeft size={14} /> Back
        </Button>
        <button
          type="button"
          className="team-flow-lead"
          disabled={!lead.isOpen}
          title={lead.isOpen ? "Go to the lead's terminal" : 'The terminal that summoned this member is closed'}
          onClick={goToLead}
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
        <Button variant="outline" className="hover-danger" title={`Stop "${member.name}"`} onClick={() => void stopTeamMember(member)}>
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
      {member.state === 'exited' && (
        <p className="team-waiting-hint">
          The agent program stopped. Its last screen stays below. Stop the member to close it, or ask the lead to summon it again.
        </p>
      )}
    </header>
  )
}

export function TeamMemberViews({ isVisible }: { isVisible: boolean }) {
  const members = useTeamStore((state) => state.members)
  const shownMemberId = useTeamStore((state) => state.shownMemberId)

  return (
    <>
      {members.map((member) => {
        const isShown = member.id === shownMemberId
        return (
          <div key={member.id} className={isShown ? 'tab-content team-frame' : 'tab-content tab-content-hidden team-frame'}>
            <MemberHeader member={member} />
            <div className="team-terminal">
              <TerminalView
                paneId={member.id}
                cwd={member.cwd}
                account={accountFor(member.command)}
                startCommand={member.command}
                startsAgent
                isVisible={isVisible && isShown}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
