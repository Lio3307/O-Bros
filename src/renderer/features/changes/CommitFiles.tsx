import { lastPathSegment } from '../../../shared/paths'
import type { GitCommit } from '../../../shared/types'
import { useChangesStore } from '../../state/changesStore'
import { useCommitHistoryStore } from '../../state/commitHistoryStore'
import { LineCounts } from './LineCounts'

export function CommitFiles({ commit }: { commit: GitCommit }) {
  const files = useCommitHistoryStore((state) => state.filesByHash[commit.hash])
  const selectedCommitFile = useChangesStore((state) => state.selectedCommitFile)
  const selectCommitFile = useChangesStore((state) => state.selectCommitFile)

  if (files === undefined) {
    return <p className="panel-empty">Looking…</p>
  }
  if (files.length === 0) {
    return <p className="panel-empty">No files changed.</p>
  }

  return (
    <div className="commit-files">
      {files.map((file) => {
        const isSelected = selectedCommitFile?.hash === commit.hash && selectedCommitFile.path === file.path
        return (
          <button
            key={file.path}
            type="button"
            className={isSelected ? 'row row-change row-selected' : 'row row-change'}
            title={file.path}
            onClick={() =>
              selectCommitFile({
                hash: commit.hash,
                path: file.path,
                addedLines: file.addedLines,
                removedLines: file.removedLines
              })
            }
          >
            <span className="change-name">{lastPathSegment(file.path) || file.path}</span>
            <LineCounts addedLines={file.addedLines} removedLines={file.removedLines} />
          </button>
        )
      })}
    </div>
  )
}
