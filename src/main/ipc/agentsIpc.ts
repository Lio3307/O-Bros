import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { listPathCommands } from '../services/agents/agentDetector'

export function registerAgentsIpc(): void {
  ipcMain.handle(IpcChannel.agentsCommands, () => listPathCommands())
}
