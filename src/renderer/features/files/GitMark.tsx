import type { FileChangeKind } from '../../../shared/types'

interface MarkLook {
  letter: string
  label: string
}

const LOOK_BY_KIND: Record<FileChangeKind, MarkLook> = {
  modified: { letter: 'M', label: 'Changed since the last commit' },
  added: { letter: 'A', label: 'New, staged for the next commit' },
  untracked: { letter: 'U', label: 'New, not in git yet' },
  deleted: { letter: 'D', label: 'Deleted since the last commit' },
  renamed: { letter: 'R', label: 'Renamed since the last commit' },
  conflicted: { letter: '!', label: 'Has a merge conflict' }
}

export function gitKindClass(kind: FileChangeKind | undefined): string | false {
  return kind !== undefined && `git-${kind}`
}

export function GitLetter({ kind }: { kind: FileChangeKind }) {
  const look = LOOK_BY_KIND[kind]
  return (
    <span className={`git-letter git-${kind}`} title={look.label} aria-label={look.label}>
      {look.letter}
    </span>
  )
}

export function GitFolderDot({ kind }: { kind: FileChangeKind }) {
  return <span className={`git-dot git-${kind}`} title="Something inside changed since the last commit" aria-label="Has changes" />
}
