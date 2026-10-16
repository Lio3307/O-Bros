import { Search } from 'lucide-react'
import { useState } from 'react'
import { useColorThemeStore } from '../../state/colorThemeStore'
import { COLOR_THEMES, findColorTheme } from '../../theme/colorThemes'
import { SettingsSection } from '../../ui/SettingsSection'
import './settingsControls.css'

export function ColorThemeSetting() {
  const themeId = useColorThemeStore((state) => state.themeId)
  const setTheme = useColorThemeStore((state) => state.setTheme)
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()
  const shownThemes = COLOR_THEMES.filter((theme) => theme.label.toLowerCase().includes(normalizedQuery))

  return (
    <SettingsSection
      title="Color theme"
      description="Colors for code in the editor and for the terminal. It applies to every open file and terminal right away."
    >
      <label className="find-field">
        <Search size={14} />
        <input placeholder="Search themes" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="theme-summary muted">
        <span>Selected: {findColorTheme(themeId).label}</span>
        <span>
          Showing {shownThemes.length} of {COLOR_THEMES.length}
        </span>
      </div>
      <div className="theme-list">
        {shownThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={theme.id === themeId ? 'theme-row theme-row-selected' : 'theme-row'}
            onClick={() => setTheme(theme.id)}
          >
            <span className="theme-name">{theme.label}</span>
            <span className="theme-preview" style={{ backgroundColor: theme.background, color: theme.foreground }}>
              <span style={{ color: theme.code.keyword }}>const</span>{' '}
              <span style={{ color: theme.code.functionName }}>run</span> ={' '}
              <span style={{ color: theme.code.string }}>&apos;hi&apos;</span>{' '}
              <span style={{ color: theme.code.number }}>42</span>
            </span>
            {theme.id === themeId && <span className="theme-current">CURRENT</span>}
          </button>
        ))}
        {shownThemes.length === 0 && <p className="panel-empty">No theme matches your search.</p>}
      </div>
    </SettingsSection>
  )
}
