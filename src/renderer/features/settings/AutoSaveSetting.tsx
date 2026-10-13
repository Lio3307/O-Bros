import { useEffect, useState } from 'react'
import { useEditorSettingsStore } from '../../state/editorSettingsStore'
import {
  AUTO_SAVE_DELAY_PRESETS_MS,
  AUTO_SAVE_MAX_DELAY_MS,
  AUTO_SAVE_MIN_DELAY_MS
} from '../editor/editorSettings'

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
    <section className="settings-section">
      <h2 className="settings-subtitle">Auto save</h2>
      <p className="muted">
        Saves a file after you stop typing for the delay below. Auto save does not format the file, so your cursor
        never jumps. Use Ctrl+S when you want format on save to run.
      </p>
      <label className="toggle-row">
        <input type="checkbox" checked={isEnabled} onChange={(event) => setEnabled(event.target.checked)} />
        <span>Save files automatically</span>
      </label>

      <div className={isEnabled ? 'auto-save-controls' : 'auto-save-controls auto-save-controls-off'}>
        <div className="segmented settings-segmented">
          {AUTO_SAVE_DELAY_PRESETS_MS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={!isEnabled}
              className={preset === delayMs ? 'segment segment-active' : 'segment'}
              onClick={() => setDelay(preset)}
            >
              {describeDelay(preset)}
            </button>
          ))}
        </div>
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
    </section>
  )
}
