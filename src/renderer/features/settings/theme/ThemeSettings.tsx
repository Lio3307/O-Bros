import { Download, FileUp } from 'lucide-react'
import { useRef } from 'react'
import { useColorThemeStore, type ThemeMode } from '../../../state/colorThemeStore'
import { Button } from '../../../ui/Button'
import { SegmentedControl } from '../../../ui/SegmentedControl'
import { SettingsSection } from '../../../ui/SettingsSection'
import { importThemeFiles, importThemesFromWarp } from './themeImportActions'
import { ThemePicker } from './ThemePicker'
import './themeSettings.css'

const MODE_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' }
]

const THEME_FILE_TYPES = '.yaml,.yml,.json'

export function ThemeSettings() {
  const mode = useColorThemeStore((state) => state.mode)
  const setMode = useColorThemeStore((state) => state.setMode)
  const setDarkTheme = useColorThemeStore((state) => state.setDarkTheme)
  const setLightTheme = useColorThemeStore((state) => state.setLightTheme)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const showsDark = mode !== 'light'
  const showsLight = mode !== 'dark'

  return (
    <SettingsSection
      title="Theme"
      description="Colors for the whole app, the terminal and the editor. Every change applies right away."
      actions={
        <>
          <Button variant="outline" onClick={() => void importThemesFromWarp()}>
            <Download size={14} /> Import from Warp
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={14} /> Import file…
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={THEME_FILE_TYPES}
            multiple
            hidden
            aria-label="Theme files to import"
            onChange={(event) => {
              void importThemeFiles(event.target.files)
              event.target.value = ''
            }}
          />
        </>
      }
    >
      <div className="theme-mode">
        <span className="theme-mode-label">Mode</span>
        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={setMode} />
      </div>
      {showsDark && (
        <ThemePicker
          title="Dark theme"
          description={mode === 'system' ? 'Used while your system is in dark mode.' : 'Used in dark mode.'}
          isDark
          onSelect={setDarkTheme}
        />
      )}
      {showsLight && (
        <ThemePicker
          title="Light theme"
          description={mode === 'system' ? 'Used while your system is in light mode.' : 'Used in light mode.'}
          isDark={false}
          onSelect={setLightTheme}
        />
      )}
      <p className="muted theme-import-note">
        Import reads Warp and Alacritty YAML themes and Windows Terminal color schemes (a single scheme or the schemes in its settings.json).
        Imported themes stay on this computer.
      </p>
    </SettingsSection>
  )
}
