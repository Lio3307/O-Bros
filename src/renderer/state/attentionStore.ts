import { create } from 'zustand'

interface AttentionState {
  tabIds: string[]
  mark: (tabId: string) => void
  clear: (tabId: string) => void
}

export const useAttentionStore = create<AttentionState>()((set, get) => ({
  tabIds: [],

  mark: (tabId) => {
    if (!get().tabIds.includes(tabId)) {
      set({ tabIds: [...get().tabIds, tabId] })
    }
  },

  clear: (tabId) => {
    if (get().tabIds.includes(tabId)) {
      set({ tabIds: get().tabIds.filter((id) => id !== tabId) })
    }
  }
}))
