import { create } from 'zustand'
import { lastPathSegment } from '../../shared/paths'
import type { AddRootResult, ProjectRoot } from '../../shared/types'
import { toast } from './toastStore'

interface ProjectsState {
  roots: ProjectRoot[]
  activeProjectPath: string | null
  load: () => Promise<void>
  addRoot: (dialogTitle?: string) => Promise<string | null>
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

function folderToWorkIn(result: AddRootResult): string | null {
  if (result.outcome === 'added' || result.outcome === 'inside-existing') {
    return result.chosenPath
  }
  return result.outcome === 'already-added' ? result.matchedRootPath : null
}

export const useProjectsStore = create<ProjectsState>()((set, get) => {
  return {
    roots: [],
    activeProjectPath: null,

    load: async () => {
      const found = await window.api.projects.list()
      const roots = JSON.stringify(found) === JSON.stringify(get().roots) ? get().roots : found
      set({ roots, activeProjectPath: get().activeProjectPath ?? roots[0]?.path ?? null })
    },

    addRoot: async (dialogTitle) => {
      const result = await window.api.projects.addRoot(dialogTitle)
      const chosenFolder = folderToWorkIn(result)
      const selectedPath = chosenFolder ?? get().activeProjectPath ?? result.roots[0]?.path ?? null
      set({ roots: result.roots, activeProjectPath: selectedPath })
      announceAddResult(result)
      return chosenFolder
    },

    removeRoot: async (rootPath) => {
      const roots = await window.api.projects.removeRoot(rootPath)
      const wasActive = get().activeProjectPath === rootPath
      set({ roots, activeProjectPath: wasActive ? (roots[0]?.path ?? null) : get().activeProjectPath })
    },

    selectProject: (activeProjectPath) => set({ activeProjectPath })
  }
})
