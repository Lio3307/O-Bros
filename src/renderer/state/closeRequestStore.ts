import { create } from 'zustand'
import type { RunningTask } from '../../shared/types'
import { useWorkspaceStore } from './workspaceStore'

export interface PendingClose {
  tasks: RunningTask[]
  unsavedFileTitles: string[]
}

interface CloseRequestState {
  pending: PendingClose | null
  isStopping: boolean
  begin: () => Promise<void>
  cancel: () => void
  confirm: () => Promise<void>
}

function unsavedFileTitles(): string[] {
  return useWorkspaceStore
    .getState()
    .tabs.filter((tab) => tab.kind === 'file' && tab.isModified)
    .map((tab) => tab.title)
}

export const useCloseRequestStore = create<CloseRequestState>()((set, get) => ({
  pending: null,
  isStopping: false,

  begin: async () => {
    if (get().pending !== null) {
      return
    }
    const tasks = await window.api.app.listRunningTasks().catch(() => [])
    const unsavedTitles = unsavedFileTitles()
    if (tasks.length === 0 && unsavedTitles.length === 0) {
      await window.api.app.confirmClose()
      return
    }
    set({ pending: { tasks, unsavedFileTitles: unsavedTitles } })
  },

  cancel: () => set({ pending: null, isStopping: false }),

  confirm: async () => {
    set({ isStopping: true })
    await window.api.app.confirmClose()
  }
}))
