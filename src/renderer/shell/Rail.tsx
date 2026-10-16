import { Activity, Folders, GitBranch, History, Settings, UsersRound, type LucideIcon } from 'lucide-react'
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
  { section: 'activity', label: 'Activity', Icon: Activity },
  { section: 'team', label: 'Team (wot)', Icon: UsersRound }
]

const settingsItem: RailItem = { section: 'settings', label: 'Settings', Icon: Settings }

function TeamBadge() {
  const members = useTeamStore((state) => state.members)
  if (members.length === 0) {
    return null
  }
  const hasQuestion = members.some((member) => member.state === 'waiting')
  return <span className={hasQuestion ? 'rail-badge rail-badge-waiting' : 'rail-badge'}>{members.length}</span>
}

function isRailItemShown(item: RailItem, isTeamInUse: boolean): boolean {
  return item.section !== 'team' || isTeamInUse
}

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
      {item.section === 'team' && <TeamBadge />}
    </button>
  )
}

export function Rail() {
  const isTeamInUse = useTeamStore((state) => state.isInstalled || state.members.length > 0)
  return (
    <nav className="rail">
      <div className="rail-group">
        {topItems
          .filter((item) => isRailItemShown(item, isTeamInUse))
          .map((item) => (
            <RailButton key={item.section} item={item} />
          ))}
      </div>
      <RailButton item={settingsItem} />
    </nav>
  )
}
