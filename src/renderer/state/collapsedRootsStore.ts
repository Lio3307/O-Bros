import { create } from 'zustand'

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
  try {
    return parseCollapsedRoots(localStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

function save(paths: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paths))
  } catch {
    return
  }
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
