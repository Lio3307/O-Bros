import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatBytes } from '../../../shared/format'
import { formatAge } from '../../../shared/time'
import type { ProviderId, SessionStorageReport } from '../../../shared/types'
import { useHistoryStore } from '../../state/historyStore'
import { useStorageStore } from '../../state/storageStore'
import { Button } from '../../ui/Button'
import { LoadingText } from '../../ui/LoadingText'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { SettingsSection } from '../../ui/SettingsSection'
import { CleanupRow, pluralize } from './CleanupRow'
import { SafetyLabel } from './SafetyLabel'
import './settings.css'
import './settingsControls.css'

const PROVIDER_NAMES: Record<ProviderId, string> = { claude: 'Claude', codex: 'Codex' }
const EVERY_SESSION = 0

function ageLabel(days: number | null): string {
  return days === null ? 'All' : `Unused ${days}+ days`
}

function whereDeletedGoes(deletePermanently: boolean): string {
  return deletePermanently ? 'gone for good' : 'in the Recycle Bin'
}

function ProviderSessions({ report }: { report: SessionStorageReport }) {
  const removeOldSessions = useStorageStore((state) => state.removeOldSessions)
  const deletePermanently = useHistoryStore((state) => state.deletePermanently)
  const oldestDays = report.buckets.reduce<number | null>((largest, bucket) => (bucket.days !== null && (largest === null || bucket.days > largest) ? bucket.days : largest), null)
  const [selectedDays, setSelectedDays] = useState<number>(oldestDays ?? EVERY_SESSION)
  const bucket = report.buckets.find((candidate) => (candidate.days ?? EVERY_SESSION) === selectedDays) ?? report.buckets[0]
  const name = PROVIDER_NAMES[report.provider]
  const oldestText = report.oldestAt === null ? 'none saved' : `oldest ${formatAge(report.oldestAt, Date.now())}`

  return (
    <div className="table-row session-cleanup-row">
      <div className="cell cell-account">
        <span className="account-label">{name}</span>
        <span className="muted">
          {pluralize(report.sessionCount, 'conversation', 'conversations')}, {formatBytes(report.totalBytes)}, {oldestText}
        </span>
      </div>
      <SegmentedControl
        className="session-age"
        options={report.buckets.map((candidate) => ({ value: candidate.days ?? EVERY_SESSION, label: ageLabel(candidate.days) }))}
        value={selectedDays}
        onChange={setSelectedDays}
      />
      <span className="cleanup-amount">
        {bucket === undefined ? '' : `${pluralize(bucket.sessionCount, 'conversation', 'conversations')}, ${formatBytes(bucket.totalBytes)}`}
      </span>
      <Button
        variant="outline"
        className="hover-danger"
        title={`${name} can no longer resume them (${whereDeletedGoes(deletePermanently)}). O-BROS's copy in the universal history stays.`}
        disabled={bucket === undefined || bucket.sessionCount === 0}
        onClick={() => (bucket === undefined ? undefined : removeOldSessions(report.provider, bucket))}
      >
        <Trash2 size={14} /> Delete
      </Button>
    </div>
  )
}

function TeamChatsRow() {
  const teamChats = useStorageStore((state) => state.teamChats)
  const removeTeamChats = useStorageStore((state) => state.removeTeamChats)
  const deletePermanently = useHistoryStore((state) => state.deletePermanently)

  return (
    <CleanupRow
      title="Team member conversations"
      description="Conversations team members had while a lead used them."
      amount={teamChats === null ? null : `${pluralize(teamChats.sessionCount, 'conversation', 'conversations')}, ${formatBytes(teamChats.totalBytes)}`}
      buttonLabel="Delete"
      safety={deletePermanently ? 'permanent' : 'undoable'}
      effect={`the members can no longer resume them (${whereDeletedGoes(deletePermanently)}). Their work in your files and O-BROS's copy stay.`}
      isDisabled={teamChats === null || teamChats.sessionCount === 0}
      onClean={removeTeamChats}
    />
  )
}

export function SavedSessionsSection() {
  const reports = useStorageStore((state) => state.sessionReports)
  const deletePermanently = useHistoryStore((state) => state.deletePermanently)
  const setDeletePermanently = useHistoryStore((state) => state.setDeletePermanently)

  return (
    <SettingsSection
      title="Delete old conversations"
      description="Agents keep every conversation so you can resume it from History. Deleting frees disk space, and you can no longer resume them. Your project files and logins are never touched."
    >
      <label className="toggle-row">
        <input type="checkbox" role="switch" checked={deletePermanently} onChange={(event) => setDeletePermanently(event.target.checked)} />
        <span>Delete permanently</span>
        <SafetyLabel safety={deletePermanently ? 'permanent' : 'undoable'} />
        <span className="muted">
          {deletePermanently ? 'Space is freed at once and cannot be brought back.' : 'Goes to the Recycle Bin or Trash first, so you can restore it.'}
        </span>
      </label>

      {reports === null ? (
        <p className="muted"><LoadingText text="Measuring your saved conversations…" /></p>
      ) : (
        <div className="table">
          {reports.map((report) => <ProviderSessions key={report.provider} report={report} />)}
          <TeamChatsRow />
        </div>
      )}
    </SettingsSection>
  )
}
