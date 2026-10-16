import type { ReactElement } from 'react'
import { useLayoutStore, type SettingsPage as SettingsPageId } from '../../state/layoutStore'
import { AboutPage } from './AboutPage'
import { AgentsPage } from './AgentsPage'
import { BackupPage } from './backup/BackupPage'
import { EditorSettingsPage } from './EditorSettingsPage'
import { ProjectFoldersPage } from './ProjectFoldersPage'
import { PromptsPage } from './PromptsPage'
import { ProviderAccountsPage } from './ProviderAccountsPage'
import { ShortcutsPage } from './ShortcutsPage'
import { SnippetsPage } from './SnippetsPage'
import { StoragePage } from './StoragePage'
import { TeamSettingsPage } from './TeamSettingsPage'
import { TerminalSettingsPage } from './TerminalSettingsPage'

const pageByName: Record<SettingsPageId, () => ReactElement> = {
  accounts: () => <ProviderAccountsPage />,
  agents: () => <AgentsPage />,
  folders: () => <ProjectFoldersPage />,
  editor: () => <EditorSettingsPage />,
  snippets: () => <SnippetsPage />,
  terminal: () => <TerminalSettingsPage />,
  prompts: () => <PromptsPage />,
  team: () => <TeamSettingsPage />,
  shortcuts: () => <ShortcutsPage />,
  storage: () => <StoragePage />,
  backup: () => <BackupPage />,
  about: () => <AboutPage />
}

export function SettingsPage() {
  const settingsPage = useLayoutStore((state) => state.settingsPage)
  return pageByName[settingsPage]()
}
