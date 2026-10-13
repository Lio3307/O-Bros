import { describeSyncState } from '../../../shared/gitSync'
import type { GitStatus } from '../../../shared/types'

export function syncLabel(status: Pick<GitStatus, 'upstream' | 'ahead' | 'behind'>): string {
  const state = describeSyncState(status)

  if (state === 'up-to-date') {
    return 'Up to date'
  }
  if (state === 'ahead') {
    return `↑${status.ahead} ahead`
  }
  if (state === 'behind') {
    return `↓${status.behind} behind`
  }
  if (state === 'diverged') {
    return `↑${status.ahead} ↓${status.behind} diverged`
  }
  return 'No upstream'
}
