import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { closeWindowAndStopTasks } from '../closeGuard'
import { loadSettings, saveSettings } from '../settings'
import { logDirectory, writeLog } from '../services/logging/logFile'
import { LOG_LEVELS, type LogLevel } from '../services/logging/logLine'
import { readRunningTasks } from '../services/resources/runningTasks'

export function registerAppIpc(): void {
  ipcMain.handle(IpcChannel.appListRunningTasks, () => readRunningTasks())
  ipcMain.on(IpcChannel.appLog, (_event, level: LogLevel, message: string) => {
    if (LOG_LEVELS.includes(level) && typeof message === 'string') {
      writeLog(level, 'Interface: ' + message)
    }
  })
  ipcMain.handle(IpcChannel.appOpenLogFolder, async () => {
    await shell.openPath(logDirectory())
  })
  ipcMain.handle(IpcChannel.appHardwareAcceleration, async () => ({
    isSaved: (await loadSettings()).useHardwareAcceleration,
    isActive: app.isHardwareAccelerationEnabled()
  }))
  ipcMain.handle(IpcChannel.appSetHardwareAcceleration, async (_event, isEnabled: boolean) => {
    await saveSettings({ ...(await loadSettings()), useHardwareAcceleration: isEnabled === true })
  })
  ipcMain.handle(IpcChannel.appRestart, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    app.relaunch()
    if (window !== null) {
      await closeWindowAndStopTasks(window)
    }
    app.quit()
  })
  ipcMain.handle(IpcChannel.appConfirmClose, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window !== null) {
      await closeWindowAndStopTasks(window)
    }
  })
}
