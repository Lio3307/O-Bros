import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { dayRangeFromInput } from '../../shared/time'
import type { RemoveOlderSessionsRequest } from '../../shared/types'
import { listSessions, readSession } from '../services/sessions/sessionLibrary'
import { removeSessions, removeSessionsOlderThan } from '../services/sessions/sessionRemoval'
import { readSessionStorageReports } from '../services/sessions/sessionStorageReport'

export function registerHistoryIpc(): void {
  ipcMain.handle(IpcChannel.historyList, (_event, day: string | null) =>
    listSessions(day === null ? null : dayRangeFromInput(day))
  )
  ipcMain.handle(IpcChannel.historyGet, (_event, filePath: string) => readSession(filePath))
  ipcMain.handle(IpcChannel.historyRemove, (_event, filePaths: string[], permanently: boolean) =>
    removeSessions(filePaths, permanently)
  )
  ipcMain.handle(IpcChannel.historyStorage, () => readSessionStorageReports())
  ipcMain.handle(IpcChannel.historyRemoveOlder, (_event, request: RemoveOlderSessionsRequest) =>
    removeSessionsOlderThan(request.provider, request.days, request.permanently)
  )
}
