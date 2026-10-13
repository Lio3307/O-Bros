import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { UpdateStatus } from '../../shared/types'
import { toast } from './toastStore'

interface UpdateState {
  status: UpdateStatus | null
  load: () => Promise<void>
  watch: () => () => void
  check: () => Promise<void>
  download: () => Promise<void>
  openReleases: () => Promise<void>
}

export const useUpdateStore = create<UpdateState>()((set) => ({
  status: null,

  load: async () => {
    set({ status: await window.api.updater.status() })
  },

  watch: () => window.api.updater.onStatusChanged((status) => set({ status })),

  check: async () => {
    try {
      await window.api.updater.check()
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not check for updates.'))
    }
  },

  download: async () => {
    try {
      await window.api.updater.download()
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not download the update.'))
    }
  },

  openReleases: async () => {
    await window.api.updater.openReleases()
  }
}))
