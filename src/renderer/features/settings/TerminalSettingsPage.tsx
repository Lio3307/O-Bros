import { SCROLLBACK_CHOICES, useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import './settings.css'
import './settingsControls.css'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { AgentCommitSetting } from './AgentCommitSetting'
import { ColorThemeSetting } from './ColorThemeSetting'

export function TerminalSettingsPage() {
  const scrollback = useTerminalSettingsStore((state) => state.scrollback)
  const setScrollback = useTerminalSettingsStore((state) => state.setScrollback)
  const notifyWhenFinished = useTerminalSettingsStore((state) => state.notifyWhenFinished)
  const setNotifyWhenFinished = useTerminalSettingsStore((state) => state.setNotifyWhenFinished)
  const askBeforeAgentGit = useTerminalSettingsStore((state) => state.askBeforeAgentGit)
  const useGpuRendering = useTerminalSettingsStore((state) => state.useGpuRendering)
  const setUseGpuRendering = useTerminalSettingsStore((state) => state.setUseGpuRendering)
  const setAskBeforeAgentGit = useTerminalSettingsStore((state) => state.setAskBeforeAgentGit)

  return (
    <SettingsPageLayout
      title="Terminal"
      description="Zoom the terminal text with Ctrl and + or -. Search inside a terminal with Ctrl+F."
    >
      <ColorThemeSetting />

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

      <SettingsSection
        title="Drawing"
        description={
          <>
            By default terminals are drawn without the graphics card, which uses less memory (about 25 MB less per open
            terminal). Turn this on only if a terminal that prints a lot of output feels slow.
          </>
        }
      >
        <label className="toggle-row">
          <input type="checkbox" checked={useGpuRendering} onChange={(event) => setUseGpuRendering(event.target.checked)} />
          <span>Draw terminals with the graphics card (faster, uses more memory)</span>
        </label>
      </SettingsSection>

      <SettingsSection
        title="Agents and git"
        description={
          <>
            When an agent started from O-BROS (an agent button, Resume, or a team member) tries to commit, push, or create,
            delete or rename a branch, O-BROS stops the command and asks you first. Team members are always asked about.
            Agents you start by typing their name in a plain terminal are not covered.
          </>
        }
      >
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={askBeforeAgentGit}
            onChange={(event) => setAskBeforeAgentGit(event.target.checked)}
          />
          <span>Ask me before an agent commits, pushes or creates a branch</span>
        </label>
      </SettingsSection>

      <AgentCommitSetting />

      <section className="settings-section">
        <h2 className="settings-subtitle">Notifications</h2>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={notifyWhenFinished}
            onChange={(event) => setNotifyWhenFinished(event.target.checked)}
          />
          <span>Notify me when a terminal finishes or asks me a question while I am elsewhere</span>
        </label>
        <p className="muted">
          o-bros watches terminal output. If a terminal prints for 8 seconds or more and then stays silent for 4
          seconds, you get a notification and a dot on its tab. If an agent asks a question such as "Do you want to proceed?" or a yes/no prompt, you are told right away that it is waiting for you.
        </p>
      </section>
    </SettingsPageLayout>
  )
}
