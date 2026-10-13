import { create } from 'zustand'

interface CollapseRequest {
  path: string
  token: number
}

interface FileTreeState {
  refreshToken: number
  collapseRequest: CollapseRequest | null
  searchScopePath: string | null
  refresh: () => void
  collapse: (path: string) => void
  setSearchScope: (path: string | null) => void
}

export const useFileTreeStore = create<FileTreeState>()((set, get) => ({
  refreshToken: 0,
  collapseRequest: null,
  searchScopePath: null,

  refresh: () => set({ refreshToken: get().refreshToken + 1 }),

  collapse: (path) => set({ collapseRequest: { path, token: get().refreshToken + Date.now() } }),

  setSearchScope: (searchScopePath) => set({ searchScopePath })
}))
