import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'node:path'
import { buildApplicationMenu } from './applicationMenu'
import { registerAccountsIpc } from './ipc/accountsIpc'
import { registerActivityIpc } from './ipc/activityIpc'
import { registerLanguageServersIpc } from './ipc/languageServersIpc'
import { stopAllLanguageServers } from './services/languageServers/languageServerSessions'
import { registerAgentsIpc } from './ipc/agentsIpc'
import { reportHandlerErrors } from './ipc/handlerErrors'
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
import { registerWotIpc } from './ipc/wotIpc'
import { registerSettingsBackupIpc } from './ipc/settingsBackupIpc'
import { killAllTerminals } from './services/ptyManager'
import { writeLog } from './services/logging/logFile'
import { setBridgeTarget } from './services/wot/rendererBridge'
import { startTypedAgentWatch } from './services/activity/typedAgents'
import { startWotServer, stopWotServer } from './services/wot/wotServer'
import { guardWindowClose } from './closeGuard'
import { createMainWindow } from './window'
import { loadSettingsBeforeStart } from './settings'

const DATA_FOLDER_NAME = 'o-bros'

function keepDataFolderName(): void {
  if (!app.commandLine.hasSwitch('user-data-dir')) {
    app.setPath('userData', join(app.getPath('appData'), DATA_FOLDER_NAME))
  }
}

keepDataFolderName()

if (!loadSettingsBeforeStart().useHardwareAcceleration) {
  app.disableHardwareAcceleration()
}

function registerAllIpc(): void {
  reportHandlerErrors()
  registerPtyIpc()
  registerAgentsIpc()
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
  registerActivityIpc()
  registerLanguageServersIpc()
  registerStorageIpc()
  registerUpdaterIpc()
  registerWotIpc()
  registerSettingsBackupIpc()
}

function openMainWindow(): void {
  const window = createMainWindow()
  setBridgeTarget(window.webContents)
  guardWindowClose(window)
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildApplicationMenu())
  registerAllIpc()
  startWotServer()
  openMainWindow()
  startTypedAgentWatch()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      openMainWindow()
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

app.on('before-quit', () => {
  stopWotServer()
  killAllTerminals()
  stopAllLanguageServers()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
