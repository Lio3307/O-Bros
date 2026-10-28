import { formatResetsIn } from '../../shared/time'
import type { UsageWindow } from '../../shared/types'
import { cn } from './cn'
import { UsageBar } from './UsageBar'
import { isUsageHigh } from './usageText'

export function UsageCell({ label, window, now }: { label: string; window: UsageWindow | null; now: number }) {
  return (
    <div className="account-usage">
      <span className="account-usage-label">{label}</span>
      {window === null ? (
        <span className="muted">—</span>
      ) : (
        <span className={cn('usage-cell', isUsageHigh(window.percentUsed) && 'usage-high')}>
          <UsageBar percentUsed={window.percentUsed} tone={isUsageHigh(window.percentUsed) ? 'danger' : 'normal'} />
          <span className={isUsageHigh(window.percentUsed) ? undefined : 'muted'}>
            {window.percentUsed}% · {formatResetsIn(window.resetsAt, now)}
          </span>
        </span>
      )}
    </div>
  )
}
