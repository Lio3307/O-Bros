import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { readAppUsageNow, readResourceSnapshot } from '../services/resources/resourceMonitor'

export function registerResourcesIpc(): void {
  ipcMain.handle(IpcChannel.resourcesGet, () => readResourceSnapshot())
  ipcMain.handle(IpcChannel.resourcesApp, () => readAppUsageNow())
}
