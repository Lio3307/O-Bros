import { FolderInput, FolderOpen, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { formatBytes } from '../../../shared/format'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { formatAge } from '../../../shared/time'
import type { UniversalHistoryReport } from '../../../shared/types'
import { HISTORY_KEEP_DAYS_OPTIONS } from '../../../shared/universalHistory'
import { askToConfirm } from '../../state/confirmStore'
import { useStorageStore } from '../../state/storageStore'
import { toast } from '../../state/toastStore'
import { Button } from '../../ui/Button'
import { LoadingText } from '../../ui/LoadingText'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { SettingsSection } from '../../ui/SettingsSection'
import { pluralize } from './CleanupRow'
import { SafetyLabel } from './SafetyLabel'

const KEEP_EVERYTHING = 0

function keepLabel(days: number | null): string {
  return days === null ? 'Everything' : `${days} days`
}

function savedText(report: UniversalHistoryReport): string {
  if (report.isSaving) {
    return 'Saving now…'
  }
  return report.lastSavedAt === null ? 'Saves every minute while O-BROS runs.' : `Last saved ${formatAge(report.lastSavedAt, Date.now())}.`
}

export function UniversalHistorySection() {
  const [report, setReport] = useState<UniversalHistoryReport | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const measuredAt = useStorageStore((state) => state.measuredAt)
  const refreshStorage = useStorageStore((state) => state.refresh)

  const load = useCallback(async () => {
    try {
      setReport(await window.api.storage.history())
    } catch {
      setReport(null)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, measuredAt])

  async function saveNow(): Promise<void> {
    setIsBusy(true)
    try {
      await window.api.storage.saveHistoryNow()
      await load()
    } finally {
      setIsBusy(false)
    }
  }

  async function move(): Promise<void> {
    setIsBusy(true)
    try {
      const result = await window.api.storage.moveHistory()
      if (result.message !== '') {
        if (result.isDone) {
          toast.success(result.message)
        } else {
          toast.warning(result.message)
        }
      }
      await refreshStorage()
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not move the universal history.'))
    } finally {
      setIsBusy(false)
    }
  }

  async function changeKeep(value: number): Promise<void> {
    const days = value === KEEP_EVERYTHING ? null : value
    if (days !== null) {
      const isConfirmed = await askToConfirm({
        title: `Keep only the last ${days} days?`,
        message: `O-BROS deletes its copies of conversations that were not used for ${days} days, now and from then on. The agents' own conversations are not touched, so you can still resume them, but older chats are no longer handed to another agent.`,
        confirmLabel: `Keep ${days} days`
      })
      if (!isConfirmed) {
        return
      }
    }
    await window.api.storage.setHistoryKeep(days)
    await load()
  }

  async function openFolder(agent: string | null): Promise<void> {
    try {
      await window.api.storage.openHistoryFolder(agent)
    } catch (error) {
      toast.warning(friendlyErrorMessage(error, 'That folder does not exist yet.'))
    }
  }

  return (
    <SettingsSection
      title="Universal history"
      description={
        <>
          O-BROS keeps its own copy of your conversations in one folder you choose, one folder per agent, so your chats
          stay in a place you control even when you switch agents or delete an agent's own files. It is plain text: your
          messages and the agent's answers, without tool output, so it stays small. Claude and Codex conversations are
          saved today. The agents keep their own files too.
        </>
      }
      actions={
        <>
          <Button variant="outline" disabled={isBusy} onClick={() => void saveNow()}>
            <RefreshCw size={14} /> Save now
          </Button>
          <Button variant="outline" onClick={() => void openFolder(null)}>
            <FolderOpen size={14} /> Open folder
          </Button>
        </>
      }
    >
      {report === null && <p className="panel-empty"><LoadingText text="Reading the universal history…" /></p>}
      {report !== null && (
        <>
          <div className="table">
            <div className="table-row cleanup-row">
              <div className="cell cell-account">
                <span className="cleanup-title">
                  <span className="account-label">Folder</span>
                  <SafetyLabel safety="undoable" />
                </span>
                <span className="mono location-path">{report.folder}</span>
                <span className="muted">
                  {report.isDefaultFolder ? 'The default, inside the O-BROS data folder. ' : ''}
                  {report.drive === null ? '' : `Drive ${report.drive.root} has ${formatBytes(report.drive.freeBytes)} free. `}
                  {savedText(report)}
                </span>
                <span className="cleanup-effect">
                  <span className="cleanup-effect-label">If you press Move:</span> you pick a folder, O-BROS creates o-bros-history
                  inside it, copies everything there, checks the copy, then removes the old folder. New conversations are saved
                  in the new place. Move it back the same way.
                </span>
              </div>
              <span className="muted cleanup-amount">
                {pluralize(report.conversationCount, 'conversation', 'conversations')}, {formatBytes(report.totalBytes)}
              </span>
              <Button variant="outline" disabled={isBusy} onClick={() => void move()}>
                <FolderInput size={14} /> Move…
              </Button>
            </div>
            {report.agents.map((agent) => (
              <div key={agent.folderName} className="table-row history-agent-row">
                <div className="cell cell-account">
                  <span className="account-label">{agent.folderName}</span>
                  <span className="muted">Copies of {agent.agent} conversations</span>
                </div>
                <span className="muted cleanup-amount">
                  {pluralize(agent.conversationCount, 'conversation', 'conversations')}, {formatBytes(agent.totalBytes)}
                </span>
                <Button variant="outline" onClick={() => void openFolder(agent.agent)}>
                  <FolderOpen size={14} /> Open
                </Button>
              </div>
            ))}
          </div>
          <div className="history-keep">
            <span className="cleanup-title">
              <span className="account-label">Keep copies of</span>
              <SafetyLabel safety="permanent" />
            </span>
            <SegmentedControl
              className="settings-segmented"
              options={HISTORY_KEEP_DAYS_OPTIONS.map((days) => ({ value: days ?? KEEP_EVERYTHING, label: keepLabel(days) }))}
              value={report.keepDays ?? KEEP_EVERYTHING}
              onChange={(value) => void changeKeep(value)}
            />
            <p className="muted">
              Choosing a number of days deletes O-BROS's copies of older conversations for good, which frees space but means
              those chats cannot be handed to another agent. The agents' own conversations stay, and you can still resume them.
            </p>
          </div>
        </>
      )}
    </SettingsSection>
  )
}
