import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { SessionSummary } from '../../shared/types'
import { toast } from './toastStore'

interface HistoryState {
  sessions: SessionSummary[]
  selectedFilePath: string | null
  day: string | null
  load: () => Promise<void>
  select: (filePath: string) => void
  setDay: (day: string | null) => Promise<void>
  remove: (filePaths: string[]) => Promise<void>
}

export const useHistoryStore = create<HistoryState>()((set, get) => {
  async function reload(): Promise<void> {
    const sessions = await window.api.history.list(get().day)
    const selectedStillListed = sessions.some((session) => session.filePath === get().selectedFilePath)
    set({
      sessions,
      selectedFilePath: selectedStillListed ? get().selectedFilePath : (sessions[0]?.filePath ?? null)
    })
  }

  return {
    sessions: [],
    selectedFilePath: null,
    day: null,

    load: reload,

    select: (selectedFilePath) => set({ selectedFilePath }),

    setDay: async (day) => {
      set({ day: day === '' ? null : day })
      await reload()
    },

    remove: async (filePaths) => {
      try {
        const removedCount = await window.api.history.remove(filePaths)
        const noun = removedCount === 1 ? 'session' : 'sessions'
        toast.success('Moved ' + removedCount + ' ' + noun + ' to the Recycle Bin or Trash.')
      } catch (error) {
        toast.error(friendlyErrorMessage(error, 'Could not delete the session.'))
      }
      await reload()
    }
  }
})
