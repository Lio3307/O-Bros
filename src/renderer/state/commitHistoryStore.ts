import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { GitCommit, GitCommitFile } from '../../shared/types'
import { toast } from './toastStore'

const FIRST_PAGE_SIZE = 50
const PAGE_STEP = 50
const MAX_COMMITS = 200

interface CommitHistoryState {
  commits: GitCommit[] | null
  limit: number
  expandedHash: string | null
  filesByHash: Record<string, GitCommitFile[]>
  load: (repoPath: string) => Promise<void>
  showMore: (repoPath: string) => Promise<void>
  toggle: (repoPath: string, hash: string) => Promise<void>
  reset: () => void
}

export const useCommitHistoryStore = create<CommitHistoryState>()((set, get) => ({
  commits: null,
  limit: FIRST_PAGE_SIZE,
  expandedHash: null,
  filesByHash: {},

  load: async (repoPath) => {
    try {
      const commits = await window.api.git.log({ repoPath, limit: get().limit })
      set({ commits })
    } catch (error) {
      set({ commits: [] })
      toast.error(friendlyErrorMessage(error, 'Could not read the commit history.'))
    }
  },

  showMore: async (repoPath) => {
    set({ limit: Math.min(get().limit + PAGE_STEP, MAX_COMMITS) })
    await get().load(repoPath)
  },

  toggle: async (repoPath, hash) => {
    if (get().expandedHash === hash) {
      set({ expandedHash: null })
      return
    }
    set({ expandedHash: hash })
    if (get().filesByHash[hash] !== undefined) {
      return
    }
    try {
      const files = await window.api.git.commitFiles({ repoPath, hash })
      set({ filesByHash: { ...get().filesByHash, [hash]: files } })
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not read the files of this commit.'))
    }
  },

  reset: () => set({ commits: null, limit: FIRST_PAGE_SIZE, expandedHash: null, filesByHash: {} })
}))

export function canShowMoreCommits(commitCount: number, limit: number): boolean {
  return commitCount >= limit && limit < MAX_COMMITS
}
