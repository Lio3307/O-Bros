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
import { AgentIcon } from '../../ui/AgentIcon'
import { Button } from '../../ui/Button'
import { LoadingText } from '../../ui/LoadingText'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { SettingsSection } from '../../ui/SettingsSection'
import { pluralize } from './CleanupRow'
import './storagePage.css'

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
        confirmLabel: `Keep ${days} days`,
        tone: 'danger'
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
      description="O-BROS's own small text copy of your Claude and Codex conversations, so another agent can continue them. Your messages and the answers, not tool output."
      actions={
        <>
          <Button variant="outline" disabled={isBusy} onClick={() => void saveNow()}>
            <RefreshCw size={14} /> Save now
          </Button>
          <Button
            variant="outline"
            title="Pick a folder. O-BROS copies everything into o-bros-history there, checks the copy, then removes the old folder. Move it back the same way."
            disabled={isBusy}
            onClick={() => void move()}
          >
            <FolderInput size={14} /> Move…
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
          <div className="history-summary">
            <strong>{formatBytes(report.totalBytes)}</strong>
            <span>{pluralize(report.conversationCount, 'conversation', 'conversations')}</span>
            <span className="muted">
              {report.drive === null ? '' : `${report.drive.root} has ${formatBytes(report.drive.freeBytes)} free. `}
              {savedText(report)}
            </span>
          </div>
          <span className="mono location-path muted">{report.folder}</span>
          {report.agents.length > 0 && (
            <div className="history-agents">
              {report.agents.map((agent) => (
                <div key={agent.folderName} className="history-agent-row">
                  <AgentIcon command={agent.agent} size={14} />
                  <span title={agent.folderName}>{pluralize(agent.conversationCount, 'conversation', 'conversations')}</span>
                  <span className="muted">{formatBytes(agent.totalBytes)}</span>
                  <Button variant="icon" title={`Open ${agent.folderName}`} aria-label={`Open ${agent.folderName}`} onClick={() => void openFolder(agent.agent)}>
                    <FolderOpen size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="history-keep-row">
            <span>Keep copies of</span>
            <SegmentedControl
              className="settings-segmented"
              options={HISTORY_KEEP_DAYS_OPTIONS.map((days) => ({ value: days ?? KEEP_EVERYTHING, label: keepLabel(days) }))}
              value={report.keepDays ?? KEEP_EVERYTHING}
              onChange={(value) => void changeKeep(value)}
            />
          </div>
          <p className="muted">Older copies are deleted for good. The agents' own conversations stay.</p>
        </>
      )}
    </SettingsSection>
  )
}
