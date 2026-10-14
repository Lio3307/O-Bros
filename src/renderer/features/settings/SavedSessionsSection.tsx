import { formatBytes } from '../../../shared/format'
import { formatAge } from '../../../shared/time'
import type { ProviderId, SessionStorageReport } from '../../../shared/types'
import { useHistoryStore } from '../../state/historyStore'
import { useStorageStore } from '../../state/storageStore'
import { CleanupRow, pluralize } from './CleanupRow'
import './settings.css'
import './settingsControls.css'
import { SettingsSection } from '../../ui/SettingsSection'

const PROVIDER_NAMES: Record<ProviderId, string> = { claude: 'Claude', codex: 'Codex' }

function bucketTitle(days: number | null): string {
  return days === null ? 'All sessions' : 'Not used for ' + days + ' days or more'
}

function ProviderSessions({ report }: { report: SessionStorageReport }) {
  const removeOldSessions = useStorageStore((state) => state.removeOldSessions)
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
            description={'Sessions ' + name + ' can no longer resume once deleted.'}
            amount={pluralize(bucket.sessionCount, 'session', 'sessions') + ', ' + formatBytes(bucket.totalBytes)}
            buttonLabel="Delete"
            isDisabled={bucket.sessionCount === 0}
            onClean={() => removeOldSessions(report.provider, bucket)}
          />
        ))}
      </div>
    </div>
  )
}

export function SavedSessionsSection() {
  const reports = useStorageStore((state) => state.sessionReports)
  const deletePermanently = useHistoryStore((state) => state.deletePermanently)
  const setDeletePermanently = useHistoryStore((state) => state.setDeletePermanently)

  return (
    <SettingsSection
      title="Saved conversations (what Resume uses)"
      description={
        <>
          Claude and Codex save every conversation as a file so you can resume it. o-bros lists them in History, where
          each one has a Resume button. Nothing here is loaded into memory until you open one.
        </>
      }
    >
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={deletePermanently}
          onChange={(event) => setDeletePermanently(event.target.checked)}
        />
        <span>Delete permanently instead of moving to the Recycle Bin or Trash</span>
      </label>

      {reports === null && <p className="muted">Measuring.</p>}
      {reports?.map((report) => <ProviderSessions key={report.provider} report={report} />)}

      <h3 className="settings-subtitle">What keeping and deleting costs you</h3>
      <p className="muted">
        <strong>Keeping a session</strong> costs disk space only, not memory. In exchange you can resume it later with
        its full context and read it in History. Resuming a long session loads its whole conversation back into the
        model, which can use more of your usage limit and be slower than starting fresh.
      </p>
      <p className="muted">
        <strong>Deleting a session</strong> frees disk space, but you can no longer resume or read it. The Recycle Bin
        keeps it recoverable, but the space is only freed when you empty it. Permanent delete frees the space at once
        and cannot be undone.
      </p>
      <p className="muted">
        Deleting never touches your project files, git history, logins, or the notes the tools keep about your
        projects.
      </p>
    </SettingsSection>
  )
}
