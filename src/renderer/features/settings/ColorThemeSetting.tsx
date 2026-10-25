import { Palette } from 'lucide-react'
import { useActiveColorTheme } from '../../state/colorThemeStore'
import { useLayoutStore } from '../../state/layoutStore'
import { Button } from '../../ui/Button'
import { SettingsSection } from '../../ui/SettingsSection'

export function ColorThemeSetting() {
  const theme = useActiveColorTheme()
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)

  return (
    <SettingsSection
      title="Color theme"
      description={`${theme.label}. One theme colors the whole app, the terminal and the editor.`}
      actions={
        <Button variant="outline" onClick={() => selectSettingsPage('appearance')}>
          <Palette size={14} /> Change in Appearance
        </Button>
      }
    />
  )
}
