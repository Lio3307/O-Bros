import type { ReactNode } from 'react'
import { Button } from '../../ui/Button'
import { LoadingText } from '../../ui/LoadingText'
import { SafetyLabel, type Safety } from './SafetyLabel'

interface CleanupRowProps {
  title: string
  description: string
  amount: string | null
  buttonLabel: string
  safety: Safety
  effect: string
  isDisabled: boolean
  onClean: () => void | Promise<unknown>
}

const MEASURING: ReactNode = <LoadingText text="Measuring" size={12} />

export function pluralize(count: number, singular: string, plural: string): string {
  return count + ' ' + (count === 1 ? singular : plural)
}

export function CleanupRow({ title, description, amount, buttonLabel, safety, effect, isDisabled, onClean }: CleanupRowProps) {
  return (
    <div className="table-row cleanup-row">
      <div className="cell cell-account">
        <span className="cleanup-title">
          <span className="account-label">{title}</span>
          <SafetyLabel safety={safety} />
        </span>
        <span className="muted">{description}</span>
      </div>
      <span className="cleanup-amount">{amount ?? MEASURING}</span>
      <Button variant="outline" title={`${buttonLabel}: ${effect}`} disabled={isDisabled} onClick={onClean}>
        {buttonLabel}
      </Button>
    </div>
  )
}
