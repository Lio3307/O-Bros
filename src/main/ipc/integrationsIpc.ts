import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { readIntegrations } from '../services/integrations/integrationStatus'

export function registerIntegrationsIpc(): void {
  ipcMain.handle(IpcChannel.integrationsRead, () => readIntegrations())
}
