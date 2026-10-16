import { create } from 'zustand'
import { keepNewestActivity, type ActivityEntry } from '../../shared/activity'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import { toast } from './toastStore'

interface ActivityState {
  entries: ActivityEntry[] | null
  load: () => Promise<void>
  add: (entry: ActivityEntry) => void
  clear: () => Promise<void>
}

export const useActivityStore = create<ActivityState>()((set, get) => ({
  entries: null,

  load: async () => {
    try {
      set({ entries: await window.api.activity.list() })
    } catch {
      set({ entries: get().entries ?? [] })
    }
  },

  add: (entry) => {
    const { entries } = get()
    if (entries !== null && !entries.some((known) => known.id === entry.id)) {
      set({ entries: keepNewestActivity([...entries, entry]) })
    }
  },

  clear: async () => {
    try {
      await window.api.activity.clear()
      set({ entries: [] })
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not clear the activity log.'))
    }
  }
}))
