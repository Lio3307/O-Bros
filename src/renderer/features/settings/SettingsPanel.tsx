import { Bot, Code2, FolderCog, HardDrive, Info, Keyboard, Scissors, SquareTerminal, UserRound } from 'lucide-react'
import type { SettingsPage } from '../../state/layoutStore'
import { useLayoutStore } from '../../state/layoutStore'
import { PanelHeader } from '../../ui/PanelHeader'

const settingsItems: { page: SettingsPage; label: string; Icon: typeof UserRound }[] = [
  { page: 'accounts', label: 'Provider accounts', Icon: UserRound },
  { page: 'agents', label: 'Agents', Icon: Bot },
  { page: 'folders', label: 'Project folders', Icon: FolderCog },
  { page: 'editor', label: 'Editor', Icon: Code2 },
  { page: 'snippets', label: 'Snippets', Icon: Scissors },
  { page: 'terminal', label: 'Terminal', Icon: SquareTerminal },
  { page: 'shortcuts', label: 'Shortcuts', Icon: Keyboard },
  { page: 'storage', label: 'Storage and memory', Icon: HardDrive },
  { page: 'about', label: 'About and updates', Icon: Info }
]

export function SettingsPanel() {
  const settingsPage = useLayoutStore((state) => state.settingsPage)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)

  return (
    <div className="panel-content">
      <PanelHeader title="Settings" />
      {settingsItems.map(({ page, label, Icon }) => (
        <button
          key={page}
          type="button"
          className={page === settingsPage ? 'row row-selected' : 'row'}
          onClick={() => selectSettingsPage(page)}
        >
          <Icon size={14} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
