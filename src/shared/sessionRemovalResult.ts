import { formatBytes } from './format'
import type { RemoveSessionsResult } from './types'

const IN_USE_CODES = ['EBUSY', 'EPERM', 'EACCES']

export function describeRemovalFailure(failureCodes: string[]): string {
  if (failureCodes.some((code) => IN_USE_CODES.includes(code))) {
    return 'Some sessions are open in Claude or Codex, or Windows would not let go of them. Close Claude and Codex (including their desktop apps) and try again.'
  }
  if (failureCodes.includes('STILL_THERE')) {
    return 'Some files were still there after deleting them. Close Claude and Codex and try again, or delete permanently.'
  }
  return 'Some sessions could not be deleted. The log file has the details (Settings → About and updates).'
}

export interface RemovalSummary {
  kind: 'success' | 'warning' | 'error'
  message: string
}

function sessions(count: number): string {
  return count === 1 ? '1 session' : `${count} sessions`
}

export function summarizeRemoval(result: RemoveSessionsResult, permanently: boolean): RemovalSummary {
  const where = permanently ? 'Deleted' : 'Moved to the Recycle Bin or Trash:'
  const removedText = `${where} ${sessions(result.removedCount)}, freeing ${formatBytes(result.freedBytes)}.`
  if (result.failedCount === 0) {
    return { kind: 'success', message: removedText }
  }
  const failedText = `${sessions(result.failedCount)} could not be deleted. ${result.failureReason ?? ''}`.trim()
  if (result.removedCount === 0) {
    return { kind: 'error', message: failedText }
  }
  return { kind: 'warning', message: `${removedText} ${failedText}` }
}
