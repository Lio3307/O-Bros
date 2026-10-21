import { formatBytes } from '../../../shared/format'
import { formatAge } from '../../../shared/time'
import type { ProviderId, SessionStorageReport } from '../../../shared/types'
import { useHistoryStore } from '../../state/historyStore'
import { useStorageStore } from '../../state/storageStore'
import { CleanupRow, pluralize } from './CleanupRow'
import './settings.css'
import './settingsControls.css'
import { SettingsSection } from '../../ui/SettingsSection'
import { LoadingText } from '../../ui/LoadingText'

const PROVIDER_NAMES: Record<ProviderId, string> = { claude: 'Claude', codex: 'Codex' }

function bucketTitle(days: number | null): string {
  return days === null ? 'All sessions' : 'Not used for ' + days + ' days or more'
}

function deleteEffect(name: string, deletePermanently: boolean): string {
  const where = deletePermanently ? 'gone for good' : 'in the Recycle Bin'
  return `${name} can no longer resume them (${where}). O-BROS's copy in the universal history stays.`
}

function ProviderSessions({ report }: { report: SessionStorageReport }) {
  const removeOldSessions = useStorageStore((state) => state.removeOldSessions)
  const deletePermanently = useHistoryStore((state) => state.deletePermanently)
  const name = PROVIDER_NAMES[report.provider]
  const oldestText = report.oldestAt === null ? 'none saved' : 'oldest ' + formatAge(report.oldestAt, Date.now())

  return (
    <div>
      <h3 className="settings-subtitle">
        {name}: {pluralize(report.sessionCount, 'session', 'sessions')}, {formatBytes(report.totalBytes)} ({oldestText})
      </h3>
      <div className="table">
        {report.buckets.map((bucket) => (
          <CleanupRow
            key={bucket.days ?? 'all'}
            title={bucketTitle(bucket.days)}
            description={`${name} conversations saved on this computer.`}
            amount={pluralize(bucket.sessionCount, 'session', 'sessions') + ', ' + formatBytes(bucket.totalBytes)}
            buttonLabel="Delete"
            safety={deletePermanently ? 'permanent' : 'undoable'}
            effect={deleteEffect(name, deletePermanently)}
            isDisabled={bucket.sessionCount === 0}
            onClean={() => removeOldSessions(report.provider, bucket)}
          />
        ))}
      </div>
    </div>
  )
}

function TeamChatsRow() {
  const teamChats = useStorageStore((state) => state.teamChats)
  const removeTeamChats = useStorageStore((state) => state.removeTeamChats)
  const deletePermanently = useHistoryStore((state) => state.deletePermanently)

  return (
    <div className="table">
      <CleanupRow
        title="Team member conversations"
        description="Conversations Claude and Codex team members had while a lead used them (marked Team member in History)."
        amount={teamChats === null ? null : `${pluralize(teamChats.sessionCount, 'conversation', 'conversations')}, ${formatBytes(teamChats.totalBytes)}`}
        buttonLabel="Delete"
        safety={deletePermanently ? 'permanent' : 'undoable'}
        effect={`a member's work in your files stays; ${deleteEffect('the member', deletePermanently)}`}
        isDisabled={teamChats === null || teamChats.sessionCount === 0}
        onClean={removeTeamChats}
      />
    </div>
  )
}

export function SavedSessionsSection() {
  const reports = useStorageStore((state) => state.sessionReports)
  const deletePermanently = useHistoryStore((state) => state.deletePermanently)
  const setDeletePermanently = useHistoryStore((state) => state.setDeletePermanently)

  return (
    <SettingsSection
      title="Delete old conversations"
      description={
        <>
          Claude and Codex save every conversation so you can resume it from History. They only use disk space, not
          memory. Delete the ones you will not resume to free space.
        </>
      }
    >
      <label className="toggle-row">
        <input type="checkbox" checked={deletePermanently} onChange={(event) => setDeletePermanently(event.target.checked)} />
        <span>Delete permanently instead of moving to the Recycle Bin or Trash</span>
      </label>
      <p className="muted">
        {deletePermanently
          ? 'Permanent: the space is freed at once, and deleted conversations cannot be brought back.'
          : 'Recycle Bin or Trash: you can restore them from there, but the space is only freed when you empty it.'}
      </p>

      {reports === null && <p className="muted"><LoadingText text="Measuring your saved conversations…" /></p>}
      {reports?.map((report) => <ProviderSessions key={report.provider} report={report} />)}
      <h3 className="settings-subtitle">Team members (wot)</h3>
      <TeamChatsRow />

      <div className="storage-tradeoff">
        <p>
          <strong>Keep</strong>: costs disk space only. You can resume with full context and read it in History. Resuming a
          very long conversation loads all of it again, which uses more of your plan limit than starting fresh.
        </p>
        <p>
          <strong>Delete</strong>: frees disk space. You can no longer resume or read it in the agent. Your project files,
          git history and logins are never touched.
        </p>
      </div>
    </SettingsSection>
  )
}
