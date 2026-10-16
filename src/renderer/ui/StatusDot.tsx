import './statusDot.css'

export type StatusTone = 'neutral' | 'info' | 'success' | 'danger'

export function StatusDot({ tone, isPulsing = false }: { tone: StatusTone; isPulsing?: boolean }) {
  return <span className={`status-dot status-dot-${tone}${isPulsing ? ' status-dot-pulsing' : ''}`} aria-hidden="true" />
}
