import type { ActivityOutcome } from '../../shared/activity'
import './statusDot.css'

const OUTCOME_LABELS: Record<ActivityOutcome, string> = { allowed: 'Allowed', denied: 'Denied' }

export function OutcomeBadge({ outcome }: { outcome: ActivityOutcome }) {
  return <span className={`outcome-badge outcome-badge-${outcome}`}>{OUTCOME_LABELS[outcome]}</span>
}
