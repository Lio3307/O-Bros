import { create } from 'zustand'
import { withAppUsage } from '../../shared/processUsage'
import type { ResourceSnapshot } from '../../shared/types'

const MIN_FEEDBACK_MS = 500

interface ResourcesState {
  snapshot: ResourceSnapshot | null
  isRefreshing: boolean
  hasFailed: boolean
  poll: () => Promise<void>
  pollApp: () => Promise<void>
  refresh: () => Promise<void>
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export const useResourcesStore = create<ResourcesState>()((set, get) => ({
  snapshot: null,
  isRefreshing: false,
  hasFailed: false,

  poll: async () => {
    try {
      set({ snapshot: await window.api.resources.get() })
    } catch {
      set({ hasFailed: true })
    }
  },

  pollApp: async () => {
    try {
      const app = await window.api.resources.app()
      const snapshot = get().snapshot
      if (snapshot !== null) {
        set({ snapshot: withAppUsage(snapshot, app) })
      }
    } catch {
      return
    }
  },

  refresh: async () => {
    if (get().isRefreshing) {
      return
    }
    set({ isRefreshing: true, hasFailed: false })
    try {
      const [snapshot] = await Promise.all([window.api.resources.get(), wait(MIN_FEEDBACK_MS)])
      set({ snapshot })
    } catch {
      set({ hasFailed: true })
    } finally {
      set({ isRefreshing: false })
    }
  }
}))
