import { Activity, Folders, GitBranch, History, Settings, UsersRound, type LucideIcon } from 'lucide-react'
import { openFirstTeamMember } from '../features/team/openTeamMember'
import { useLayoutStore, type Section } from '../state/layoutStore'
import { useTeamStore } from '../state/teamStore'

interface RailItem {
  section: Section
  label: string
  Icon: LucideIcon
}

const topItems: RailItem[] = [
  { section: 'projects', label: 'Projects', Icon: Folders },
  { section: 'history', label: 'History', Icon: History },
  { section: 'changes', label: 'Changes', Icon: GitBranch },
  { section: 'activity', label: 'Activity', Icon: Activity }
]

const settingsItem: RailItem = { section: 'settings', label: 'Settings', Icon: Settings }

function RailButton({ item }: { item: RailItem }) {
  const section = useLayoutStore((state) => state.section)
  const selectSection = useLayoutStore((state) => state.selectSection)

  return (
    <button
      type="button"
      title={item.label}
      className={item.section === section ? 'rail-button rail-button-active' : 'rail-button'}
      onClick={() => selectSection(item.section)}
    >
      <item.Icon size={18} />
    </button>
  )
}

function TeamRailButton() {
  const members = useTeamStore((state) => state.members)
  const shownMemberId = useTeamStore((state) => state.shownMemberId)
  const section = useLayoutStore((state) => state.section)
  if (members.length === 0) {
    return null
  }
  const waitingCount = members.filter((member) => member.state === 'waiting').length
  const title =
    waitingCount > 0
      ? `Team members: ${members.length}, ${waitingCount} asking a question. Show it.`
      : `Team members: ${members.length}. Show the newest one.`
  const isShowing = section === 'projects' && shownMemberId !== null

  return (
    <button
      type="button"
      title={title}
      className={isShowing ? 'rail-button rail-button-active' : 'rail-button'}
      onClick={() => openFirstTeamMember()}
    >
      <UsersRound size={18} />
      <span className={waitingCount > 0 ? 'rail-badge rail-badge-waiting' : 'rail-badge'}>{members.length}</span>
    </button>
  )
}

export function Rail() {
  return (
    <nav className="rail">
      <div className="rail-group">
        {topItems.map((item) => (
          <RailButton key={item.section} item={item} />
        ))}
        <TeamRailButton />
      </div>
      <RailButton item={settingsItem} />
    </nav>
  )
}
