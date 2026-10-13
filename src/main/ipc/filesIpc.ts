import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { CreateEntryRequest, RenameEntryRequest, SearchRequest } from '../../shared/types'
import { createEntry, moveEntryToTrash, renameEntry } from '../services/entryService'
import { listDirectory, readTextFile, searchFiles, writeTextFile } from '../services/fileService'

export function registerFilesIpc(): void {
  ipcMain.handle(IpcChannel.fsList, (_event, directoryPath: string) => listDirectory(directoryPath))
  ipcMain.handle(IpcChannel.fsRead, (_event, filePath: string) => readTextFile(filePath))
  ipcMain.handle(IpcChannel.fsWrite, (_event, filePath: string, content: string) => writeTextFile(filePath, content))
  ipcMain.handle(IpcChannel.fsSearch, (_event, request: SearchRequest) => searchFiles(request))
  ipcMain.handle(IpcChannel.fsCreate, (_event, request: CreateEntryRequest) => createEntry(request))
  ipcMain.handle(IpcChannel.fsRename, (_event, request: RenameEntryRequest) => renameEntry(request))
  ipcMain.handle(IpcChannel.fsTrash, (_event, path: string) => moveEntryToTrash(path))
}
