import { Menu, type MenuItemConstructorOptions } from 'electron'
import { isRunningFromSource } from './runMode'

export function buildApplicationMenu(): Menu {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: isRunningFromSource()
        ? [{ role: 'reload' }, { role: 'toggleDevTools' }, { role: 'togglefullscreen' }]
        : [{ role: 'togglefullscreen' }]
    },
    { role: 'windowMenu' }
  ]

  return Menu.buildFromTemplate(template)
}
