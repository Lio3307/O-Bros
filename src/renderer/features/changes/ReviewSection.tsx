import { RefreshCw, Undo2 } from 'lucide-react'
import { useEffect } from 'react'
import { lastPathSegment } from '../../../shared/paths'
import type { ReviewChange } from '../../../shared/types'
import { useChangesStore } from '../../state/changesStore'
import { askToConfirm } from '../../state/confirmStore'
import { useReviewStore } from '../../state/reviewStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { Button } from '../../ui/Button'
import { LineCounts } from './LineCounts'

const kindMark: Record<ReviewChange['kind'], string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  renamed: 'R',
  untracked: 'N'
}

function revertMessage(change: ReviewChange): string {
  if (change.kind === 'untracked' || change.kind === 'added') {
    return `"${change.path}" was created after this terminal started. It moves to the Recycle Bin or Trash.`
  }
  if (change.kind === 'deleted') {
    return `"${change.path}" is brought back as it was when this terminal started.`
  }
  return `"${change.path}" goes back to how it was when this terminal started. Edits made since then are removed.`
}

async function revertAfterConfirm(tabId: string, change: ReviewChange): Promise<void> {
  const isConfirmed = await askToConfirm({
    title: 'Put this file back?',
    message: revertMessage(change),
    confirmLabel: 'Put back'
  })
  if (isConfirmed) {
    await useReviewStore.getState().revert(tabId, change)
  }
}

export function ReviewSection({ repoPath }: { repoPath: string }) {
  const activeTabId = useWorkspaceStore((state) => state.activeTabId)
  const baseline = useReviewStore((state) => (activeTabId === null ? undefined : state.baselines[activeTabId]))
  const changes = useReviewStore((state) => (activeTabId === null ? undefined : state.changesByTab[activeTabId]))
  const isLoading = useReviewStore((state) => activeTabId !== null && state.isLoadingTabIds.includes(activeTabId))
  const refresh = useReviewStore((state) => state.refresh)
  const status = useChangesStore((state) => state.status)
  const selectedReview = useChangesStore((state) => state.selectedReview)
  const selectReview = useChangesStore((state) => state.selectReview)

  useEffect(() => {
    if (activeTabId !== null) {
      void refresh(activeTabId)
    }
  }, [activeTabId, status, refresh])

  if (activeTabId === null || baseline === undefined || baseline.repoPath !== repoPath) {
    return null
  }

  return (
    <section>
      <div className="change-group-header">
        <h3 className="section-label change-group-title">Since this terminal started</h3>
        <Button variant="icon" title="Look for changes again" disabled={isLoading} onClick={() => refresh(activeTabId)}>
          <RefreshCw size={14} className={isLoading ? 'spinning' : undefined} />
        </Button>
      </div>
      {changes !== undefined && changes.length === 0 && (
        <p className="muted review-empty">Nothing changed yet in this folder.</p>
      )}
      {(changes ?? []).map((change) => {
        const isSelected = selectedReview?.change.path === change.path
        return (
          <div key={change.path} className="change-item">
            <button
              type="button"
              className={isSelected ? 'row row-change row-selected' : 'row row-change'}
              title={change.path}
              onClick={() => selectReview({ baseline, change })}
            >
              <span className={`change-mark change-mark-${change.kind}`}>{kindMark[change.kind]}</span>
              <span className="change-name">{lastPathSegment(change.path) || change.path}</span>
              <LineCounts addedLines={change.addedLines} removedLines={change.removedLines} />
            </button>
            <div className="change-actions">
              <button type="button" title="Put this file back" onClick={() => revertAfterConfirm(activeTabId, change)}>
                <Undo2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </section>
  )
}
