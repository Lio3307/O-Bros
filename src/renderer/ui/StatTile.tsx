import type { ReactNode } from 'react'
import './card.css'

export function StatTile({ value, label, children }: { value: string; label: string; children?: ReactNode }) {
  return (
    <div className="card stat-tile">
      <span className="stat-tile-value">{value}</span>
      <span className="stat-tile-label">{label}</span>
      {children}
    </div>
  )
}
