import { create } from 'zustand'
import { togglePath } from '../features/files/pickRange'

interface CollapseRequest {
  path: string
  token: number
}

interface FileTreeState {
  refreshToken: number
  collapseRequest: CollapseRequest | null
  searchScopePath: string | null
  pickedPaths: string[]
  pickAnchor: string | null
  refresh: () => void
  collapse: (path: string) => void
  setSearchScope: (path: string | null) => void
  togglePicked: (path: string) => void
  setPicked: (paths: string[]) => void
  clearPicked: () => void
}

export const useFileTreeStore = create<FileTreeState>()((set, get) => ({
  refreshToken: 0,
  collapseRequest: null,
  searchScopePath: null,
  pickedPaths: [],
  pickAnchor: null,

  refresh: () => set({ refreshToken: get().refreshToken + 1 }),

  collapse: (path) => set({ collapseRequest: { path, token: get().refreshToken + Date.now() } }),

  setSearchScope: (searchScopePath) => set({ searchScopePath }),

  togglePicked: (path) => set({ pickedPaths: togglePath(get().pickedPaths, path), pickAnchor: path }),

  setPicked: (pickedPaths) => set({ pickedPaths }),

  clearPicked: () => {
    if (get().pickedPaths.length > 0 || get().pickAnchor !== null) {
      set({ pickedPaths: [], pickAnchor: null })
    }
  }
}))
