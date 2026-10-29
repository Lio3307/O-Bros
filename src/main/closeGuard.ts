import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel } from '../shared/ipc'
import { stopAllRunningTasks } from './services/resources/runningTasks'

const ANSWER_WAIT_MS = 3000

const windowsReadyToClose = new WeakSet<BrowserWindow>()
const unansweredCloses = new WeakMap<BrowserWindow, NodeJS.Timeout>()

function closeIfUnanswered(window: BrowserWindow): void {
  if (unansweredCloses.has(window)) {
    return
  }
  unansweredCloses.set(
    window,
    setTimeout(() => {
      unansweredCloses.delete(window)
      if (!window.isDestroyed()) {
        void closeWindowAndStopTasks(window)
      }
    }, ANSWER_WAIT_MS)
  )
}

export function guardWindowClose(window: BrowserWindow): void {
  window.on('close', (event) => {
    const canCloseNow = windowsReadyToClose.has(window) || window.webContents.isCrashed()
    if (canCloseNow) {
      return
    }
    event.preventDefault()
    closeIfUnanswered(window)
    window.webContents.send(IpcChannel.appCloseRequested)
  })
}

export function listenForCloseAnswers(): void {
  ipcMain.on(IpcChannel.appCloseHeard, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window !== null) {
      clearTimeout(unansweredCloses.get(window))
      unansweredCloses.delete(window)
    }
  })
}

export async function allowEveryWindowToClose(): Promise<void> {
  await stopAllRunningTasks()
  BrowserWindow.getAllWindows().forEach((window) => windowsReadyToClose.add(window))
}

export async function closeWindowAndStopTasks(window: BrowserWindow): Promise<void> {
  await stopAllRunningTasks()
  windowsReadyToClose.add(window)
  window.close()
}
