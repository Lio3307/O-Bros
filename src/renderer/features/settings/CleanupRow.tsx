import type { ReactNode } from 'react'
import { Button } from '../../ui/Button'
import { LoadingText } from '../../ui/LoadingText'

interface CleanupRowProps {
  title: string
  description: string
  amount: string | null
  buttonLabel: string
  isDisabled: boolean
  onClean: () => void | Promise<unknown>
}

const MEASURING: ReactNode = <LoadingText text="Measuring" size={12} />

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
      <span className="muted cleanup-amount">{amount ?? MEASURING}</span>
      <Button variant="outline" disabled={isDisabled} onClick={onClean}>
        {buttonLabel}
      </Button>
    </div>
  )
}
