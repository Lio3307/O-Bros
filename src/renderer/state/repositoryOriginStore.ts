import { create } from 'zustand'

interface RepositoryOriginState {
  originPath: string | null
  setOrigin: (originPath: string | null) => void
}

export const useRepositoryOriginStore = create<RepositoryOriginState>()((set) => ({
  originPath: null,
  setOrigin: (originPath) => set({ originPath })
}))
