import { useLayoutStore } from '../../state/layoutStore'
import { PanelHeader } from '../../ui/PanelHeader'
import { SETTINGS_GROUPS } from './settingsPages'

export function SettingsPanel() {
  const settingsPage = useLayoutStore((state) => state.settingsPage)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)

  return (
    <div className="panel-content">
      <PanelHeader title="Settings" />
      {SETTINGS_GROUPS.map((group) => (
        <section key={group.title} className="settings-nav-group">
          <h3 className="section-label settings-nav-label">{group.title}</h3>
          {group.pages.map(({ page, label, Icon }) => (
            <button
              key={page}
              type="button"
              className={page === settingsPage ? 'row row-selected' : 'row'}
              onClick={() => selectSettingsPage(page)}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}
