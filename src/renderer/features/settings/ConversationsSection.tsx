import { FolderInput, FolderOutput, FolderSearch, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { formatBytes } from '../../../shared/format'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { agentNameOf } from '../../../shared/storageMap'
import { formatAge } from '../../../shared/time'
import type { ConversationFolder, ConversationMoveResult, ConversationStorage, SessionStorageReport } from '../../../shared/types'
import { askToConfirm } from '../../state/confirmStore'
import { useHistoryStore } from '../../state/historyStore'
import { useStorageStore } from '../../state/storageStore'
import { toast } from '../../state/toastStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { Button } from '../../ui/Button'
import { DisclosureChevron } from '../../ui/DisclosureChevron'
import { LoadingText } from '../../ui/LoadingText'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { SettingsSection } from '../../ui/SettingsSection'
import { CleanupRow, pluralize } from './CleanupRow'
import './storagePage.css'

const EVERY_SESSION = 0

export function useConversationStorage(): { storage: ConversationStorage | null; reload: () => Promise<void> } {
  const [storage, setStorage] = useState<ConversationStorage | null>(null)

  const reload = useCallback(async () => {
    try {
      setStorage(await window.api.storage.conversations())
    } catch {
      setStorage({ targetFolder: null, folders: [] })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { storage, reload }
}

function showResult(result: ConversationMoveResult): void {
  if (result.isDone) {
    toast.success(result.message)
  } else {
    toast.warning(result.message)
  }
}

function whereDeletedGoes(deletePermanently: boolean): string {
  return deletePermanently ? 'gone for good' : 'in the Recycle Bin'
}

function bucketLabel(days: number | null): string {
  return days === null ? 'All' : `${days}+ days`
}

function DeletePanel({ report, name }: { report: SessionStorageReport; name: string }) {
  const removeOldSessions = useStorageStore((state) => state.removeOldSessions)
  const deletePermanently = useHistoryStore((state) => state.deletePermanently)
  const oldestDays = report.buckets.reduce<number | null>((largest, bucket) => (bucket.days !== null && (largest === null || bucket.days > largest) ? bucket.days : largest), null)
  const [selectedDays, setSelectedDays] = useState<number>(oldestDays ?? EVERY_SESSION)
  const bucket = report.buckets.find((candidate) => (candidate.days ?? EVERY_SESSION) === selectedDays) ?? report.buckets[0]

  return (
    <div className="agent-panel">
      <h4 className="agent-panel-title">Delete conversations not used for</h4>
      <SegmentedControl
        className="agent-panel-ages"
        options={report.buckets.map((candidate) => ({ value: candidate.days ?? EVERY_SESSION, label: bucketLabel(candidate.days) }))}
        value={selectedDays}
        onChange={setSelectedDays}
      />
      <div className="agent-panel-action">
        <span>{bucket === undefined ? '' : `${pluralize(bucket.sessionCount, 'conversation', 'conversations')}, ${formatBytes(bucket.totalBytes)}`}</span>
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
    </div>
  )
}

interface MovePanelProps {
  folder: ConversationFolder
  targetFolder: string | null
  isBusy: boolean
  onMove: () => void
  onMoveBack: () => void
}

function MovePanel({ folder, targetFolder, isBusy, onMove, onMoveBack }: MovePanelProps) {
  const isMoved = folder.movedTo !== null
  const note = folder.holdsLogin
    ? 'Stays here, because this folder also holds the agent login.'
    : isMoved
      ? null
      : targetFolder === null
        ? 'Choose a folder at the top of this section first.'
        : `Moves to ${targetFolder}. The agent and History keep working.`

  return (
    <div className="agent-panel">
      <h4 className="agent-panel-title">{isMoved ? 'Moved to' : 'Stored in'}</h4>
      <span className="mono agent-panel-path" title={folder.movedTo ?? folder.path}>
        {folder.movedTo ?? folder.path}
      </span>
      {isMoved && <span className="muted">A link stays in {folder.path}, so the agent keeps working.</span>}
      {note !== null && <span className="muted">{note}</span>}
      {isBusy ? (
        <LoadingText text={isMoved ? 'Moving back…' : 'Moving…'} />
      ) : isMoved ? (
        <Button variant="outline" className="agent-panel-button" title="The files come back to the original folder and the link is removed. Close the agent first." onClick={onMoveBack}>
          <FolderOutput size={14} /> Move back
        </Button>
      ) : (
        !folder.holdsLogin && (
          <Button variant="outline" className="agent-panel-button" title="A link stays here, so the agent, History and resume keep working. Close the agent first." disabled={targetFolder === null} onClick={onMove}>
            <FolderInput size={14} /> Move
          </Button>
        )
      )}
    </div>
  )
}

interface AgentRowProps {
  folder: ConversationFolder
  report: SessionStorageReport | undefined
  deletesElsewhere: boolean
  targetFolder: string | null
  isOpen: boolean
  isBusy: boolean
  onToggle: () => void
  onMove: () => void
  onMoveBack: () => void
}

function metaOf(report: SessionStorageReport | undefined, folder: ConversationFolder): string {
  const moved = folder.movedTo === null ? '' : ' · on another drive'
  if (report === undefined) {
    return moved.slice(3)
  }
  const oldest = report.oldestAt === null ? '' : `, oldest ${formatAge(report.oldestAt, Date.now())}`
  return pluralize(report.sessionCount, 'conversation', 'conversations') + oldest + moved
}

function AgentRow({ folder, report, deletesElsewhere, targetFolder, isOpen, isBusy, onToggle, onMove, onMoveBack }: AgentRowProps) {
  const name = agentNameOf(folder.title)

  return (
    <div className={isOpen ? 'conversation-row conversation-row-open' : 'conversation-row'} data-folder-id={folder.id}>
      <button type="button" className="conversation-row-head" aria-expanded={isOpen} onClick={onToggle}>
        <DisclosureChevron isOpen={isOpen} />
        <AgentIcon command={folder.program} size={18} />
        <span className="conversation-row-name">{name}</span>
        <span className="muted conversation-row-meta">{metaOf(report, folder)}</span>
        <span className="conversation-row-size">{formatBytes(folder.sizeBytes)}</span>
      </button>
      {isOpen && (
        <div className="conversation-row-body">
          {report !== undefined ? (
            <DeletePanel report={report} name={name} />
          ) : (
            <div className="agent-panel">
              <h4 className="agent-panel-title">Delete old conversations</h4>
              <span className="muted">
                {deletesElsewhere
                  ? `Old conversations of every ${agentNameOf(folder.program)} account are deleted from its first row.`
                  : `O-BROS can only read and delete Claude and Codex conversations. Use ${name}'s own commands to clean this folder.`}
              </span>
            </div>
          )}
          <MovePanel folder={folder} targetFolder={targetFolder} isBusy={isBusy} onMove={onMove} onMoveBack={onMoveBack} />
        </div>
      )}
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
      description="What agents you summoned with wot said to each other."
      amount={teamChats === null ? null : `${pluralize(teamChats.sessionCount, 'conversation', 'conversations')}, ${formatBytes(teamChats.totalBytes)}`}
      buttonLabel="Delete"
      effect={`the members can no longer resume them (${whereDeletedGoes(deletePermanently)}). Their work in your files and O-BROS's copy stay.`}
      isDisabled={teamChats === null || teamChats.sessionCount === 0}
      onClean={removeTeamChats}
    />
  )
}

interface ConversationsSectionProps {
  storage: ConversationStorage | null
  reload: () => Promise<void>
  openFolderId: string | null
  onOpenFolder: (folderId: string | null) => void
}

export function ConversationsSection({ storage, reload, openFolderId, onOpenFolder }: ConversationsSectionProps) {
  const reports = useStorageStore((state) => state.sessionReports)
  const deletePermanently = useHistoryStore((state) => state.deletePermanently)
  const setDeletePermanently = useHistoryStore((state) => state.setDeletePermanently)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function chooseFolder(): Promise<void> {
    try {
      if ((await window.api.storage.chooseConversationFolder()) !== null) {
        await reload()
      }
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not save the folder.'))
    }
  }

  async function run(folder: ConversationFolder, action: (id: string) => Promise<ConversationMoveResult>): Promise<void> {
    setBusyId(folder.id)
    try {
      showResult(await action(folder.id))
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Moving the conversations failed.'))
    } finally {
      setBusyId(null)
      await reload()
    }
  }

  async function move(folder: ConversationFolder, targetFolder: string): Promise<void> {
    const isConfirmed = await askToConfirm({
      title: `Move ${folder.title}?`,
      message: `${formatBytes(folder.sizeBytes)} move to ${targetFolder}. Close ${folder.program} first. The agent and History keep working as before, and new conversations are saved there too. You can move them back here at any time.`,
      confirmLabel: 'Move'
    })
    if (isConfirmed) {
      await run(folder, window.api.storage.moveConversations)
    }
  }

  async function moveBack(folder: ConversationFolder): Promise<void> {
    const isConfirmed = await askToConfirm({
      title: `Move ${folder.title} back?`,
      message: `${formatBytes(folder.sizeBytes)} move back to ${folder.path}. Close ${folder.program} first.`,
      confirmLabel: 'Move back'
    })
    if (isConfirmed) {
      await run(folder, window.api.storage.moveConversationsBack)
    }
  }

  const folders = storage === null ? [] : [...storage.folders].sort((first, second) => second.sizeBytes - first.sizeBytes)
  const firstOfProgram = (folder: ConversationFolder) => folders.find((candidate) => candidate.program === folder.program) === folder

  return (
    <SettingsSection
      title="Conversations"
      description="Every agent found on this computer, biggest first. Open one to delete old conversations or move them to another drive. Your project files and logins are never touched."
      actions={
        <Button variant="outline" onClick={() => void chooseFolder()}>
          <FolderSearch size={14} /> {storage === null || storage.targetFolder === null ? 'Choose folder…' : 'Change folder…'}
        </Button>
      }
    >
      <label className="toggle-row conversations-mode">
        <input type="checkbox" role="switch" checked={deletePermanently} onChange={(event) => setDeletePermanently(event.target.checked)} />
        <span>Delete permanently</span>
        <span className={deletePermanently ? 'conversations-mode-danger' : 'muted'}>
          {deletePermanently ? 'Space is freed at once. This cannot be undone.' : 'Off: deleted conversations go to the Recycle Bin or Trash, so you can restore them.'}
        </span>
      </label>
      {storage?.targetFolder !== null && storage?.targetFolder !== undefined && (
        <p className="muted">
          Moving to: <span className="mono">{storage.targetFolder}</span>
        </p>
      )}
      {storage === null && <p className="panel-empty"><LoadingText text="Measuring your conversations…" /></p>}
      {storage !== null && storage.folders.length === 0 && <p className="muted">No agent conversations were found on this computer.</p>}
      {storage !== null && storage.folders.length > 0 && (
        <div className="conversation-list">
          {folders.map((folder) => (
            <AgentRow
              key={folder.id}
              folder={folder}
              report={firstOfProgram(folder) ? reports?.find((report) => report.provider === folder.program) : undefined}
              deletesElsewhere={!firstOfProgram(folder)}
              targetFolder={storage.targetFolder}
              isOpen={openFolderId === folder.id}
              isBusy={busyId === folder.id}
              onToggle={() => onOpenFolder(openFolderId === folder.id ? null : folder.id)}
              onMove={() => storage.targetFolder !== null && void move(folder, storage.targetFolder)}
              onMoveBack={() => void moveBack(folder)}
            />
          ))}
          <TeamChatsRow />
        </div>
      )}
    </SettingsSection>
  )
}
