import { latestSessionFile, listThreadSummaries, prepareContinuation } from '../services/universalHistory/continuation'
import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { ContinueRequest, RemoveOlderSessionsRequest, SessionSummary, TeamChatsReport } from '../../shared/types'
import { listSessions, readSession } from '../services/sessions/sessionLibrary'
import { searchSessions } from '../services/sessions/sessionSearch'
import { removeSessions, removeSessionsOlderThan } from '../services/sessions/sessionRemoval'
import { readSessionStorageReports } from '../services/sessions/sessionStorageReport'
import { listTeamSessionFiles, removeTeamSessionFiles, teamMemberNamesBySessionId } from '../services/wot/teamSessions'

async function withTeamMemberNames<Summary extends SessionSummary>(summaries: Summary[]): Promise<Summary[]> {
  const names = await teamMemberNamesBySessionId().catch(() => new Map<string, string>())
  return summaries.map((summary) => ({ ...summary, teamMemberName: names.get(summary.sessionId) ?? null }))
}

async function readTeamChatsReport(): Promise<TeamChatsReport> {
  const files = await listTeamSessionFiles()
  return { sessionCount: files.length, totalBytes: files.reduce((total, file) => total + file.sizeBytes, 0) }
}

export function registerHistoryIpc(): void {
  ipcMain.handle(IpcChannel.historyList, () => listSessions().then(withTeamMemberNames))
  ipcMain.handle(IpcChannel.historyGet, (_event, filePath: string) => readSession(filePath))
  ipcMain.handle(IpcChannel.historySearch, (_event, query: string) => searchSessions(query).then(withTeamMemberNames))
  ipcMain.handle(IpcChannel.historyRemove, (_event, filePaths: string[], permanently: boolean) =>
    removeSessions(filePaths, permanently)
  )
  ipcMain.handle(IpcChannel.historyStorage, () => readSessionStorageReports())
  ipcMain.handle(IpcChannel.historyRemoveOlder, (_event, request: RemoveOlderSessionsRequest) =>
    removeSessionsOlderThan(request.provider, request.days, request.permanently)
  )
  ipcMain.handle(IpcChannel.historyTeamChats, () => readTeamChatsReport())
  ipcMain.handle(IpcChannel.historyContinueWith, (_event, request: ContinueRequest) => prepareContinuation(request))
  ipcMain.handle(IpcChannel.historyLatestSessionFile, (_event, provider: unknown, cwd: unknown, since: unknown) =>
    latestSessionFile(provider, cwd, since)
  )
  ipcMain.handle(IpcChannel.historyThreads, () => listThreadSummaries())
  ipcMain.handle(IpcChannel.historyRemoveTeamChats, (_event, permanently: boolean) =>
    removeTeamSessionFiles(null, permanently === true)
  )
}
