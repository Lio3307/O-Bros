import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { StorageReport } from '../../shared/types'
import { clearAppCache, readAppCacheBytes } from '../services/storage/appCache'
import { listDataLocations, openDataLocation } from '../services/storage/dataLocations'
import { readLeftoverTempFolders, removeLeftoverTempFolders } from '../services/storage/leftoverTempFolders'
import { readTaskFiles, removeTaskFiles } from '../services/wot/wotTaskFiles'

async function readStorageReport(): Promise<StorageReport> {
  const [appCacheBytes, leftoverTemp, taskFiles] = await Promise.all([
    readAppCacheBytes(),
    readLeftoverTempFolders(),
    readTaskFiles()
  ])
  return {
    appCacheBytes,
    leftoverTempBytes: leftoverTemp.totalBytes,
    leftoverTempFolders: leftoverTemp.folderCount,
    teamTaskFileBytes: taskFiles.totalBytes,
    teamTaskFileCount: taskFiles.fileCount
  }
}

export function registerStorageIpc(): void {
  ipcMain.handle(IpcChannel.storageReport, () => readStorageReport())
  ipcMain.handle(IpcChannel.storageClearAppCache, () => clearAppCache())
  ipcMain.handle(IpcChannel.storageClearLeftoverTemp, () => removeLeftoverTempFolders())
  ipcMain.handle(IpcChannel.storageClearTeamTaskFiles, () => removeTaskFiles())
  ipcMain.handle(IpcChannel.storageLocations, () => listDataLocations())
  ipcMain.handle(IpcChannel.storageOpenLocation, (_event, id: string) => openDataLocation(id))
}
