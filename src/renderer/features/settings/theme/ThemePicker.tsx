import { Search, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { chosenThemeFor, useColorThemeStore } from '../../../state/colorThemeStore'
import { COLOR_THEMES, type ColorTheme, type ColorThemeId } from '../../../theme/colorThemes'
import { isDarkTheme } from '../../../theme/themeDerivation'
import { cn } from '../../../ui/cn'

const NORMAL_COLOR_COUNT = 8

interface ThemePickerProps {
  title: string
  description: string
  isDark: boolean
  onSelect: (themeId: ColorThemeId) => void
}

interface ThemeGroup {
  title: string
  themes: ColorTheme[]
  canRemove: boolean
}

function ThemeSwatches({ theme }: { theme: ColorTheme }) {
  return (
    <span className="theme-swatches" aria-hidden="true">
      {theme.ansi.slice(0, NORMAL_COLOR_COUNT).map((color, index) => (
        <span key={index} className="theme-swatch" style={{ backgroundColor: color }} />
      ))}
    </span>
  )
}

function ThemePreview({ theme }: { theme: ColorTheme }) {
  return (
    <span className="theme-preview" style={{ backgroundColor: theme.background, color: theme.foreground }}>
      <span style={{ color: theme.code.keyword }}>const</span> <span style={{ color: theme.code.functionName }}>run</span> ={' '}
      <span style={{ color: theme.code.string }}>&apos;hi&apos;</span> <span style={{ color: theme.code.number }}>42</span>
    </span>
  )
}

export function ThemePicker({ title, description, isDark, onSelect }: ThemePickerProps) {
  const importedThemes = useColorThemeStore((state) => state.importedThemes)
  const removeImportedTheme = useColorThemeStore((state) => state.removeImportedTheme)
  const selected = useColorThemeStore((state) => chosenThemeFor(state, isDark))
  const [query, setQuery] = useState('')
  const selectedRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const matchesQuery = (theme: ColorTheme) => theme.label.toLowerCase().includes(normalizedQuery)
  const builtIn = COLOR_THEMES.filter((theme) => isDarkTheme(theme) === isDark)
  const imported = importedThemes.filter((theme) => isDarkTheme(theme) === isDark)
  const groups: ThemeGroup[] = [
    { title: 'Built-in', themes: builtIn.filter(matchesQuery), canRemove: false },
    { title: 'Imported', themes: imported.filter(matchesQuery), canRemove: true }
  ].filter((group) => group.themes.length > 0)
  const shownCount = groups.reduce((total, group) => total + group.themes.length, 0)

  return (
    <div className="theme-picker">
      <div className="theme-picker-heading">
        <h3 className="theme-picker-title">{title}</h3>
        <p className="muted">{description}</p>
      </div>
      <label className="find-field">
        <Search size={14} />
        <input placeholder={`Search ${isDark ? 'dark' : 'light'} themes`} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="theme-summary muted">
        <span>Selected: {selected.label}</span>
        <span>
          Showing {shownCount} of {builtIn.length + imported.length}
        </span>
      </div>
      <div className="theme-list">
        {groups.map((group) => (
          <div key={group.title} className="theme-group" role="group" aria-label={`${group.title} ${isDark ? 'dark' : 'light'} themes`}>
            <div className="theme-group-title">{group.title}</div>
            {group.themes.map((theme) => {
              const isSelected = theme.id === selected.id
              return (
                <div key={theme.id} ref={isSelected ? selectedRowRef : undefined} className={cn('theme-row', isSelected && 'theme-row-selected')}>
                  <button type="button" className="theme-row-choose" aria-pressed={isSelected} onClick={() => onSelect(theme.id)}>
                    <span className="theme-name">{theme.label}</span>
                    <ThemeSwatches theme={theme} />
                    <ThemePreview theme={theme} />
                    {isSelected && <span className="theme-current">CURRENT</span>}
                  </button>
                  {group.canRemove && (
                    <button
                      type="button"
                      className="icon-button icon-button-small hover-danger"
                      title={`Remove ${theme.label}`}
                      onClick={() => removeImportedTheme(theme.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        {shownCount === 0 && <p className="panel-empty">No theme matches your search.</p>}
      </div>
    </div>
  )
}
