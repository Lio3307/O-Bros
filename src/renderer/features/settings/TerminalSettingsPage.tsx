import { SCROLLBACK_CHOICES, useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import './settings.css'
import './settingsControls.css'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import { SegmentedControl } from '../../ui/SegmentedControl'

export function TerminalSettingsPage() {
  const scrollback = useTerminalSettingsStore((state) => state.scrollback)
  const setScrollback = useTerminalSettingsStore((state) => state.setScrollback)
  const notifyWhenFinished = useTerminalSettingsStore((state) => state.notifyWhenFinished)
  const setNotifyWhenFinished = useTerminalSettingsStore((state) => state.setNotifyWhenFinished)

  return (
    <SettingsPageLayout
      title="Terminal"
      description="Zoom the terminal text with Ctrl and + or -. Search inside a terminal with Ctrl+F."
    >
      <SettingsSection
        title="History kept per terminal"
        description={
          <>
            Lines you can scroll back to. Every terminal keeps its own history in memory, so a smaller number uses less
            memory when you have many terminals open.
          </>
        }
      >
        <SegmentedControl
          className="settings-segmented"
          options={SCROLLBACK_CHOICES.map((lines) => ({ value: lines, label: `${lines.toLocaleString()} lines` }))}
          value={scrollback}
          onChange={setScrollback}
        />
      </SettingsSection>

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
    </SettingsPageLayout>
  )
}
