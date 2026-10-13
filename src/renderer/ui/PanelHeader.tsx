import type { ReactNode } from 'react'

interface PanelHeaderProps {
  title: string
  children?: ReactNode
}

export function PanelHeader({ title, children }: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <span className="panel-title">{title}</span>
      <div className="panel-header-actions">{children}</div>
    </header>
  )
}
