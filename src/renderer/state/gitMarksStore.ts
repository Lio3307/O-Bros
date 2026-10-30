import { create } from 'zustand'
import { gitMarksOf, type GitMarks } from '../../shared/gitMarks'
import { comparablePath } from '../../shared/paths'
import type { GitStatus } from '../../shared/types'

const WINDOWS_SEPARATOR = '\\'

export function gitMarkKey(path: string): string {
  return comparablePath(path, path.includes(WINDOWS_SEPARATOR))
}

interface GitMarksState {
  projectPath: string | null
  status: GitStatus | null | undefined
  marks: GitMarks | null
  load: (projectPath: string) => Promise<void>
}

export const useGitMarksStore = create<GitMarksState>()((set, get) => ({
  projectPath: null,
  status: undefined,
  marks: null,

  load: async (projectPath) => {
    if (get().projectPath !== projectPath) {
      set({ projectPath, status: undefined, marks: null })
    }
    const status = await window.api.git.status(projectPath).catch(() => null)
    if (get().projectPath !== projectPath) {
      return
    }
    const marks = status === null ? null : gitMarksOf(status.changes, status.root, status.root.includes(WINDOWS_SEPARATOR))
    set({ status, marks })
  }
}))
