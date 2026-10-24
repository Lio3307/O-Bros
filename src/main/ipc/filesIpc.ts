import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { CreateEntryRequest, RenameEntryRequest, SearchRequest } from '../../shared/types'
import { createEntry, moveEntryToTrash, renameEntry } from '../services/entryService'
import { listDirectory, readImageFile, readTextFile, searchFiles, writeTextFile } from '../services/fileService'
import { unwatchFile, watchFile } from '../services/fileWatcher'

export function registerFilesIpc(): void {
  ipcMain.handle(IpcChannel.fsList, (_event, directoryPath: string) => listDirectory(directoryPath))
  ipcMain.handle(IpcChannel.fsRead, (_event, filePath: string) => readTextFile(filePath))
  ipcMain.handle(IpcChannel.fsReadImage, (_event, filePath: string) => readImageFile(filePath))
  ipcMain.handle(IpcChannel.fsWrite, (_event, filePath: string, content: string) => writeTextFile(filePath, content))
  ipcMain.handle(IpcChannel.fsSearch, (_event, request: SearchRequest) => searchFiles(request))
  ipcMain.handle(IpcChannel.fsCreate, (_event, request: CreateEntryRequest) => createEntry(request))
  ipcMain.handle(IpcChannel.fsRename, (_event, request: RenameEntryRequest) => renameEntry(request))
  ipcMain.handle(IpcChannel.fsTrash, (_event, path: string) => moveEntryToTrash(path))
  ipcMain.handle(IpcChannel.fsWatch, (event, filePath: string) => watchFile(filePath, event.sender))
  ipcMain.handle(IpcChannel.fsUnwatch, (_event, filePath: string) => unwatchFile(filePath))
}
