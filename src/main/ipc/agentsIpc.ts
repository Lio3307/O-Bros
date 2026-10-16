import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { loadAcpRegistry } from '../services/agents/acpRegistryClient'
import { listPathCommands } from '../services/agents/agentDetector'
import { loadAgentLogo } from '../services/agents/agentLogos'

export function registerAgentsIpc(): void {
  ipcMain.handle(IpcChannel.agentsCommands, () => listPathCommands())
  ipcMain.handle(IpcChannel.agentsRegistry, () => loadAcpRegistry())
  ipcMain.handle(IpcChannel.agentsLogo, (_event, command: string) => loadAgentLogo(String(command)))
}
