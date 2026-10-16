import type { FileChangeKind } from '../../shared/types'

export interface ParsedReviewEntry {
  path: string
  kind: FileChangeKind
}

function kindFromStatus(status: string): FileChangeKind {
  if (status === 'A') {
    return 'added'
  }
  return status === 'D' ? 'deleted' : 'modified'
}

export function parseNameStatus(output: string): ParsedReviewEntry[] {
  const entries: ParsedReviewEntry[] = []
  for (const line of output.split('\n')) {
    const [status, path] = line.split('\t')
    if (status !== undefined && path !== undefined && path !== '') {
      entries.push({ path, kind: kindFromStatus(status.charAt(0)) })
    }
  }
  return entries
}

export function newUntrackedPaths(currentPaths: string[], baselinePaths: string[]): string[] {
  const known = new Set(baselinePaths)
  return currentPaths.filter((path) => !known.has(path))
}

export function splitLines(output: string): string[] {
  return output.split('\n').filter((line) => line !== '')
}
