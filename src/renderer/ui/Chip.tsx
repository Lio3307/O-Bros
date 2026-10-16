import type { ReactNode } from 'react'
import './card.css'

export function Chip({ icon, title, children }: { icon?: ReactNode; title?: string; children: ReactNode }) {
  return (
    <span className="chip" title={title}>
      {icon}
      {children}
    </span>
  )
}
