import { create } from 'zustand'
import { readStoredStringList, writeStoredJson } from './browserStorage'

const STORAGE_KEY = 'o-bros.collapsedProjectFolders'

interface CollapsedRootsState {
  paths: string[]
  toggle: (rootPath: string) => void
}

function readSaved(): string[] {
  return readStoredStringList(STORAGE_KEY)
}

function save(paths: string[]): void {
  writeStoredJson(STORAGE_KEY, paths)
}

export const useCollapsedRootsStore = create<CollapsedRootsState>()((set, get) => ({
  paths: readSaved(),
  toggle: (rootPath) => {
    const current = get().paths
    const paths = current.includes(rootPath) ? current.filter((path) => path !== rootPath) : [...current, rootPath]
    set({ paths })
    save(paths)
  }
}))
