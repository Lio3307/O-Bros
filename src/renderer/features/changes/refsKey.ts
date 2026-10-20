import type { GitStatus } from '../../../shared/types'

export function refsKeyOf(status: GitStatus | null): string | null {
  return status === null ? null : [status.headHash, status.branch, status.upstream, status.ahead, status.behind].join('|')
}
