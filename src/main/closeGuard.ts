import type { BrowserWindow } from 'electron'
import { IpcChannel } from '../shared/ipc'
import { stopAllRunningTasks } from './services/resources/runningTasks'

const windowsReadyToClose = new WeakSet<BrowserWindow>()

export function guardWindowClose(window: BrowserWindow): void {
  window.on('close', (event) => {
    const canCloseNow = windowsReadyToClose.has(window) || window.webContents.isCrashed()
    if (canCloseNow) {
      return
    }
    event.preventDefault()
    window.webContents.send(IpcChannel.appCloseRequested)
  })
}

export async function closeWindowAndStopTasks(window: BrowserWindow): Promise<void> {
  await stopAllRunningTasks()
  windowsReadyToClose.add(window)
  window.close()
}
