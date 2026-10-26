import { useTerminalSettingsStore } from '../../../state/terminalSettingsStore'
import { SegmentedControl } from '../../../ui/SegmentedControl'
import { SettingsSection } from '../../../ui/SettingsSection'
import { AGENT_POLICY_NOTES, AGENT_POLICY_OPTIONS } from '../agentPolicyOptions'

export function AgentHostSetting() {
  const agentHostPolicy = useTerminalSettingsStore((state) => state.agentHostPolicy)
  const setAgentHostPolicy = useTerminalSettingsStore((state) => state.setAgentHostPolicy)

  return (
    <SettingsSection
      title="Agents and gh or glab"
      description={
        <>
          What happens when an agent in an O-BROS terminal runs a gh or glab command that changes something on GitHub or
          GitLab (create, merge, close, comment, review, release, delete, settings, secrets, workflow runs, or an API call
          that sends data), or that shows your sign-in token. Reading, such as view, list, status, checks and diff, always
          works, and your own commands are never stopped.
        </>
      }
    >
      <SegmentedControl
        className="settings-segmented"
        options={AGENT_POLICY_OPTIONS}
        value={agentHostPolicy}
        onChange={setAgentHostPolicy}
      />
      <p className="muted">{AGENT_POLICY_NOTES[agentHostPolicy]}</p>
      <p className="muted">
        &quot;Generated with&quot; and &quot;Co-Authored-By&quot; lines are removed from the pull requests, issues,
        comments and releases agents write, unless you let agents add themselves as co-author in Settings → Terminal.
      </p>
    </SettingsSection>
  )
}
