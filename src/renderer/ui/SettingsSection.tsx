import type { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function SettingsSection({ title, description, actions, children }: SettingsSectionProps) {
  const heading = (
    <div>
      <h2 className="settings-subtitle">{title}</h2>
      {description !== undefined && <p className="muted">{description}</p>}
    </div>
  )

  return (
    <section className="settings-section">
      {actions === undefined ? (
        heading
      ) : (
        <div className="accounts-heading">
          {heading}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
