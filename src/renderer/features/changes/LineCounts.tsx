interface LineCountsProps {
  addedLines: number
  removedLines: number
}

export function LineCounts({ addedLines, removedLines }: LineCountsProps) {
  return (
    <span className="line-counts">
      <span className="count-added">+{addedLines}</span>
      <span className="count-removed">−{removedLines}</span>
    </span>
  )
}
