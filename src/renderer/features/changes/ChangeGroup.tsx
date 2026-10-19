import { Minus, Plus, Undo2 } from 'lucide-react'
import { lastPathSegment } from '../../../shared/paths'
import type { GitFileChange } from '../../../shared/types'
import { useChangesStore } from '../../state/changesStore'
import { askToConfirm } from '../../state/confirmStore'
import { Button } from '../../ui/Button'
import { LineCounts } from './LineCounts'

const kindMark: Record<GitFileChange['kind'], string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  renamed: 'R',
  untracked: 'U',
  conflicted: '!'
}

interface ChangeGroupProps {
  title: string
  changes: GitFileChange[]
  repoPath: string
}

async function confirmDiscard(change: GitFileChange): Promise<boolean> {
  const isUntracked = change.kind === 'untracked'
  return askToConfirm({
    title: 'Discard changes?',
    message: isUntracked
      ? `"${change.path}" is a new file. It moves to the Recycle Bin or Trash.`
      : `Your edits to "${change.path}" are removed and cannot be restored.`,
    confirmLabel: 'Discard'
  })
}

async function discardAfterConfirm(repoPath: string, change: GitFileChange): Promise<void> {
  if (await confirmDiscard(change)) {
    await useChangesStore.getState().discard(repoPath, change)
  }
}

export function ChangeGroup({ title, changes, repoPath }: ChangeGroupProps) {
  const selectedChange = useChangesStore((state) => state.selectedChange)
  const isWorking = useChangesStore((state) => state.isWorking)
  const select = useChangesStore((state) => state.select)
  const stage = useChangesStore((state) => state.stage)
  const unstage = useChangesStore((state) => state.unstage)

  if (changes.length === 0) {
    return null
  }

  const isStagedGroup = changes[0].isStaged
  const allPaths = changes.map((change) => change.path)

  return (
    <section>
      <div className="change-group-header">
        <h3 className="section-label change-group-title">{title}</h3>
        <Button
          variant="link"
          disabled={isWorking}
          onClick={() => (isStagedGroup ? unstage(repoPath, allPaths) : stage(repoPath, allPaths))}
        >
          {isStagedGroup ? 'Unstage all' : 'Stage all'}
        </Button>
      </div>
      {changes.map((change) => {
        const isSelected = selectedChange?.path === change.path && selectedChange.isStaged === change.isStaged
        return (
          <div key={`${change.isStaged}-${change.path}`} className="change-item">
            <button
              type="button"
              className={isSelected ? 'row row-change row-selected' : 'row row-change'}
              title={change.path}
              onClick={() => select(change)}
            >
              <span className={`change-mark change-mark-${change.kind}`}>{kindMark[change.kind]}</span>
              <span className="change-name">{lastPathSegment(change.path) || change.path}</span>
              <LineCounts addedLines={change.addedLines} removedLines={change.removedLines} />
            </button>
            <div className="change-actions">
              {!isStagedGroup && (
                <button
                  type="button"
                  title="Discard changes"
                  disabled={isWorking}
                  onClick={() => discardAfterConfirm(repoPath, change)}
                >
                  <Undo2 size={14} />
                </button>
              )}
              <button
                type="button"
                title={isStagedGroup ? 'Unstage' : 'Stage'}
                disabled={isWorking}
                onClick={() => (isStagedGroup ? unstage(repoPath, [change.path]) : stage(repoPath, [change.path]))}
              >
                {isStagedGroup ? <Minus size={14} /> : <Plus size={14} />}
              </button>
            </div>
          </div>
        )
      })}
    </section>
  )
}
