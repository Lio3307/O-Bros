import { create } from 'zustand'
import { formatBytes } from '../../shared/format'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import { describeSessionDelete } from '../../shared/sessionDeleteMessage'
import type { ProviderId, SessionAgeBucket, SessionStorageReport, StorageReport } from '../../shared/types'
import {
  clearAllTerminalScrollback,
  readTerminalMemory,
  type TerminalMemory
} from '../features/terminal/terminalRegistry'
import { askToConfirm } from './confirmStore'
import { useHistoryStore } from './historyStore'
import { useRecentFilesStore } from './recentFilesStore'
import { toast } from './toastStore'

const SCROLLBACK_CLEAR_SETTLE_MS = 100

interface StorageState {
  report: StorageReport | null
  sessionReports: SessionStorageReport[] | null
  terminalMemory: TerminalMemory
  refresh: () => Promise<void>
  clearAppCache: () => Promise<void>
  clearLeftoverTemp: () => Promise<void>
  removeOldSessions: (provider: ProviderId, bucket: SessionAgeBucket) => Promise<void>
  clearTerminalScrollback: () => void
  clearRecentFiles: () => void
  clearEverything: () => Promise<void>
}

export const useStorageStore = create<StorageState>()((set, get) => ({
  report: null,
  sessionReports: null,
  terminalMemory: readTerminalMemory(),

  refresh: async () => {
    try {
      const [report, sessionReports] = await Promise.all([window.api.storage.report(), window.api.history.storage()])
      set({ report, sessionReports, terminalMemory: readTerminalMemory() })
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not measure the storage.'))
    }
  },

  clearAppCache: async () => {
    const bytesBefore = get().report?.appCacheBytes ?? 0
    try {
      await window.api.storage.clearAppCache()
      await get().refresh()
      const bytesFreed = Math.max(bytesBefore - (get().report?.appCacheBytes ?? 0), 0)
      toast.success('App cache cleared. Freed ' + formatBytes(bytesFreed) + '.')
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not clear the app cache.'))
    }
  },

  clearLeftoverTemp: async () => {
    const bytesBefore = get().report?.leftoverTempBytes ?? 0
    try {
      await window.api.storage.clearLeftoverTemp()
      await get().refresh()
      toast.success('Leftover temporary files removed. Freed ' + formatBytes(bytesBefore) + '.')
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not remove the temporary files.'))
    }
  },

  removeOldSessions: async (provider, bucket) => {
    const permanently = useHistoryStore.getState().deletePermanently
    const isConfirmed = await askToConfirm(describeSessionDelete(bucket.sessionCount, bucket.totalBytes, permanently))
    if (!isConfirmed) {
      return
    }
    try {
      const result = await window.api.history.removeOlderThan({ provider, days: bucket.days, permanently })
      toast.success('Deleted ' + result.removedCount + ' sessions. Freed ' + formatBytes(result.freedBytes) + '.')
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not delete the sessions.'))
    }
    await get().refresh()
  },

  clearTerminalScrollback: () => {
    clearAllTerminalScrollback()
    toast.success('Terminal history cleared. Running programs were not touched.')
    setTimeout(() => set({ terminalMemory: readTerminalMemory() }), SCROLLBACK_CLEAR_SETTLE_MS)
  },

  clearRecentFiles: () => {
    useRecentFilesStore.getState().clear()
    toast.success('Recent files list cleared.')
  },

  clearEverything: async () => {
    await get().clearAppCache()
    await get().clearLeftoverTemp()
    get().clearTerminalScrollback()
    get().clearRecentFiles()
  }
}))
