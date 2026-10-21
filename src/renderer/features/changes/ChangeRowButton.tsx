import { lastPathSegment } from '../../../shared/paths'
import type { ReviewChange } from '../../../shared/types'
import { LineCounts } from './LineCounts'

interface ChangeRowButtonProps {
  change: ReviewChange
  mark: string
  isSelected: boolean
  onSelect: () => void
}

export function ChangeRowButton({ change, mark, isSelected, onSelect }: ChangeRowButtonProps) {
  return (
    <button
      type="button"
      className={isSelected ? 'row row-change row-selected' : 'row row-change'}
      title={change.path}
      onClick={onSelect}
    >
      <span className={`change-mark change-mark-${change.kind}`}>{mark}</span>
      <span className="change-name">{lastPathSegment(change.path) || change.path}</span>
      <LineCounts addedLines={change.addedLines} removedLines={change.removedLines} />
    </button>
  )
}
