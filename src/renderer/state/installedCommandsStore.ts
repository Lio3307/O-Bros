import { create } from 'zustand'

interface InstalledCommandsState {
  commands: string[] | null
  loadedAt: number
  load: () => Promise<void>
  refreshIfOlderThan: (maxAgeMs: number) => Promise<void>
}

export const useInstalledCommandsStore = create<InstalledCommandsState>()((set, get) => ({
  commands: null,
  loadedAt: 0,

  load: async () => {
    try {
      set({ commands: await window.api.agents.listCommands(), loadedAt: Date.now() })
    } catch {
      set({ commands: [], loadedAt: Date.now() })
    }
  },

  refreshIfOlderThan: async (maxAgeMs) => {
    if (Date.now() - get().loadedAt >= maxAgeMs) {
      await get().load()
    }
  }
}))
