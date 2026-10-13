import type { ReactElement } from 'react'
import { useLayoutStore, type SettingsPage as SettingsPageId } from '../../state/layoutStore'
import { EditorSettingsPage } from './EditorSettingsPage'
import { ProjectFoldersPage } from './ProjectFoldersPage'
import { ProviderAccountsPage } from './ProviderAccountsPage'
import { SnippetsPage } from './SnippetsPage'
import { StoragePage } from './StoragePage'
import { TerminalSettingsPage } from './TerminalSettingsPage'

const pageByName: Record<SettingsPageId, () => ReactElement> = {
  accounts: () => <ProviderAccountsPage />,
  folders: () => <ProjectFoldersPage />,
  editor: () => <EditorSettingsPage />,
  snippets: () => <SnippetsPage />,
  terminal: () => <TerminalSettingsPage />,
  storage: () => <StoragePage />
}

export function SettingsPage() {
  const settingsPage = useLayoutStore((state) => state.settingsPage)
  return pageByName[settingsPage]()
}
