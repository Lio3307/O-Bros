import { ipcMain } from 'electron'
import { IpcChannel, type PtyCreateRequest } from '../../shared/ipc'
import { noteTerminalInputForAgents } from '../services/activity/typedAgents'
import { createTerminal, killTerminal, resizeTerminal, writeToTerminal } from '../services/ptyManager'

export function registerPtyIpc(): void {
  ipcMain.handle(IpcChannel.ptyCreate, (event, request: PtyCreateRequest) => {
    createTerminal(event.sender, request)
  })
  ipcMain.on(IpcChannel.ptyInput, (_event, id: string, data: string) => {
    writeToTerminal(id, data)
    noteTerminalInputForAgents(id, data)
  })
  ipcMain.on(IpcChannel.ptyResize, (_event, id: string, columns: number, rows: number) =>
    resizeTerminal(id, columns, rows)
  )
  ipcMain.on(IpcChannel.ptyKill, (_event, id: string) => killTerminal(id))
}
