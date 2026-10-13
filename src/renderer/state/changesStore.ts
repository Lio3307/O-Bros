import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { GitFileChange, GitStatus } from '../../shared/types'
import { toast } from './toastStore'

interface ChangesState {
  status: GitStatus | null
  selectedChange: GitFileChange | null
  isFetching: boolean
  isWorking: boolean
  errorMessage: string | null
  load: (repoPath: string) => Promise<void>
  fetchRemote: (repoPath: string) => Promise<void>
  select: (change: GitFileChange) => void
  stage: (repoPath: string, filePaths: string[]) => Promise<void>
  unstage: (repoPath: string, filePaths: string[]) => Promise<void>
  discard: (repoPath: string, change: GitFileChange) => Promise<void>
  commit: (repoPath: string, message: string) => Promise<boolean>
  switchBranch: (repoPath: string, branch: string) => Promise<boolean>
}

const LOAD_FAILED_MESSAGE = 'Could not read the git information for this folder.'
const FETCH_FAILED_MESSAGE = 'Could not reach the remote. Check your connection and your git sign-in.'

export const useChangesStore = create<ChangesState>()((set, get) => {
  async function reload(repoPath: string): Promise<void> {
    const status = await window.api.git.status(repoPath)
    const previous = get().selectedChange
    const stillThere = status?.changes.find(
      (change) => change.path === previous?.path && change.isStaged === previous.isStaged
    )
    set({ status, selectedChange: stillThere ?? status?.changes[0] ?? null, errorMessage: null })
  }

  async function runAction(repoPath: string, action: () => Promise<void>, failureMessage: string): Promise<boolean> {
    set({ isWorking: true })
    try {
      await action()
      await reload(repoPath)
      return true
    } catch (error) {
      toast.error(friendlyErrorMessage(error, failureMessage))
      return false
    } finally {
      set({ isWorking: false })
    }
  }

  return {
    status: null,
    selectedChange: null,
    isFetching: false,
    isWorking: false,
    errorMessage: null,

    load: async (repoPath) => {
      try {
        const status = await window.api.git.status(repoPath)
        set({ status, selectedChange: status?.changes[0] ?? null, errorMessage: null })
      } catch (error) {
        set({ status: null, selectedChange: null, errorMessage: friendlyErrorMessage(error, LOAD_FAILED_MESSAGE) })
      }
    },

    fetchRemote: async (repoPath) => {
      set({ isFetching: true })
      try {
        const status = await window.api.git.fetch(repoPath)
        set({ status, errorMessage: null })
      } catch (error) {
        const message = friendlyErrorMessage(error, FETCH_FAILED_MESSAGE)
        set({ errorMessage: message })
        toast.error(message)
      } finally {
        set({ isFetching: false })
      }
    },

    select: (selectedChange) => set({ selectedChange }),

    stage: async (repoPath, filePaths) => {
      await runAction(repoPath, () => window.api.git.stage({ repoPath, filePaths }), 'Could not stage the changes.')
    },

    unstage: async (repoPath, filePaths) => {
      await runAction(repoPath, () => window.api.git.unstage({ repoPath, filePaths }), 'Could not unstage the changes.')
    },

    discard: async (repoPath, change) => {
      const isDone = await runAction(
        repoPath,
        () =>
          window.api.git.discard({
            repoPath,
            filePath: change.path,
            isUntracked: change.kind === 'untracked'
          }),
        'Could not discard the changes.'
      )
      if (isDone) {
        toast.success('Discarded changes to ' + change.path + '.')
      }
    },

    commit: async (repoPath, message) => {
      const isDone = await runAction(
        repoPath,
        () => window.api.git.commit({ repoPath, message }),
        'Could not create the commit.'
      )
      if (isDone) {
        toast.success('Commit created.')
      }
      return isDone
    },

    switchBranch: async (repoPath, branch) => {
      const isDone = await runAction(
        repoPath,
        () => window.api.git.switchBranch({ repoPath, branch }),
        'Could not switch branches.'
      )
      if (isDone) {
        toast.success('Switched to ' + branch + '.')
      }
      return isDone
    }
  }
})
