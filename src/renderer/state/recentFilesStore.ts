import { create } from 'zustand'
import { parseRecentFiles, pushRecentFile } from '../features/files/recentFiles'

const STORAGE_KEY = 'o-bros.recentFiles'

interface RecentFilesState {
  paths: string[]
  record: (filePath: string) => void
  clear: () => void
}

function readSaved(): string[] {
  try {
    return parseRecentFiles(localStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

function saveRecentFiles(paths: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paths))
  } catch {
    return
  }
}

export const useRecentFilesStore = create<RecentFilesState>()((set, get) => ({
  paths: readSaved(),

  record: (filePath) => {
    const paths = pushRecentFile(get().paths, filePath)
    set({ paths })
    saveRecentFiles(paths)
  },

  clear: () => {
    set({ paths: [] })
    saveRecentFiles([])
  }
}))
