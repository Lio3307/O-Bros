import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { GitStashEntry } from '../../shared/types'
import { useChangesStore } from './changesStore'
import { toast } from './toastStore'

interface StashState {
  stashes: GitStashEntry[]
  load: (repoPath: string) => Promise<void>
  stash: (repoPath: string, message: string) => Promise<boolean>
  apply: (repoPath: string, ref: string) => Promise<boolean>
  drop: (repoPath: string, ref: string) => Promise<boolean>
}

export const useStashStore = create<StashState>()((set, get) => {
  async function change(
    repoPath: string,
    action: () => Promise<void>,
    failureMessage: string,
    successMessage: string
  ): Promise<boolean> {
    try {
      await action()
    } catch (error) {
      toast.error(friendlyErrorMessage(error, failureMessage))
      await Promise.all([get().load(repoPath), useChangesStore.getState().load(repoPath)])
      return false
    }
    await Promise.all([get().load(repoPath), useChangesStore.getState().load(repoPath)])
    toast.success(successMessage)
    return true
  }

  return {
    stashes: [],

    load: async (repoPath) => {
      try {
        set({ stashes: await window.api.git.stashList(repoPath) })
      } catch {
        set({ stashes: [] })
      }
    },

    stash: (repoPath, message) =>
      change(
        repoPath,
        () => window.api.git.stash({ repoPath, message }),
        'Could not stash the changes.',
        'Changes stashed.'
      ),

    apply: (repoPath, ref) =>
      change(
        repoPath,
        () => window.api.git.stashApply({ repoPath, ref }),
        'Could not apply the stash.',
        'Stash applied and removed from the list.'
      ),

    drop: (repoPath, ref) =>
      change(
        repoPath,
        () => window.api.git.stashDrop({ repoPath, ref }),
        'Could not delete the stash.',
        'Stash deleted.'
      )
  }
})
