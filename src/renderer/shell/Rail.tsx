import { Folders, GitBranch, History, Settings, type LucideIcon } from 'lucide-react'
import { useLayoutStore, type Section } from '../state/layoutStore'

interface RailItem {
  section: Section
  label: string
  Icon: LucideIcon
}

const topItems: RailItem[] = [
  { section: 'projects', label: 'Projects', Icon: Folders },
  { section: 'history', label: 'History', Icon: History },
  { section: 'changes', label: 'Changes', Icon: GitBranch }
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

export function Rail() {
  return (
    <nav className="rail">
      <div className="rail-group">
        {topItems.map((item) => (
          <RailButton key={item.section} item={item} />
        ))}
      </div>
      <RailButton item={settingsItem} />
    </nav>
  )
}
