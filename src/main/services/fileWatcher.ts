import type { WebContents } from 'electron'
import { watch, type FSWatcher } from 'node:fs'
import { basename, dirname } from 'node:path'
import { IpcChannel } from '../../shared/ipc'
import { assertInsideProjectRoots } from '../pathGuard'
import { IS_PATH_CASE_INSENSITIVE } from './fileSystem'

const SETTLE_MS = 150

interface WatchedFile {
  watcher: FSWatcher
  users: number
  timer: NodeJS.Timeout | null
}

const watchedFiles = new Map<string, WatchedFile>()

function isSameName(first: string, second: string): boolean {
  return IS_PATH_CASE_INSENSITIVE ? first.toLowerCase() === second.toLowerCase() : first === second
}

function stopWatching(filePath: string, entry: WatchedFile): void {
  if (entry.timer !== null) {
    clearTimeout(entry.timer)
  }
  entry.watcher.close()
  watchedFiles.delete(filePath)
}

export async function watchFile(filePath: string, window: WebContents): Promise<void> {
  await assertInsideProjectRoots(filePath)
  const existing = watchedFiles.get(filePath)
  if (existing !== undefined) {
    existing.users += 1
    return
  }
  const fileName = basename(filePath)
  const entry: WatchedFile = {
    users: 1,
    timer: null,
    watcher: watch(dirname(filePath), (_eventType, changedName) => {
      if (changedName !== null && !isSameName(changedName.toString(), fileName)) {
        return
      }
      if (entry.timer !== null) {
        clearTimeout(entry.timer)
      }
      entry.timer = setTimeout(() => {
        entry.timer = null
        if (!window.isDestroyed()) {
          window.send(IpcChannel.fsChanged, filePath)
        }
      }, SETTLE_MS)
    })
  }
  entry.watcher.on('error', () => stopWatching(filePath, entry))
  watchedFiles.set(filePath, entry)
}

export function unwatchFile(filePath: string): void {
  const entry = watchedFiles.get(filePath)
  if (entry === undefined) {
    return
  }
  entry.users -= 1
  if (entry.users <= 0) {
    stopWatching(filePath, entry)
  }
}

export function unwatchAllFiles(): void {
  watchedFiles.forEach((entry, filePath) => stopWatching(filePath, entry))
}
