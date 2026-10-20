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

  const task = firstLineOf(member.task)

  return (
    <>
      <header className="member-bar">
        <Button variant="icon" title="Back to your terminals" aria-label="Back" onClick={hideMember}>
          <ArrowLeft size={16} />
        </Button>
        <button
          type="button"
          className="member-bar-lead"
          disabled={!lead.isOpen}
          title={lead.isOpen ? `Lead: ${lead.title}. Go to its terminal.` : 'The terminal that summoned this member is closed'}
          onClick={goToLead}
        >
          {lead.command === null ? <Bot size={14} /> : <AgentIcon command={lead.command} size={14} />}
          <span>{lead.title}</span>
        </button>
        <ChevronRight size={14} className="member-bar-arrow" />
        <span className="member-bar-member" title={`Team member · ${member.agentName}`}>
          <AgentIcon command={member.command} size={14} />
          <span className="member-bar-name">{member.name}</span>
          <span className="muted">{member.agentName}</span>
        </span>
        <span className="member-bar-task" title={member.task}>
          {task === '' ? 'No task sent yet' : task}
        </span>
        <span className="member-bar-actions">
          <AgentStateBadge state={member.state} />
          <Button variant="outline" className="hover-danger" title={`Stop "${member.name}"`} onClick={() => void stopTeamMember(member)}>
            <Square size={12} /> Stop
          </Button>
        </span>
      </header>
      {member.state === 'waiting' && (
        <p className="member-hint member-hint-waiting">
          It is asking a question. The lead usually answers; you can also type the answer in the terminal below.
        </p>
      )}
      {member.state === 'exited' && (
        <p className="member-hint member-hint-exited">
          The agent program stopped. Its last screen stays below. Stop the member to close it, or ask the lead to summon it again.
        </p>
      )}
    </>
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
