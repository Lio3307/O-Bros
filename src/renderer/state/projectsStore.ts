import { create } from 'zustand'
import { lastPathSegment } from '../../shared/paths'
import type { AddRootResult, ProjectRoot } from '../../shared/types'
import { toast } from './toastStore'

interface ProjectsState {
  roots: ProjectRoot[]
  activeProjectPath: string | null
  load: () => Promise<void>
  addRoot: () => Promise<void>
  removeRoot: (rootPath: string) => Promise<void>
  selectProject: (projectPath: string) => void
}

function announceAddResult(result: AddRootResult): void {
  const existingName = result.matchedRootPath === null ? '' : lastPathSegment(result.matchedRootPath)
  const chosenName = lastPathSegment(result.chosenPath ?? '')

  if (result.outcome === 'already-added') {
    toast.warning('"' + existingName + '" is already in your sidebar. It is selected now.')
  } else if (result.outcome === 'inside-existing') {
    toast.warning('"' + chosenName + '" is already inside "' + existingName + '", which is in your sidebar.')
  } else if (result.outcome === 'added') {
    toast.success('Added "' + chosenName + '" to your sidebar.')
  }
}

export const useProjectsStore = create<ProjectsState>()((set, get) => {
  return {
    roots: [],
    activeProjectPath: null,

    load: async () => {
      const roots = await window.api.projects.list()
      set({ roots, activeProjectPath: get().activeProjectPath ?? roots[0]?.path ?? null })
    },

    addRoot: async () => {
      const result = await window.api.projects.addRoot()
      const selectedPath = result.matchedRootPath ?? get().activeProjectPath ?? result.roots[0]?.path ?? null
      set({ roots: result.roots, activeProjectPath: selectedPath })
      announceAddResult(result)
    },

    removeRoot: async (rootPath) => {
      const roots = await window.api.projects.removeRoot(rootPath)
      const wasActive = get().activeProjectPath === rootPath
      set({ roots, activeProjectPath: wasActive ? (roots[0]?.path ?? null) : get().activeProjectPath })
    },

    selectProject: (activeProjectPath) => set({ activeProjectPath })
  }
})
