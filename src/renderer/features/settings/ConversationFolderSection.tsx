import { FolderInput, FolderOutput, FolderSearch } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { formatBytes } from '../../../shared/format'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { ConversationFolder, ConversationMoveResult, ConversationStorage } from '../../../shared/types'
import { askToConfirm } from '../../state/confirmStore'
import { toast } from '../../state/toastStore'
import { Button } from '../../ui/Button'
import { LoadingText } from '../../ui/LoadingText'
import { SettingsSection } from '../../ui/SettingsSection'
import { SafetyLabel } from './SafetyLabel'
import './settings.css'
import './settingsControls.css'

function showResult(result: ConversationMoveResult): void {
  if (result.isDone) {
    toast.success(result.message)
  } else {
    toast.warning(result.message)
  }
}

function FolderRow({
  folder,
  targetFolder,
  isBusy,
  onMove,
  onMoveBack
}: {
  folder: ConversationFolder
  targetFolder: string | null
  isBusy: boolean
  onMove: () => void
  onMoveBack: () => void
}) {
  const isMoved = folder.movedTo !== null
  const moveTitle = folder.holdsLogin
    ? 'This folder also holds the agent login, so it stays where it is.'
    : targetFolder === null
      ? 'Choose a folder first.'
      : `Move to ${targetFolder}. A link stays here, so the agent, History and resume keep working. Close the agent first.`

  return (
    <div className="table-row location-row conversation-row">
      <div className="cell cell-account">
        <span className="cleanup-title">
          <span className="account-label">{folder.title}</span>
          {!folder.holdsLogin && <SafetyLabel safety="undoable" />}
        </span>
        <span className="muted mono location-path">{folder.path}</span>
        {isMoved && <span className="muted mono location-path">Saved in {folder.movedTo}</span>}
        {folder.holdsLogin && <span className="muted">Shares its folder with the agent login, so O-BROS does not move it.</span>}
      </div>
      <span className="conversation-size">{formatBytes(folder.sizeBytes)}</span>
      {isBusy ? (
        <LoadingText text={isMoved ? 'Moving back…' : 'Moving…'} />
      ) : isMoved ? (
        <Button variant="outline" title="The files come back to the original folder and the link is removed. Close the agent first." onClick={onMoveBack}>
          <FolderOutput size={14} /> Move back
        </Button>
      ) : (
        <Button variant="outline" title={moveTitle} disabled={folder.holdsLogin || targetFolder === null} onClick={onMove}>
          <FolderInput size={14} /> Move
        </Button>
      )}
    </div>
  )
}

export function ConversationFolderSection() {
  const [storage, setStorage] = useState<ConversationStorage | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setStorage(await window.api.storage.conversations())
    } catch {
      setStorage({ targetFolder: null, folders: [] })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function chooseFolder(): Promise<void> {
    try {
      if ((await window.api.storage.chooseConversationFolder()) !== null) {
        await load()
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
      await load()
    }
  }

  async function move(folder: ConversationFolder, targetFolder: string): Promise<void> {
    const isConfirmed = await askToConfirm({
      title: `Move ${folder.title}?`,
      message: `${formatBytes(folder.sizeBytes)} move to ${targetFolder}. Close ${folder.program} first. The agent and History keep working as before, and new conversations are saved there too. Logins and settings stay where they are.`,
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

  return (
    <SettingsSection
      title="Move conversations to another drive"
      description="Pick a folder, then move each agent's conversations there. The agent, History and resume keep working. Logins and settings never move."
      actions={
        <Button variant="outline" onClick={() => void chooseFolder()}>
          <FolderSearch size={14} /> {storage?.targetFolder === null || storage === null ? 'Choose folder…' : 'Change folder…'}
        </Button>
      }
    >
      {storage === null && <p className="panel-empty"><LoadingText text="Measuring your conversations…" /></p>}
      {storage !== null && (
        <>
          <p className="muted">
            Chosen folder: <span className="mono">{storage.targetFolder ?? 'none yet'}</span>
          </p>
          {storage.folders.length === 0 ? (
            <p className="muted">No agent conversations were found on this computer.</p>
          ) : (
            <div className="table">
              {storage.folders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  targetFolder={storage.targetFolder}
                  isBusy={busyId === folder.id}
                  onMove={() => storage.targetFolder !== null && void move(folder, storage.targetFolder)}
                  onMoveBack={() => void moveBack(folder)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </SettingsSection>
  )
}
