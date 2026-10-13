import { create } from 'zustand'
import { useLayoutStore } from './layoutStore'
import { useWorkspaceStore } from './workspaceStore'

export interface EditorTarget {
  path: string
  line: number
  column: number
}

interface EditorNavigationState {
  target: EditorTarget | null
  goTo: (target: EditorTarget) => void
  consume: () => void
}

export const useEditorNavigationStore = create<EditorNavigationState>()((set) => ({
  target: null,

  goTo: (target) => {
    useWorkspaceStore.getState().openFileTab(target.path)
    useLayoutStore.getState().showSection('projects')
    set({ target })
  },

  consume: () => set({ target: null })
}))
