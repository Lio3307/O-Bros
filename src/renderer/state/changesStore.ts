import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { GitConflictSide, GitFileChange, GitStatus, ReviewFileRequest } from '../../shared/types'
import { askToConfirm } from './confirmStore'
import { toast } from './toastStore'
import { isSameData } from '../../shared/sameData'

export interface CommitFileSelection {
  hash: string
  path: string
  addedLines: number
  removedLines: number
}

export type ChangesView = 'diff' | 'graph'

interface ChangesState {
  view: ChangesView
  status: GitStatus | null
  loadedPath: string | null
  selectedChange: GitFileChange | null
  selectedCommitFile: CommitFileSelection | null
  selectedReview: ReviewFileRequest | null
  isFetching: boolean
  isWorking: boolean
  errorMessage: string | null
  load: (repoPath: string) => Promise<void>
  refresh: (repoPath: string) => Promise<void>
  fetchRemote: (repoPath: string) => Promise<void>
  pull: (repoPath: string) => Promise<boolean>
  push: (repoPath: string) => Promise<boolean>
  select: (change: GitFileChange) => void
  selectCommitFile: (file: CommitFileSelection) => void
  selectReview: (request: ReviewFileRequest) => void
  setView: (view: ChangesView) => void
  stage: (repoPath: string, filePaths: string[]) => Promise<void>
  unstage: (repoPath: string, filePaths: string[]) => Promise<void>
  discard: (repoPath: string, change: GitFileChange) => Promise<void>
  resolveConflict: (repoPath: string, filePath: string, side: GitConflictSide | null) => Promise<void>
  continueOperation: (repoPath: string) => Promise<void>
  abortOperation: (repoPath: string) => Promise<void>
  commit: (repoPath: string, message: string) => Promise<boolean>
  switchBranch: (repoPath: string, branch: string) => Promise<boolean>
}

const LOAD_FAILED_MESSAGE = 'Could not read the git information for this folder.'
const FETCH_FAILED_MESSAGE = 'Could not reach the remote. Check your connection and your git sign-in.'

function selectableChanges(status: GitStatus | null): GitFileChange[] {
  return status?.changes.filter((change) => change.kind !== 'conflicted') ?? []
}

export const useChangesStore = create<ChangesState>()((set, get) => {
  function applyStatus(repoPath: string, status: GitStatus | null): void {
    const previous = get().selectedChange
    const selectable = selectableChanges(status)
    const stillThere = selectable.find((change) => change.path === previous?.path && change.isStaged === previous.isStaged)
    set({ status, loadedPath: repoPath, selectedChange: stillThere ?? selectable[0] ?? null, errorMessage: null })
  }

  async function reload(repoPath: string): Promise<void> {
    applyStatus(repoPath, await window.api.git.status(repoPath))
  }

  function isQuiet(repoPath: string): boolean {
    return get().loadedPath === repoPath && !get().isWorking && !get().isFetching
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
    view: 'diff',
    status: null,
    loadedPath: null,
    selectedChange: null,
    selectedCommitFile: null,
    selectedReview: null,
    isFetching: false,
    isWorking: false,
    errorMessage: null,

    load: async (repoPath) => {
      try {
        const status = await window.api.git.status(repoPath)
        set({
          status,
          loadedPath: repoPath,
          selectedChange: selectableChanges(status)[0] ?? null,
          selectedCommitFile: null,
          errorMessage: null
        })
      } catch (error) {
        set({
          status: null,
          loadedPath: repoPath,
          selectedChange: null,
          selectedCommitFile: null,
          errorMessage: friendlyErrorMessage(error, LOAD_FAILED_MESSAGE)
        })
      }
    },

    refresh: async (repoPath) => {
      if (!isQuiet(repoPath)) {
        return
      }
      const status = await window.api.git.status(repoPath)
      if (isQuiet(repoPath) && !isSameData(status, get().status)) {
        applyStatus(repoPath, status)
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

    pull: async (repoPath) => {
      const isDone = await runAction(repoPath, () => window.api.git.pull(repoPath), 'Could not pull from the remote.')
      if (isDone) {
        toast.success('Pulled the latest changes.')
      }
      return isDone
    },

    push: async (repoPath) => {
      const traces = await window.api.git.agentTraces(repoPath).catch(() => [])
      if (traces.length > 0) {
        const isConfirmed = await askToConfirm({
          title: 'Push commits with an agent in them?',
          message: ['These commits would show an agent on GitHub:', '', ...traces].join('\n'),
          confirmLabel: 'Push anyway'
        })
        if (!isConfirmed) {
          return false
        }
      }
      const isDone = await runAction(repoPath, () => window.api.git.push(repoPath), 'Could not push to the remote.')
      if (isDone) {
        toast.success('Pushed to the remote.')
      }
      return isDone
    },

    select: (selectedChange) => set({ selectedChange, selectedCommitFile: null, selectedReview: null, view: 'diff' }),

    selectCommitFile: (selectedCommitFile) => set({ selectedCommitFile, selectedReview: null, view: 'diff' }),

    selectReview: (selectedReview) => set({ selectedReview, selectedCommitFile: null, view: 'diff' }),

    setView: (view) => set({ view }),

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

    resolveConflict: async (repoPath, filePath, side) => {
      await runAction(
        repoPath,
        () => window.api.git.resolveConflict({ repoPath, filePath, side }),
        'Could not resolve the conflict.'
      )
    },

    continueOperation: async (repoPath) => {
      if (await runAction(repoPath, () => window.api.git.continueOperation(repoPath), 'Could not continue.')) {
        toast.success('Done. The conflicts are resolved and committed.')
      }
    },

    abortOperation: async (repoPath) => {
      if (await runAction(repoPath, () => window.api.git.abortOperation(repoPath), 'Could not cancel.')) {
        toast.success('Cancelled. The branch is back to how it was before.')
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
