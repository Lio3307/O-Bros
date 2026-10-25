import { cn } from './cn'

export type UsageBarTone = 'normal' | 'danger'

const FILL_CLASS_BY_TONE: Record<UsageBarTone, string> = {
  normal: '',
  danger: 'usage-fill-danger'
}

interface UsageBarProps {
  percentUsed: number | null
  tone?: UsageBarTone
}

export function UsageBar({ percentUsed, tone = 'normal' }: UsageBarProps) {
  const width = percentUsed === null ? 0 : Math.min(percentUsed, 100)
  return (
    <div className="usage-track">
      <div className={cn('usage-fill', FILL_CLASS_BY_TONE[tone])} style={{ width: `${width}%` }} />
    </div>
  )
}
