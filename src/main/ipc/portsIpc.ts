import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { openListeningPort, readListeningPorts, stopListeningProcess } from '../services/resources/listeningPorts'

export function registerPortsIpc(): void {
  ipcMain.handle(IpcChannel.portsList, () => readListeningPorts())
  ipcMain.handle(IpcChannel.portsStop, (_event, pid: number) => stopListeningProcess(pid))
  ipcMain.handle(IpcChannel.portsOpen, (_event, port: number) => openListeningPort(port))
}
