import type { AgentGitPolicy } from '../../../shared/agentGitPolicy'
import { SCROLLBACK_CHOICES, useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import './settings.css'
import './settingsControls.css'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { AgentCommitSetting } from './AgentCommitSetting'
import { ColorThemeSetting } from './ColorThemeSetting'

const AGENT_GIT_OPTIONS: { value: AgentGitPolicy; label: string }[] = [
  { value: 'block', label: 'Never allow' },
  { value: 'ask', label: 'Ask me' },
  { value: 'allow', label: 'Allow' }
]

const AGENT_GIT_NOTES: Record<AgentGitPolicy, string> = {
  block: 'Agents are refused right away and told that you do it yourself. Nothing is asked.',
  ask: 'O-BROS pauses the agent and asks you. No answer in 100 seconds means no.',
  allow: 'Agents may do it. Team members are still asked about.'
}

export function TerminalSettingsPage() {
  const scrollback = useTerminalSettingsStore((state) => state.scrollback)
  const setScrollback = useTerminalSettingsStore((state) => state.setScrollback)
  const notifyWhenFinished = useTerminalSettingsStore((state) => state.notifyWhenFinished)
  const setNotifyWhenFinished = useTerminalSettingsStore((state) => state.setNotifyWhenFinished)
  const agentGitPolicy = useTerminalSettingsStore((state) => state.agentGitPolicy)
  const useGpuRendering = useTerminalSettingsStore((state) => state.useGpuRendering)
  const setUseGpuRendering = useTerminalSettingsStore((state) => state.setUseGpuRendering)
  const setAgentGitPolicy = useTerminalSettingsStore((state) => state.setAgentGitPolicy)

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
          <input type="checkbox" role="switch" checked={useGpuRendering} onChange={(event) => setUseGpuRendering(event.target.checked)} />
          <span>Draw terminals with the graphics card (faster, uses more memory)</span>
        </label>
      </SettingsSection>

      <SettingsSection
        title="Agents and git"
        description={
          <>
            What happens when an agent in an O-BROS terminal tries to commit (also through merge, cherry-pick, revert or
            rebase), push, or create, delete or rename a branch or worktree. Agents are recognised by the program that runs
            git, so this also covers agents you start by typing their name. Your own git commands are never stopped.
          </>
        }
      >
        <SegmentedControl
          className="settings-segmented"
          options={AGENT_GIT_OPTIONS}
          value={agentGitPolicy}
          onChange={setAgentGitPolicy}
        />
        <p className="muted">{AGENT_GIT_NOTES[agentGitPolicy]}</p>
      </SettingsSection>

      <AgentCommitSetting />

      <section className="settings-section">
        <h2 className="settings-subtitle">Notifications</h2>
        <label className="toggle-row">
          <input
            type="checkbox" role="switch"
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
