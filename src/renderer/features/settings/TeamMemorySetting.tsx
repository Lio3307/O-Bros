import { IDLE_STOP_CHOICES_MINUTES } from '../../../shared/teamPolicy'
import { useTeamPolicyStore } from '../../state/teamPolicyStore'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { SettingsSection } from '../../ui/SettingsSection'

const NEVER = 0

const STOP_OPTIONS = [
  ...IDLE_STOP_CHOICES_MINUTES.map((minutes) => ({ value: minutes, label: `After ${minutes} min` })),
  { value: NEVER, label: 'Never' }
]

export function TeamMemorySetting() {
  const policy = useTeamPolicyStore((state) => state.policy)
  const setPolicy = useTeamPolicyStore((state) => state.setPolicy)

  return (
    <SettingsSection
      title="Free memory automatically"
      description={
        <>
          Every team member is a running agent that uses memory. O-BROS can stop a member once it has finished its turn
          and stayed idle. A member that is asking a question is never stopped this way. Its conversation stays saved
          unless you tick the last option, so nothing is lost. You can always stop members yourself in the Team view or in Storage and memory.
        </>
      }
    >
      <p className="muted">Stop a member that finished and stayed idle:</p>
      <SegmentedControl
        className="settings-segmented"
        options={STOP_OPTIONS}
        value={policy.stopIdleAfterMinutes ?? NEVER}
        onChange={(minutes) => setPolicy({ stopIdleAfterMinutes: minutes === NEVER ? null : minutes })}
      />
      <label className="toggle-row">
        <input
          type="checkbox" role="switch"
          checked={policy.stopWhenSummonerCloses}
          onChange={(event) => setPolicy({ stopWhenSummonerCloses: event.target.checked })}
        />
        <span>Stop members when the agent that summoned them closes</span>
      </label>
      <label className="toggle-row">
        <input
          type="checkbox" role="switch"
          checked={policy.deleteChatWhenStopped}
          onChange={(event) => setPolicy({ deleteChatWhenStopped: event.target.checked })}
        />
        <span>
          Move a member's conversation to the Recycle Bin or Trash when it stops. Works for Claude and Codex members,
          whose conversations O-BROS can read; other agents keep theirs. You can no longer resume it; your files are not
          touched.
        </span>
      </label>
    </SettingsSection>
  )
}
