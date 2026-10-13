import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { StorageReport } from '../../shared/types'
import { clearAppCache, readAppCacheBytes } from '../services/storage/appCache'
import { readLeftoverTempFolders, removeLeftoverTempFolders } from '../services/storage/leftoverTempFolders'

async function readStorageReport(): Promise<StorageReport> {
  const [appCacheBytes, leftoverTemp] = await Promise.all([readAppCacheBytes(), readLeftoverTempFolders()])
  return {
    appCacheBytes,
    leftoverTempBytes: leftoverTemp.totalBytes,
    leftoverTempFolders: leftoverTemp.folderCount
  }
}

export function registerStorageIpc(): void {
  ipcMain.handle(IpcChannel.storageReport, () => readStorageReport())
  ipcMain.handle(IpcChannel.storageClearAppCache, () => clearAppCache())
  ipcMain.handle(IpcChannel.storageClearLeftoverTemp, () => removeLeftoverTempFolders())
}
