import { create } from 'zustand'
import { formatBytes } from '../../shared/format'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import { describeSessionDelete } from '../../shared/sessionDeleteMessage'
import type { ProviderId, SessionAgeBucket, SessionStorageReport, StorageReport, TeamChatsReport } from '../../shared/types'
import {
  clearAllTerminalScrollback,
  readTerminalMemory,
  type TerminalMemory
} from '../features/terminal/terminalRegistry'
import { askToConfirm } from './confirmStore'
import { useHistoryStore } from './historyStore'
import { useRecentFilesStore } from './recentFilesStore'
import { summarizeRemoval } from '../../shared/sessionRemovalResult'
import { toast } from './toastStore'

const SCROLLBACK_CLEAR_SETTLE_MS = 100

interface StorageState {
  report: StorageReport | null
  sessionReports: SessionStorageReport[] | null
  teamChats: TeamChatsReport | null
  terminalMemory: TerminalMemory
  measuredAt: number
  refresh: () => Promise<void>
  clearAppCache: () => Promise<void>
  clearLeftoverTemp: () => Promise<void>
  clearTeamTaskFiles: () => Promise<void>
  stopAllTeamMembers: () => Promise<void>
  removeOldSessions: (provider: ProviderId, bucket: SessionAgeBucket) => Promise<void>
  removeTeamChats: () => Promise<void>
  clearTerminalScrollback: () => void
  clearRecentFiles: () => void
  clearSafeItems: () => Promise<void>
}

export const useStorageStore = create<StorageState>()((set, get) => ({
  report: null,
  sessionReports: null,
  teamChats: null,
  terminalMemory: readTerminalMemory(),
  measuredAt: 0,

  refresh: async () => {
    try {
      const [report, sessionReports, teamChats] = await Promise.all([
        window.api.storage.report(),
        window.api.history.storage(),
        window.api.history.teamChats().catch(() => null)
      ])
      set({ report, sessionReports, teamChats, terminalMemory: readTerminalMemory(), measuredAt: Date.now() })
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

  clearTeamTaskFiles: async () => {
    try {
      await window.api.storage.clearTeamTaskFiles()
      toast.success('Deleted the team task files.')
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not delete the team task files.'))
    }
    await get().refresh()
  },

  stopAllTeamMembers: async () => {
    const isConfirmed = await askToConfirm({
      title: 'Stop all team members?',
      message: 'Every team member stops and its terminal closes. Files they changed stay as they are, and their conversations stay saved.',
      confirmLabel: 'Stop all'
    })
    if (!isConfirmed) {
      return
    }
    const stoppedCount = await window.api.wot.stopAll()
    toast.success(stoppedCount === 1 ? 'Stopped 1 team member.' : `Stopped ${stoppedCount} team members.`)
  },

  removeOldSessions: async (provider, bucket) => {
    const permanently = useHistoryStore.getState().deletePermanently
    const isConfirmed = await askToConfirm(describeSessionDelete(bucket.sessionCount, bucket.totalBytes, permanently))
    if (!isConfirmed) {
      return
    }
    try {
      const result = await window.api.history.removeOlderThan({ provider, days: bucket.days, permanently })
      const summary = summarizeRemoval(result, permanently)
      toast[summary.kind](summary.message)
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not delete the sessions.'))
    }
    await get().refresh()
  },

  removeTeamChats: async () => {
    const teamChats = get().teamChats
    if (teamChats === null) {
      return
    }
    const permanently = useHistoryStore.getState().deletePermanently
    const isConfirmed = await askToConfirm(describeSessionDelete(teamChats.sessionCount, teamChats.totalBytes, permanently))
    if (!isConfirmed) {
      return
    }
    try {
      const summary = summarizeRemoval(await window.api.history.removeTeamChats(permanently), permanently)
      toast[summary.kind](summary.message)
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not delete the team member conversations.'))
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

  clearSafeItems: async () => {
    await get().clearAppCache()
    await get().clearLeftoverTemp()
    await get().clearTeamTaskFiles()
    get().clearRecentFiles()
  }
}))
