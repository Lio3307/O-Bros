import type { ReactNode } from 'react'
import type { StatusTone } from './StatusDot'
import './card.css'

interface ChipProps {
  icon?: ReactNode
  title?: string
  tone?: StatusTone
  children: ReactNode
}

export function Chip({ icon, title, tone = 'neutral', children }: ChipProps) {
  return (
    <span className={tone === 'neutral' ? 'chip' : `chip chip-${tone}`} title={title}>
      {icon}
      {children}
    </span>
  )
}
