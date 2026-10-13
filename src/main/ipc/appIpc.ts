import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { closeWindowAndStopTasks } from '../closeGuard'
import { readRunningTasks } from '../services/resources/runningTasks'

export function registerAppIpc(): void {
  ipcMain.handle(IpcChannel.appListRunningTasks, () => readRunningTasks())
  ipcMain.handle(IpcChannel.appConfirmClose, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window !== null) {
      await closeWindowAndStopTasks(window)
    }
  })
}
