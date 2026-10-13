import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { readListeningPorts, stopListeningProcess } from '../services/resources/listeningPorts'

export function registerPortsIpc(): void {
  ipcMain.handle(IpcChannel.portsList, () => readListeningPorts())
  ipcMain.handle(IpcChannel.portsStop, (_event, pid: number) => stopListeningProcess(pid))
}
