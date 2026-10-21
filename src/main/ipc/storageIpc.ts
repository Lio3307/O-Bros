import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { StorageReport } from '../../shared/types'
import { clearAppCache, readAppCacheBytes } from '../services/storage/appCache'
import {
  chooseConversationFolder,
  listConversationFolders,
  moveConversations,
  moveConversationsBack
} from '../services/storage/conversationFolders'
import { listDataLocations, openDataLocation } from '../services/storage/dataLocations'
import { readDiskOverview } from '../services/storage/diskOverview'
import {
  moveUniversalHistory,
  openUniversalHistoryFolder,
  saveUniversalHistoryNow,
  setUniversalHistoryKeepDays,
  universalHistoryReport
} from '../services/universalHistory/universalHistory'
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
  ipcMain.handle(IpcChannel.storageConversations, () => listConversationFolders())
  ipcMain.handle(IpcChannel.storageChooseConversationFolder, () => chooseConversationFolder())
  ipcMain.handle(IpcChannel.storageMoveConversations, (_event, id: string) => moveConversations(String(id)))
  ipcMain.handle(IpcChannel.storageMoveConversationsBack, (_event, id: string) => moveConversationsBack(String(id)))
  ipcMain.handle(IpcChannel.storageHistory, () => universalHistoryReport())
  ipcMain.handle(IpcChannel.storageSaveHistoryNow, async () => {
    await saveUniversalHistoryNow()
  })
  ipcMain.handle(IpcChannel.storageMoveHistory, () => moveUniversalHistory())
  ipcMain.handle(IpcChannel.storageSetHistoryKeep, (_event, days: unknown) => setUniversalHistoryKeepDays(days))
  ipcMain.handle(IpcChannel.storageOpenHistoryFolder, (_event, agent: unknown) => openUniversalHistoryFolder(agent))
  ipcMain.handle(IpcChannel.storageDisks, () => readDiskOverview())
}
