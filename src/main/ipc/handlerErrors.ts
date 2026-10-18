import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { writeLog } from '../services/logging/logFile'

function isDevelopmentRun(): boolean {
  return process.env.ELECTRON_RENDERER_URL !== undefined
}

export function reportHandlerErrors(): void {
  const handle = ipcMain.handle.bind(ipcMain)
  ipcMain.handle = (channel, listener) =>
    handle(channel, async (event, ...args) => {
      try {
        return await listener(event, ...args)
      } catch (error) {
        const message = `${channel}: ${error instanceof Error ? error.message : String(error)}`
        writeLog('error', message)
        if (isDevelopmentRun() && !event.sender.isDestroyed()) {
          event.sender.send(IpcChannel.appHandlerError, message)
        }
        throw error
      }
    })
}
