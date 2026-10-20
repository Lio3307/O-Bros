import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { devServerUrl } from '../runMode'
import { isTrustedSender } from './trustedSender'
import { writeLog } from '../services/logging/logFile'

export function reportHandlerErrors(): void {
  const handle = ipcMain.handle.bind(ipcMain)
  ipcMain.handle = (channel, listener) =>
    handle(channel, async (event, ...args) => {
      if (!isTrustedSender(event.senderFrame?.url)) {
        writeLog('error', `Refused ${channel} from a page that is not O-BROS`)
        throw new Error('This request did not come from the O-BROS window.')
      }
      try {
        return await listener(event, ...args)
      } catch (error) {
        const message = `${channel}: ${error instanceof Error ? error.message : String(error)}`
        writeLog('error', message)
        if (devServerUrl() !== null && !event.sender.isDestroyed()) {
          event.sender.send(IpcChannel.appHandlerError, message)
        }
        throw error
      }
    })
}
