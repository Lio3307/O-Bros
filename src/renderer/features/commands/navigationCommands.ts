import { useLayoutStore, type Section } from '../../state/layoutStore'
import { SETTINGS_PAGES } from '../settings/settingsPages'
import { toast } from '../../state/toastStore'
import { openFirstTeamMember } from '../team/openTeamMember'
import type { AppCommand } from './commandTypes'

const SECTION_COMMANDS: { section: Section; title: string; keywords: string[] }[] = [
  { section: 'projects', title: 'Show Projects', keywords: ['folders', 'terminals'] },
  { section: 'history', title: 'Show conversation History', keywords: ['sessions', 'resume', 'claude', 'codex'] },
  { section: 'changes', title: 'Show Changes (Git)', keywords: ['git', 'commit', 'diff'] },
  { section: 'activity', title: 'Show agent Activity', keywords: ['log', 'timeline', 'agents', 'today'] }
]

const sectionCommands: AppCommand[] = SECTION_COMMANDS.map(({ section, title, keywords }) => ({
  id: `show.${section}`,
  title,
  group: 'Go to',
  keywords,
  run: () => useLayoutStore.getState().openSection(section)
}))

const settingsCommands: AppCommand[] = SETTINGS_PAGES.map(({ page, label }) => ({
  id: `settings.${page}`,
  title: `Open ${label}`,
  group: 'Settings',
  keywords: ['settings', 'preferences'],
  run: () => {
    const layout = useLayoutStore.getState()
    layout.selectSettingsPage(page)
    layout.openSection('settings')
  }
}))

export const NAVIGATION_COMMANDS: AppCommand[] = [
  ...sectionCommands,
  {
    id: 'show.team',
    title: 'Show team members (wot)',
    group: 'Go to',
    keywords: ['agents', 'team', 'wot', 'summon', 'member'],
    run: () => {
      if (!openFirstTeamMember()) {
        toast.info('There are no team members right now.')
      }
    }
  },
  {
    id: 'file.quickOpen',
    title: 'Go to a file by name',
    group: 'Go to',
    keywords: ['open', 'find', 'quick'],
    shortcutText: 'Ctrl+P',
    run: () => useLayoutStore.getState().openQuickOpen()
  },
  {
    id: 'view.toggleSidebar',
    title: 'Show or hide the side panel',
    group: 'View',
    keywords: ['sidebar'],
    run: () => useLayoutStore.getState().toggleSidebarVisibility()
  },
  {
    id: 'view.toggleFiles',
    title: 'Show or hide the files panel',
    group: 'View',
    keywords: ['tree', 'explorer'],
    run: () => useLayoutStore.getState().toggleFilesPanel()
  },
  ...settingsCommands
]
