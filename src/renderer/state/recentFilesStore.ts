import { create } from 'zustand'
import { parseRecentFiles, pushRecentFile } from '../features/files/recentFiles'
import { readStored, writeStoredJson } from './browserStorage'

const STORAGE_KEY = 'o-bros.recentFiles'

interface RecentFilesState {
  paths: string[]
  record: (filePath: string) => void
  clear: () => void
}

function readSaved(): string[] {
  return parseRecentFiles(readStored(STORAGE_KEY))
}

function saveRecentFiles(paths: string[]): void {
  writeStoredJson(STORAGE_KEY, paths)
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
