import { create } from 'zustand'
import { useAccountsStore } from './accountsStore'
import { useUsageStore } from './usageStore'

const MIN_FEEDBACK_MS = 700

interface RefreshState {
  isRefreshing: boolean
  hasFailed: boolean
  lastRefreshedAt: number | null
  refresh: () => Promise<void>
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function rescanAccountsAndReadUsage(): Promise<void> {
  await useAccountsStore.getState().rescan()
  await useUsageStore.getState().refresh(useAccountsStore.getState().accounts)
}

export const useRefreshStore = create<RefreshState>()((set, get) => ({
  isRefreshing: false,
  hasFailed: false,
  lastRefreshedAt: null,

  refresh: async () => {
    if (get().isRefreshing) {
      return
    }
    set({ isRefreshing: true, hasFailed: false })
    try {
      await Promise.all([rescanAccountsAndReadUsage(), wait(MIN_FEEDBACK_MS)])
      set({ lastRefreshedAt: Date.now() })
    } catch {
      set({ hasFailed: true })
    } finally {
      set({ isRefreshing: false })
    }
  }
}))
