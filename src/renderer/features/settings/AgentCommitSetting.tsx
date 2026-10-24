import { isValidCommitIdentity } from '../../../shared/commitIdentity'
import { useAgentCommitStore } from '../../state/agentCommitStore'
import { SettingsSection } from '../../ui/SettingsSection'
import './settingsControls.css'

export function AgentCommitSetting() {
  const identity = useAgentCommitStore((state) => state.identity)
  const setIdentity = useAgentCommitStore((state) => state.setIdentity)
  const allowAgentCoAuthors = useAgentCommitStore((state) => state.allowAgentCoAuthors)
  const setAllowAgentCoAuthors = useAgentCommitStore((state) => state.setAllowAgentCoAuthors)

  const isIncomplete = identity.name !== '' || identity.email !== ''
  const showWarning = isIncomplete && !isValidCommitIdentity(identity)

  return (
    <SettingsSection
      title="Commits made by agents"
      description={
        <>
          When an agent started from O-BROS (or a team member) commits, the commit is made with this name and email, not
          with your global git settings. Use your GitHub account so the commit shows as yours. If this is empty, O-BROS
          asks you the first time an agent commits. To keep your email private, use your GitHub noreply address.
        </>
      }
    >
      <div className="commit-identity-fields">
        <input
          className="field"
          placeholder="Name, for example the name on your GitHub account"
          value={identity.name}
          onChange={(event) => setIdentity({ ...identity, name: event.target.value })}
        />
        <input
          className="field"
          placeholder="Email, for example 12345+name@users.noreply.github.com"
          value={identity.email}
          onChange={(event) => setIdentity({ ...identity, email: event.target.value })}
        />
      </div>
      {showWarning && <p className="muted">Fill in both a name and a valid email address.</p>}
      <label className="toggle-row">
        <input
          type="checkbox" role="switch"
          checked={allowAgentCoAuthors}
          onChange={(event) => setAllowAgentCoAuthors(event.target.checked)}
        />
        <span>Let agents add themselves as co-author (a &quot;Co-Authored-By&quot; line in the message)</span>
      </label>
      <p className="muted">
        When this is off, O-BROS removes &quot;Co-Authored-By&quot; and &quot;Generated with&quot; lines from commits that
        agents make.
      </p>
    </SettingsSection>
  )
}
