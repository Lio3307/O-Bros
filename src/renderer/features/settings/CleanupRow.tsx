interface CleanupRowProps {
  title: string
  description: string
  amount: string
  buttonLabel: string
  isDisabled: boolean
  onClean: () => void
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count + ' ' + (count === 1 ? singular : plural)
}

export function CleanupRow({ title, description, amount, buttonLabel, isDisabled, onClean }: CleanupRowProps) {
  return (
    <div className="table-row">
      <div className="cell cell-account">
        <span className="account-label">{title}</span>
        <span className="muted">{description}</span>
      </div>
      <span className="muted cleanup-amount">{amount}</span>
      <button type="button" className="button-outline" disabled={isDisabled} onClick={onClean}>
        {buttonLabel}
      </button>
    </div>
  )
}
