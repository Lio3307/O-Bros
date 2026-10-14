import { useEffect, useState } from 'react'
import { useEditorSettingsStore } from '../../state/editorSettingsStore'
import { SettingsSection } from '../../ui/SettingsSection'
import {
  AUTO_SAVE_DELAY_PRESETS_MS,
  AUTO_SAVE_MAX_DELAY_MS,
  AUTO_SAVE_MIN_DELAY_MS
} from '../editor/editorSettings'
import { SegmentedControl } from '../../ui/SegmentedControl'

function describeDelay(delayMs: number): string {
  return delayMs >= 1000 && delayMs % 1000 === 0 ? `${delayMs / 1000} s` : `${delayMs} ms`
}

export function AutoSaveSetting() {
  const isEnabled = useEditorSettingsStore((state) => state.autoSaveEnabled)
  const delayMs = useEditorSettingsStore((state) => state.autoSaveDelayMs)
  const setEnabled = useEditorSettingsStore((state) => state.setAutoSaveEnabled)
  const setDelay = useEditorSettingsStore((state) => state.setAutoSaveDelay)
  const [draft, setDraft] = useState(String(delayMs))

  useEffect(() => setDraft(String(delayMs)), [delayMs])

  function commitDraft(): void {
    const typed = Number(draft)
    setDelay(draft.trim() === '' ? delayMs : typed)
    setDraft(String(useEditorSettingsStore.getState().autoSaveDelayMs))
  }

  return (
    <SettingsSection
      title="Auto save"
      description={
        <>
          Saves a file after you stop typing for the delay below. Auto save does not format the file, so your cursor
          never jumps. Use Ctrl+S when you want format on save to run.
        </>
      }
    >
      <label className="toggle-row">
        <input type="checkbox" checked={isEnabled} onChange={(event) => setEnabled(event.target.checked)} />
        <span>Save files automatically</span>
      </label>

      <div className={isEnabled ? 'auto-save-controls' : 'auto-save-controls auto-save-controls-off'}>
        <SegmentedControl
          className="settings-segmented"
          options={AUTO_SAVE_DELAY_PRESETS_MS.map((preset) => ({ value: preset, label: describeDelay(preset) }))}
          value={delayMs}
          disabled={!isEnabled}
          onChange={setDelay}
        />
        <label className="auto-save-custom">
          <span className="muted">Custom delay</span>
          <input
            className="field auto-save-input"
            type="number"
            inputMode="numeric"
            min={AUTO_SAVE_MIN_DELAY_MS}
            max={AUTO_SAVE_MAX_DELAY_MS}
            step={50}
            disabled={!isEnabled}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => event.key === 'Enter' && commitDraft()}
          />
          <span className="muted">milliseconds ({AUTO_SAVE_MIN_DELAY_MS} to {AUTO_SAVE_MAX_DELAY_MS.toLocaleString()})</span>
        </label>
      </div>
    </SettingsSection>
  )
}
