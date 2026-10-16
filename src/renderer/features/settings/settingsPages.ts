import {
  Bot,
  BookText,
  ArchiveRestore,
  Code2,
  FolderCog,
  HardDrive,
  Info,
  Keyboard,
  Scissors,
  SquareTerminal,
  UserRound,
  UsersRound,
  type LucideIcon
} from 'lucide-react'
import type { SettingsPage } from '../../state/layoutStore'

export interface SettingsPageItem {
  page: SettingsPage
  label: string
  Icon: LucideIcon
}

export interface SettingsGroup {
  title: string
  pages: SettingsPageItem[]
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: 'AI tools',
    pages: [
      { page: 'accounts', label: 'Provider accounts', Icon: UserRound },
      { page: 'agents', label: 'Agents', Icon: Bot },
      { page: 'prompts', label: 'Prompts', Icon: BookText },
      { page: 'team', label: 'Team (wot)', Icon: UsersRound }
    ]
  },
  {
    title: 'Workspace',
    pages: [
      { page: 'folders', label: 'Project folders', Icon: FolderCog },
      { page: 'editor', label: 'Editor', Icon: Code2 },
      { page: 'snippets', label: 'Snippets', Icon: Scissors },
      { page: 'terminal', label: 'Terminal', Icon: SquareTerminal },
      { page: 'shortcuts', label: 'Shortcuts', Icon: Keyboard }
    ]
  },
  {
    title: 'App',
    pages: [
      { page: 'storage', label: 'Storage and memory', Icon: HardDrive },
      { page: 'backup', label: 'Backup and restore', Icon: ArchiveRestore },
      { page: 'about', label: 'About and updates', Icon: Info }
    ]
  }
]

export const SETTINGS_PAGES: SettingsPageItem[] = SETTINGS_GROUPS.flatMap((group) => group.pages)
