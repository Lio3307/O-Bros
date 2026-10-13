import { app, BrowserWindow, Menu } from 'electron'
import { buildApplicationMenu } from './applicationMenu'
import { registerAccountsIpc } from './ipc/accountsIpc'
import { registerAppIpc } from './ipc/appIpc'
import { registerFilesIpc } from './ipc/filesIpc'
import { registerGitIpc } from './ipc/gitIpc'
import { registerHistoryIpc } from './ipc/historyIpc'
import { registerPortsIpc } from './ipc/portsIpc'
import { registerProjectsIpc } from './ipc/projectsIpc'
import { registerPtyIpc } from './ipc/ptyIpc'
import { registerResourcesIpc } from './ipc/resourcesIpc'
import { registerShellIpc } from './ipc/shellIpc'
import { registerToolsIpc } from './ipc/toolsIpc'
import { killAllTerminals } from './services/ptyManager'
import { guardWindowClose } from './closeGuard'
import { createMainWindow } from './window'

function registerAllIpc(): void {
  registerPtyIpc()
  registerAccountsIpc()
  registerProjectsIpc()
  registerFilesIpc()
  registerGitIpc()
  registerHistoryIpc()
  registerResourcesIpc()
  registerToolsIpc()
  registerShellIpc()
  registerAppIpc()
  registerPortsIpc()
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildApplicationMenu())
  registerAllIpc()
  guardWindowClose(createMainWindow())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      guardWindowClose(createMainWindow())
    }
  })
})

app.on('before-quit', killAllTerminals)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
