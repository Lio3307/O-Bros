import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { dayRangeFromInput } from '../../shared/time'
import { listClaudeSessions, readClaudeSession, removeClaudeSessions } from '../services/sessionHistory'

export function registerHistoryIpc(): void {
  ipcMain.handle(IpcChannel.historyList, (_event, day: string | null) =>
    listClaudeSessions(day === null ? null : dayRangeFromInput(day))
  )
  ipcMain.handle(IpcChannel.historyGet, (_event, filePath: string) => readClaudeSession(filePath))
  ipcMain.handle(IpcChannel.historyRemove, (_event, filePaths: string[]) => removeClaudeSessions(filePaths))
}
