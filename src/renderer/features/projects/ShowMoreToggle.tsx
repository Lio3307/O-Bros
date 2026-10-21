interface ShowMoreToggleProps {
  hiddenCount: number
  canShowFewer: boolean
  onChange: (isExpanded: boolean) => void
}

export function ShowMoreToggle({ hiddenCount, canShowFewer, onChange }: ShowMoreToggleProps) {
  if (hiddenCount > 0) {
    return (
      <button type="button" className="folder-sessions-more" onClick={() => onChange(true)}>
        Show {hiddenCount} more
      </button>
    )
  }
  if (canShowFewer) {
    return (
      <button type="button" className="folder-sessions-more" onClick={() => onChange(false)}>
        Show fewer
      </button>
    )
  }
  return null
}
