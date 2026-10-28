import type { CSSProperties } from 'react'
import { normalizeHexColor } from '../../../shared/hexColor'
import { useActiveColorTheme } from '../../state/colorThemeStore'
import { useEditorSettingsStore } from '../../state/editorSettingsStore'
import { Button } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { SettingsSection } from '../../ui/SettingsSection'
import { CURSOR_SHAPES, type CursorShape } from '../editor/editorSettings'

const FALLBACK_PICKER_COLOR = '#ffffff'
const SHAPE_LABELS: Record<CursorShape, string> = { line: 'Line', block: 'Block', underline: 'Underline' }

function CursorPreview({ shape, color, blinks }: { shape: CursorShape; color: string; blinks: boolean }) {
  const theme = useActiveColorTheme()
  return (
    <div className="cursor-preview" style={{ backgroundColor: theme.background, color: theme.foreground }} aria-hidden="true">
      <span>const total = 4</span>
      <span className={cn('cursor-preview-caret', `cursor-preview-${shape}`, blinks && 'cursor-preview-blinking')} style={{ '--caret-color': color } as CSSProperties}>
        2
      </span>
    </div>
  )
}

export function TextCursorSetting() {
  const settings = useEditorSettingsStore()
  const themeCursor = useActiveColorTheme().cursor
  const shownColor = settings.cursorColor ?? themeCursor

  return (
    <SettingsSection
      title="Text cursor"
      description="The blinking mark where you type in the editor. The terminal draws its own cursor, which programs such as Vim or your agent can change."
    >
      <CursorPreview shape={settings.cursorShape} color={shownColor} blinks={settings.cursorBlinks} />
      <div className="settings-row">
        <span className="settings-row-label">Shape</span>
        <SegmentedControl
          options={CURSOR_SHAPES.map((shape) => ({ value: shape, label: SHAPE_LABELS[shape] }))}
          value={settings.cursorShape}
          onChange={settings.setCursorShape}
        />
      </div>
      <div className="settings-row">
        <span className="settings-row-label">Color</span>
        <label className="cursor-color-pick" title="Choose a color">
          <input type="color" value={normalizeHexColor(shownColor) ?? FALLBACK_PICKER_COLOR} onChange={(event) => settings.setCursorColor(event.target.value)} />
          <span className="mono">{settings.cursorColor === null ? 'Theme color' : settings.cursorColor}</span>
        </label>
        {settings.cursorColor !== null && (
          <Button variant="outline" onClick={() => settings.setCursorColor(null)}>
            Use the theme color
          </Button>
        )}
      </div>
      <label className="toggle-row">
        <input type="checkbox" role="switch" checked={settings.cursorBlinks} onChange={(event) => settings.setCursorBlinks(event.target.checked)} />
        <span>Blink</span>
      </label>
      <label className="toggle-row">
        <input type="checkbox" role="switch" checked={settings.cursorGlides} onChange={(event) => settings.setCursorGlides(event.target.checked)} />
        <span>Glide smoothly between positions (it trails a little behind fast typing)</span>
      </label>
    </SettingsSection>
  )
}
