import { create } from 'zustand'
import { useProjectsStore } from './projectsStore'

interface GitRepositoryState {
  pinnedPath: string | null
  originPath: string | null
  open: (path: string, originPath: string | null) => void
  followProject: () => void
}

export const useGitRepositoryStore = create<GitRepositoryState>()((set) => ({
  pinnedPath: null,
  originPath: null,
  open: (path, originPath) => set({ pinnedPath: path, originPath }),
  followProject: () => set({ pinnedPath: null, originPath: null })
}))

export function useGitRepositoryPath(): string | null {
  const pinnedPath = useGitRepositoryStore((state) => state.pinnedPath)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  return pinnedPath ?? activeProjectPath
}

export function gitRepositoryPath(): string | null {
  return useGitRepositoryStore.getState().pinnedPath ?? useProjectsStore.getState().activeProjectPath
}
