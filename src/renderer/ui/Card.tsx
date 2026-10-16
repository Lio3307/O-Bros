import type { ReactNode } from 'react'
import './card.css'

interface CardProps {
  title: string
  aside?: ReactNode
  children?: ReactNode
}

export function Card({ title, aside, children }: CardProps) {
  return (
    <section className="card">
      <header className="card-header">
        <h3 className="card-title">{title}</h3>
        {aside !== undefined && <span className="card-aside">{aside}</span>}
      </header>
      {children}
    </section>
  )
}
