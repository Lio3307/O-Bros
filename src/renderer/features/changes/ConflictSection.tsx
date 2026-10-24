import { Check, FileWarning } from 'lucide-react'
import { summarizeOperation } from '../../../shared/gitOperation'
import { lastPathSegment, resolvePath } from '../../../shared/paths'
import type { GitFileChange, GitOperation } from '../../../shared/types'
import { useChangesStore } from '../../state/changesStore'
import { askToConfirm } from '../../state/confirmStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { Button } from '../../ui/Button'
import { Notice } from '../../ui/Notice'

interface ConflictSectionProps {
  repoPath: string
  operation: GitOperation | null
  conflicts: GitFileChange[]
}

async function abortAfterConfirm(repoPath: string, title: string): Promise<void> {
  const isConfirmed = await askToConfirm({
    title: 'Cancel and go back?',
    message: `${title} stops, and the branch goes back to how it was before it started. Conflicts you already resolved are thrown away.`,
    confirmLabel: 'Cancel it'
  })
  if (isConfirmed) {
    await useChangesStore.getState().abortOperation(repoPath)
  }
}

function ConflictRow({ repoPath, change }: { repoPath: string; change: GitFileChange }) {
  const isWorking = useChangesStore((state) => state.isWorking)
  const resolveConflict = useChangesStore((state) => state.resolveConflict)
  const openFileTab = useWorkspaceStore((state) => state.openFileTab)

  return (
    <div className="conflict-item">
      <div className="conflict-row">
        <button
          type="button"
          className="row row-change"
          title={`Open ${change.path} in the editor`}
          onClick={() => openFileTab(resolvePath(repoPath, change.path))}
        >
          <span className="change-mark change-mark-conflicted">!</span>
          <span className="change-name">{lastPathSegment(change.path) || change.path}</span>
        </button>
        <button
          type="button"
          className="conflict-resolve"
          aria-label="Mark resolved"
          title="Mark resolved: you fixed the file by hand"
          disabled={isWorking}
          onClick={() => resolveConflict(repoPath, change.path, null)}
        >
          <Check size={14} />
        </button>
      </div>
      <div className="conflict-actions">
        <Button
          variant="outline"
          className="conflict-action"
          disabled={isWorking}
          title="Keep the version that was on this branch before"
          onClick={() => resolveConflict(repoPath, change.path, 'current')}
        >
          Use current
        </Button>
        <Button
          variant="outline"
          className="conflict-action"
          disabled={isWorking}
          title="Take the version that is being brought in"
          onClick={() => resolveConflict(repoPath, change.path, 'incoming')}
        >
          Use incoming
        </Button>
      </div>
    </div>
  )
}

export function ConflictSection({ repoPath, operation, conflicts }: ConflictSectionProps) {
  const isWorking = useChangesStore((state) => state.isWorking)
  const continueOperation = useChangesStore((state) => state.continueOperation)
  const summary = summarizeOperation(operation, conflicts.length)
  if (summary === null) {
    return null
  }

  return (
    <section className="conflict-section">
      <Notice
        tone="danger"
        className="conflict-banner"
        title={summary.title}
        actions={
          summary.continueLabel === null ? undefined : (
            <>
              <Button
                variant="primary"
                disabled={isWorking || conflicts.length > 0}
                onClick={() => continueOperation(repoPath)}
              >
                {summary.continueLabel}
              </Button>
              <Button variant="outline" disabled={isWorking} onClick={() => abortAfterConfirm(repoPath, summary.title)}>
                Abort
              </Button>
            </>
          )
        }
      >
        {summary.detail}
      </Notice>
      {conflicts.length > 0 && (
        <>
          <h3 className="section-label change-group-title">
            <FileWarning size={12} /> Conflicts
          </h3>
          {conflicts.map((change) => (
            <ConflictRow key={change.path} repoPath={repoPath} change={change} />
          ))}
        </>
      )}
    </section>
  )
}
