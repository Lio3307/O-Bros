import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { SessionSummary } from '../../shared/types'
import { toast } from './toastStore'

interface HistoryState {
  sessions: SessionSummary[]
  selectedFilePath: string | null
  day: string | null
  deletePermanently: boolean
  setDeletePermanently: (deletePermanently: boolean) => void
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
    deletePermanently: false,

    setDeletePermanently: (deletePermanently) => set({ deletePermanently }),

    load: reload,

    select: (selectedFilePath) => set({ selectedFilePath }),

    setDay: async (day) => {
      set({ day: day === '' ? null : day })
      await reload()
    },

    remove: async (filePaths) => {
      try {
        const permanently = get().deletePermanently
        const removedCount = await window.api.history.remove(filePaths, permanently)
        const noun = removedCount === 1 ? 'session' : 'sessions'
        const outcome = permanently ? 'Deleted ' : 'Moved '
        const destination = permanently ? '.' : ' to the Recycle Bin or Trash.'
        toast.success(outcome + removedCount + ' ' + noun + destination)
      } catch (error) {
        toast.error(friendlyErrorMessage(error, 'Could not delete the session.'))
      }
      await reload()
    }
  }
})
