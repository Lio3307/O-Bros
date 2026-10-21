import { app } from 'electron'
import { join } from 'node:path'
import type { DiskItem, DiskReport, DriveSpace } from '../../../shared/types'
import { isRunningFromSource } from '../../runMode'
import { isSameOrInside } from './folderMove'
import { universalHistoryReport } from '../universalHistory/universalHistory'
import { listConversationFolders } from './conversationFolders'
import { userCacheDirectory } from './dataLocations'
import { directorySize } from './directorySize'
import { driveOf } from './driveSpace'

async function appDataItem(historyFolder: string, historyBytes: number): Promise<DiskItem> {
  const appData = app.getPath('userData')
  const bytes = await directorySize(appData)
  const insideBytes = isSameOrInside(historyFolder, appData) ? historyBytes : 0
  return { kind: 'app', label: 'O-BROS settings, cache and logs', path: appData, bytes: Math.max(bytes - insideBytes, 0) }
}

async function updatesItem(): Promise<DiskItem[]> {
  if (isRunningFromSource()) {
    return []
  }
  const path = join(userCacheDirectory(), `${app.getName()}-updater`)
  return [{ kind: 'updates', label: 'Downloaded updates', path, bytes: await directorySize(path) }]
}

export async function readDiskOverview(): Promise<DiskReport[]> {
  const [conversations, history] = await Promise.all([listConversationFolders(), universalHistoryReport()])
  const items: DiskItem[] = [
    ...conversations.folders.map((folder): DiskItem => ({
      kind: 'conversations',
      label: folder.title,
      path: folder.movedTo ?? folder.path,
      bytes: folder.sizeBytes
    })),
    { kind: 'history', label: 'Universal history (O-BROS copies)', path: history.folder, bytes: history.totalBytes },
    await appDataItem(history.folder, history.totalBytes),
    ...(await updatesItem())
  ]
  const drives = await Promise.all(items.map((item) => driveOf(item.path)))
  const byRoot = new Map<string, DiskReport>()
  items.forEach((item, index) => {
    const drive: DriveSpace | null = drives[index]
    if (drive === null) {
      return
    }
    const report = byRoot.get(drive.root) ?? { drive, items: [] }
    report.items.push(item)
    byRoot.set(drive.root, report)
  })
  return [...byRoot.values()]
    .map((report) => ({ ...report, items: report.items.sort((first, second) => second.bytes - first.bytes) }))
    .sort((first, second) => first.drive.root.localeCompare(second.drive.root))
}
