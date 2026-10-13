import type { GitStatus } from './types'

export type SyncState = 'up-to-date' | 'ahead' | 'behind' | 'diverged' | 'no-upstream'

export function describeSyncState(status: Pick<GitStatus, 'upstream' | 'ahead' | 'behind'>): SyncState {
  if (status.upstream === null) {
    return 'no-upstream'
  }
  if (status.ahead > 0 && status.behind > 0) {
    return 'diverged'
  }
  if (status.ahead > 0) {
    return 'ahead'
  }
  if (status.behind > 0) {
    return 'behind'
  }
  return 'up-to-date'
}

export function isPrimaryBranch(branchName: string): boolean {
  return branchName === 'main' || branchName === 'master'
}
