import { useLayoutStore } from '../../state/layoutStore'
import { useUpdateStore } from '../../state/updateStore'
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
  }
]
