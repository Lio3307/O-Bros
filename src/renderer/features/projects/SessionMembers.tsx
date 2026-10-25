import { Square } from 'lucide-react'
import { useState } from 'react'
import { formatAge } from '../../../shared/time'
import type { TeamMember } from '../../../shared/types'
import { useTeamStore } from '../../state/teamStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { AGENT_STATE_LABELS, toneOfAgentState } from '../../ui/agentState'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { StatusDot } from '../../ui/StatusDot'
import { openTeamMember } from '../team/openTeamMember'
import { stopTeamMember } from '../team/stopTeamMember'
import { firstLineOf } from '../team/teamMemberText'
import { ShowMoreToggle } from './ShowMoreToggle'
import './projects.css'

const VISIBLE_MEMBERS = 3

function MemberStateMark({ member }: { member: TeamMember }) {
  if (member.state === 'working' || member.state === 'starting') {
    return <Spinner size={12} />
  }
  return <StatusDot tone={toneOfAgentState(member.state)} />
}

interface MemberRowProps {
  member: TeamMember
  now: number
  onOpened?: () => void
}

function MemberRow({ member, now, onOpened }: MemberRowProps) {
  const isShown = useTeamStore((state) => state.shownMemberId === member.id)
  const task = firstLineOf(member.task)
  const rowClassName = ['row', 'session-member-row', isShown ? 'row-selected' : '', member.state === 'waiting' ? 'session-member-waiting' : '']
    .filter((name) => name !== '')
    .join(' ')

  return (
    <div className="session-member">
      <button
        type="button"
        className={rowClassName}
        title={`${member.name} (${member.agentName}) · ${AGENT_STATE_LABELS[member.state]}${task === '' ? '' : ` · ${task}`}`}
        onClick={() => {
          openTeamMember(member)
          onOpened?.()
        }}
      >
        <MemberStateMark member={member} />
        <AgentIcon command={member.command} size={14} />
        <span className="row-name">{member.name}</span>
        <span className="muted session-member-age">
          {member.state === 'waiting' ? 'asking' : member.state === 'exited' ? 'exited' : formatAge(member.createdAt, now)}
        </span>
      </button>
      <Button variant="icon" className="hover-danger session-member-stop" title={`Stop "${member.name}"`} onClick={() => void stopTeamMember(member)}>
        <Square size={11} />
      </Button>
    </div>
  )
}

interface SessionMembersProps {
  members: TeamMember[]
  now: number
  visibleCount?: number
  onMemberOpened?: () => void
}

export function SessionMembers({ members, now, visibleCount = VISIBLE_MEMBERS, onMemberOpened }: SessionMembersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  if (members.length === 0) {
    return null
  }
  const shown = isExpanded ? members : members.slice(0, visibleCount)
  const hiddenCount = members.length - shown.length

  return (
    <div className="session-members" aria-label="Team members summoned here">
      {shown.map((member) => (
        <MemberRow key={member.id} member={member} now={now} onOpened={onMemberOpened} />
      ))}
      <ShowMoreToggle hiddenCount={hiddenCount} canShowFewer={isExpanded && members.length > visibleCount} onChange={setIsExpanded} />
    </div>
  )
}
