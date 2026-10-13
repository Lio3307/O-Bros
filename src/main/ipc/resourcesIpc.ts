import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { readResourceSnapshot } from '../services/resources/resourceMonitor'

export function registerResourcesIpc(): void {
  ipcMain.handle(IpcChannel.resourcesGet, () => readResourceSnapshot())
}
