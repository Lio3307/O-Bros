import { LIST_BATCH_SIZE } from './useListBatch'

interface ShowMoreRowProps {
  hiddenCount: number
  onShowMore: () => void
  indent?: number
}

export function ShowMoreRow({ hiddenCount, onShowMore, indent }: ShowMoreRowProps) {
  if (hiddenCount === 0) {
    return null
  }
  return (
    <button type="button" className="row show-more-row" style={{ paddingLeft: indent }} onClick={onShowMore}>
      <span>
        Show {Math.min(hiddenCount, LIST_BATCH_SIZE).toLocaleString()} more ({hiddenCount.toLocaleString()} not shown)
      </span>
    </button>
  )
}
