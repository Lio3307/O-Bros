import { SCROLLBACK_CHOICES, useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import './settings.css'
import './settingsControls.css'

export function TerminalSettingsPage() {
  const scrollback = useTerminalSettingsStore((state) => state.scrollback)
  const setScrollback = useTerminalSettingsStore((state) => state.setScrollback)
  const notifyWhenFinished = useTerminalSettingsStore((state) => state.notifyWhenFinished)
  const setNotifyWhenFinished = useTerminalSettingsStore((state) => state.setNotifyWhenFinished)

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1 className="settings-title">Terminal</h1>
          <p className="muted">Zoom the terminal text with Ctrl and + or -. Search inside a terminal with Ctrl+F.</p>
        </div>
      </header>

      <section className="settings-section">
        <h2 className="settings-subtitle">History kept per terminal</h2>
        <p className="muted">
          Lines you can scroll back to. Every terminal keeps its own history in memory, so a smaller number uses less
          memory when you have many terminals open.
        </p>
        <div className="segmented settings-segmented">
          {SCROLLBACK_CHOICES.map((lines) => (
            <button
              key={lines}
              type="button"
              className={lines === scrollback ? 'segment segment-active' : 'segment'}
              onClick={() => setScrollback(lines)}
            >
              {lines.toLocaleString()} lines
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-subtitle">Notifications</h2>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={notifyWhenFinished}
            onChange={(event) => setNotifyWhenFinished(event.target.checked)}
          />
          <span>Notify me when a long-running terminal goes quiet while I am elsewhere</span>
        </label>
        <p className="muted">
          o-bros watches terminal output. If a terminal prints for 8 seconds or more and then stays silent for 4
          seconds, you get a notification and a dot on its tab.
        </p>
      </section>
    </div>
  )
}
