import { ChevronDown, UsersRound } from 'lucide-react'
import { useCallback, useState, type MouseEvent } from 'react'
import { membersOfTab, useTeamStore } from '../../state/teamStore'
import type { TerminalTab } from '../../state/workspaceStore'
import { cn } from '../../ui/cn'
import { FloatingPanel } from '../../ui/FloatingPanel'
import { Spinner } from '../../ui/Spinner'
import { useNow } from '../../ui/useNow'
import { SessionMembers } from '../projects/SessionMembers'
import { TerminalTabIcon } from './TerminalTabIcon'
import './tabTeam.css'

const PANEL_GAP = 6
const AGE_REFRESH_MS = 60_000

interface OpenPanel {
  x: number
  y: number
  anchor: Element
}

function memberCountText(count: number): string {
  return count === 1 ? '1 team member' : `${count} team members`
}

export function TabTeamButton({ tab }: { tab: TerminalTab }) {
  const allMembers = useTeamStore((state) => state.members)
  const members = membersOfTab(allMembers, Object.keys(tab.panes))
  const [openPanel, setOpenPanel] = useState<OpenPanel | null>(null)
  const closePanel = useCallback(() => setOpenPanel(null), [])
  const now = useNow(AGE_REFRESH_MS)

  if (members.length === 0) {
    return null
  }
  const isAnyWorking = members.some((member) => member.state === 'working' || member.state === 'starting')
  const askingCount = members.filter((member) => member.state === 'waiting').length

  function togglePanel(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation()
    if (openPanel !== null) {
      closePanel()
      return
    }
    const anchor = event.currentTarget
    const bounds = anchor.getBoundingClientRect()
    setOpenPanel({ x: bounds.left, y: bounds.bottom + PANEL_GAP, anchor })
  }

  const summary = askingCount > 0 ? `${askingCount} asking` : isAnyWorking ? 'working' : 'idle'

  return (
    <>
      <button
        type="button"
        className={cn('tab-team', askingCount > 0 && 'tab-team-asking', openPanel !== null && 'tab-team-open')}
        title={`${memberCountText(members.length)} (${summary}). Click to see them.`}
        aria-haspopup="dialog"
        aria-expanded={openPanel !== null}
        onClick={togglePanel}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {isAnyWorking && askingCount === 0 ? <Spinner size={10} /> : <UsersRound size={12} />}
        <span className="tab-team-count">{members.length}</span>
        <ChevronDown size={12} className="tab-team-chevron" />
      </button>
      {openPanel !== null && (
        <FloatingPanel className="team-dropdown" x={openPanel.x} y={openPanel.y} anchor={openPanel.anchor} onClose={closePanel} label="Team members">
          <div className="team-dropdown-lead">
            <TerminalTabIcon tab={tab} size={16} />
            <span className="team-dropdown-lead-name">{tab.title}</span>
            <span className={cn('team-dropdown-summary', askingCount > 0 && 'team-dropdown-summary-asking')}>
              {memberCountText(members.length)} · {summary}
            </span>
          </div>
          <SessionMembers members={members} now={now} visibleCount={members.length} onMemberOpened={closePanel} />
        </FloatingPanel>
      )}
    </>
  )
}
