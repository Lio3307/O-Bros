import { create } from 'zustand'
import { readStored, writeStoredJson } from './browserStorage'

const STORAGE_KEY = 'o-bros.collapsedProjectFolders'

interface CollapsedRootsState {
  paths: string[]
  toggle: (rootPath: string) => void
}

export function parseCollapsedRoots(saved: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(saved ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function readSaved(): string[] {
  return parseCollapsedRoots(readStored(STORAGE_KEY))
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
