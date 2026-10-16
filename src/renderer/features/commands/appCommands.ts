import { useLayoutStore } from '../../state/layoutStore'
import { useUpdateStore } from '../../state/updateStore'
import { exportSettings, importSettings } from '../settings/backup/settingsBackupActions'
import type { AppCommand } from './commandTypes'

export const APP_COMMANDS: AppCommand[] = [
  {
    id: 'app.checkUpdates',
    title: 'Check for updates',
    group: 'App',
    keywords: ['version', 'upgrade'],
    run: async () => {
      const layout = useLayoutStore.getState()
      layout.selectSettingsPage('about')
      layout.openSection('settings')
      await useUpdateStore.getState().check()
    }
  },
  {
    id: 'app.openLogs',
    title: 'Open the log folder',
    group: 'App',
    keywords: ['errors', 'debug'],
    run: () => window.api.app.openLogFolder()
  },
  {
    id: 'app.exportSettings',
    title: 'Export settings to a JSON file',
    group: 'App',
    keywords: ['backup', 'save', 'json', 'export'],
    run: () => exportSettings(true)
  },
  {
    id: 'app.importSettings',
    title: 'Import settings from a JSON file',
    group: 'App',
    keywords: ['restore', 'load', 'json', 'import'],
    run: () => importSettings()
  }
]
