import type { ReactNode } from 'react'

interface SettingsPageLayoutProps {
  title: string
  description: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function SettingsPageLayout({ title, description, actions, children }: SettingsPageLayoutProps) {
  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1 className="settings-title">{title}</h1>
          <p className="muted">{description}</p>
        </div>
        {actions !== undefined && <div className="settings-header-actions">{actions}</div>}
      </header>
      {children}
    </div>
  )
}
