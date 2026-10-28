import { create } from 'zustand'
import { lastPathSegment } from '../../shared/paths'
import type { AddRootResult, ProjectRoot } from '../../shared/types'
import { toast } from './toastStore'
import { isSameData } from '../../shared/sameData'

interface ProjectsState {
  roots: ProjectRoot[]
  activeProjectPath: string | null
  hasLoaded: boolean
  load: () => Promise<void>
  addRoot: (dialogTitle?: string) => Promise<string | null>
  addDroppedRoots: (paths: string[]) => Promise<void>
  removeRoot: (rootPath: string) => Promise<void>
  relocateRoot: (oldPath: string) => Promise<void>
  selectProject: (projectPath: string) => void
}

function announceAddResult(result: AddRootResult): void {
  const existingName = result.matchedRootPath === null ? '' : lastPathSegment(result.matchedRootPath)
  const chosenName = lastPathSegment(result.chosenPath ?? '')

  if (result.outcome === 'already-added') {
    toast.warning('"' + existingName + '" is already in your sidebar. It is selected now.')
  } else if (result.outcome === 'added') {
    toast.success('Added "' + chosenName + '" to your sidebar.')
  } else if (result.outcome === 'not-a-folder') {
    toast.warning('"' + chosenName + '" is a file. Drop a folder to add it as a project.')
  }
}

function folderToWorkIn(result: AddRootResult): string | null {
  if (result.outcome === 'added') {
    return result.chosenPath
  }
  return result.outcome === 'already-added' ? result.matchedRootPath : null
}

export const useProjectsStore = create<ProjectsState>()((set, get) => {
  return {
    roots: [],
    activeProjectPath: null,
    hasLoaded: false,

    load: async () => {
      const found = await window.api.projects.list().finally(() => set({ hasLoaded: true }))
      const roots = isSameData(found, get().roots) ? get().roots : found
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

    addDroppedRoots: async (paths) => {
      let lastFolder: string | null = null
      for (const path of paths) {
        const result = await window.api.projects.addDroppedRoot(path)
        lastFolder = folderToWorkIn(result) ?? lastFolder
        set({ roots: result.roots })
        announceAddResult(result)
      }
      if (lastFolder !== null) {
        set({ activeProjectPath: lastFolder })
      }
    },

    removeRoot: async (rootPath) => {
      const roots = await window.api.projects.removeRoot(rootPath)
      const wasActive = get().activeProjectPath === rootPath
      set({ roots, activeProjectPath: wasActive ? (roots[0]?.path ?? null) : get().activeProjectPath })
    },

    relocateRoot: async (oldPath) => {
      const { roots, newPath } = await window.api.projects.relocateRoot(oldPath)
      const wasActive = get().activeProjectPath === oldPath
      set({ roots, activeProjectPath: wasActive && newPath !== null ? newPath : get().activeProjectPath })
      if (newPath !== null) {
        toast.success('Now using "' + lastPathSegment(newPath) + '".')
      }
    },

    selectProject: (activeProjectPath) => set({ activeProjectPath })
  }
})
