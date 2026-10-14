import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { GitCommit } from '../../shared/types'
import { toast } from './toastStore'

const FIRST_PAGE_SIZE = 100
const PAGE_STEP = 100
const MAX_COMMITS = 500

interface CommitGraphState {
  commits: GitCommit[] | null
  limit: number
  branchFilter: string | null
  branches: string[]
  currentBranch: string | null
  isLoading: boolean
  load: (repoPath: string) => Promise<void>
  showMore: (repoPath: string) => Promise<void>
  loadBranches: (repoPath: string) => Promise<void>
  setBranchFilter: (repoPath: string, branchFilter: string | null) => Promise<void>
  reset: () => void
}

export const useCommitGraphStore = create<CommitGraphState>()((set, get) => ({
  commits: null,
  limit: FIRST_PAGE_SIZE,
  branchFilter: null,
  branches: [],
  currentBranch: null,
  isLoading: false,

  load: async (repoPath) => {
    set({ isLoading: true })
    try {
      const { branchFilter, limit } = get()
      const scope = branchFilter === null ? { allBranches: true } : { branch: branchFilter }
      const commits = await window.api.git.log({ repoPath, limit, ...scope })
      set({ commits })
    } catch (error) {
      set({ commits: [] })
      toast.error(friendlyErrorMessage(error, 'Could not read the commit graph.'))
    } finally {
      set({ isLoading: false })
    }
  },

  showMore: async (repoPath) => {
    set({ limit: Math.min(get().limit + PAGE_STEP, MAX_COMMITS) })
    await get().load(repoPath)
  },

  loadBranches: async (repoPath) => {
    try {
      const { branches, current } = await window.api.git.branches(repoPath)
      const filterIsGone = get().branchFilter !== null && !branches.includes(get().branchFilter as string)
      set({ branches, currentBranch: current, branchFilter: filterIsGone ? null : get().branchFilter })
    } catch {
      set({ branches: [], currentBranch: null })
    }
  },

  setBranchFilter: async (repoPath, branchFilter) => {
    set({ branchFilter, limit: FIRST_PAGE_SIZE })
    await get().load(repoPath)
  },

  reset: () => set({ commits: null, limit: FIRST_PAGE_SIZE, branchFilter: null, branches: [], isLoading: false })
}))

export function canShowMoreGraphCommits(commitCount: number, limit: number): boolean {
  return commitCount >= limit && limit < MAX_COMMITS
}
