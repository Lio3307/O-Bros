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
import { registerStorageIpc } from './ipc/storageIpc'
import { registerUpdaterIpc } from './ipc/updaterIpc'
import { registerToolsIpc } from './ipc/toolsIpc'
import { killAllTerminals } from './services/ptyManager'
import { writeLog } from './services/logging/logFile'
import { setUpUpdater } from './services/updater/appUpdater'
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
  registerStorageIpc()
  registerUpdaterIpc()
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildApplicationMenu())
  registerAllIpc()
  setUpUpdater()
  guardWindowClose(createMainWindow())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      guardWindowClose(createMainWindow())
    }
  })
})

function describeFailure(failure: unknown): string {
  return failure instanceof Error ? (failure.stack ?? failure.message) : String(failure)
}

process.on('uncaughtExceptionMonitor', (error) => writeLog('error', 'Uncaught error: ' + describeFailure(error)))
process.on('unhandledRejection', (reason) => writeLog('error', 'Unhandled rejection: ' + describeFailure(reason)))
app.on('child-process-gone', (_event, details) =>
  writeLog('error', 'A helper process stopped: ' + details.type + ' (' + details.reason + ')')
)

app.on('before-quit', killAllTerminals)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
