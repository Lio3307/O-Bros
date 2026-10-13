import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { FormatRequest, LintRequest } from '../../shared/types'
import { formatContent, lintContent } from '../services/tools/toolService'

export function registerToolsIpc(): void {
  ipcMain.handle(IpcChannel.toolsLint, (_event, request: LintRequest) => lintContent(request))
  ipcMain.handle(IpcChannel.toolsFormat, (_event, request: FormatRequest) => formatContent(request))
}
