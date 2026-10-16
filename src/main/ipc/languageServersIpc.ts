import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { LanguageServerChoices, LanguageServerStartRequest } from '../../shared/languageServers'
import {
  languageServerStatusesFor,
  listRunningLanguageServers,
  releaseLanguageServer,
  sendToLanguageServer,
  startLanguageServer,
  stopLanguageServer
} from '../services/languageServers/languageServerSessions'

export function registerLanguageServersIpc(): void {
  ipcMain.handle(IpcChannel.lspStatuses, (_event, folderPath: string | null, choices: LanguageServerChoices) =>
    languageServerStatusesFor(folderPath, choices)
  )
  ipcMain.handle(IpcChannel.lspStart, (event, request: LanguageServerStartRequest) => startLanguageServer(request, event.sender))
  ipcMain.on(IpcChannel.lspSend, (_event, sessionId: string, message: string) => {
    if (typeof sessionId === 'string' && typeof message === 'string') {
      sendToLanguageServer(sessionId, message)
    }
  })
  ipcMain.on(IpcChannel.lspRelease, (_event, sessionId: string) => releaseLanguageServer(sessionId))
  ipcMain.handle(IpcChannel.lspRunning, () => listRunningLanguageServers())
  ipcMain.handle(IpcChannel.lspStop, (_event, sessionId: string) => stopLanguageServer(sessionId))
}
