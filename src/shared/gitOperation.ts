import type { GitOperation, GitOperationKind } from './types'

export interface OperationSummary {
  title: string
  detail: string
  continueLabel: string | null
}

const CONTINUE_LABELS: Record<GitOperationKind, string> = {
  merge: 'Commit merge',
  rebase: 'Continue rebase',
  cherryPick: 'Continue cherry-pick',
  revert: 'Continue revert'
}

const NOUNS: Record<GitOperationKind, string> = {
  merge: 'merge',
  rebase: 'rebase',
  cherryPick: 'cherry-pick',
  revert: 'revert'
}

function titleOf(operation: GitOperation | null): string {
  if (operation === null) {
    return 'Conflicts'
  }
  const { kind, incoming } = operation
  if (kind === 'merge') {
    return incoming === null ? 'Merging' : `Merging ${incoming}`
  }
  if (kind === 'rebase') {
    return incoming === null ? 'Rebasing' : `Rebasing ${incoming}`
  }
  const verb = kind === 'cherryPick' ? 'Cherry-picking' : 'Reverting'
  return incoming === null ? `${verb} a commit` : `${verb} “${incoming}”`
}

function conflictCountText(count: number): string {
  return count === 1 ? '1 file has conflicts.' : `${count} files have conflicts.`
}

export function summarizeOperation(operation: GitOperation | null, conflictCount: number): OperationSummary | null {
  if (operation === null && conflictCount === 0) {
    return null
  }
  const detail =
    conflictCount > 0
      ? `${conflictCountText(conflictCount)} For each one, use the current or the incoming version, or fix it in the editor and mark it resolved with ✓.`
      : `All conflicts are resolved. Continue to finish the ${operation === null ? 'change' : NOUNS[operation.kind]}.`
  return {
    title: titleOf(operation),
    detail,
    continueLabel: operation === null ? null : CONTINUE_LABELS[operation.kind]
  }
}
