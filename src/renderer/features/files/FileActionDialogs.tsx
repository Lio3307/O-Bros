import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ENTRY_NAME_PROBLEM_TEXT, findEntryNameProblem } from '../../../shared/entryName'
import { useFileDialogStore, type FileDialog } from '../../state/fileDialogStore'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'
import { createEntry, deleteEntry, renameEntry } from './fileActions'

function NameDialog({ dialog }: { dialog: Extract<FileDialog, { kind: 'create' | 'rename' }> }) {
  const close = useFileDialogStore((state) => state.close)
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(dialog.kind === 'rename' ? dialog.name : '')
  const [isWorking, setIsWorking] = useState(false)
  const [showProblem, setShowProblem] = useState(false)

  const problem = findEntryNameProblem(name)
  const title =
    dialog.kind === 'rename' ? 'Rename' : dialog.entryKind === 'file' ? 'New file' : 'New folder'

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (problem !== null) {
      setShowProblem(true)
      return
    }
    setIsWorking(true)
    const trimmedName = name.trim()
    const succeeded =
      dialog.kind === 'rename'
        ? await renameEntry(dialog.path, trimmedName)
        : await createEntry(dialog.parentPath, trimmedName, dialog.entryKind)
    if (succeeded) {
      close()
    } else {
      setIsWorking(false)
    }
  }

  return (
    <Modal
      title={title}
      onEscape={close}
      onSubmit={(event) => void submit(event)}
      actions={
        <>
          <Button variant="outline" onClick={close} disabled={isWorking}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isWorking}>
            {dialog.kind === 'rename' ? 'Rename' : 'Create'}
          </Button>
        </>
      }
    >
      <input
        ref={inputRef}
        className="field"
        value={name}
        placeholder="Name"
        onChange={(event) => {
          setName(event.target.value)
          setShowProblem(false)
        }}
      />
      {showProblem && problem !== null && <p className="muted">{ENTRY_NAME_PROBLEM_TEXT[problem]}</p>}
    </Modal>
  )
}

function DeleteDialog({ dialog }: { dialog: Extract<FileDialog, { kind: 'delete' }> }) {
  const close = useFileDialogStore((state) => state.close)
  const [isWorking, setIsWorking] = useState(false)

  async function confirmDelete(): Promise<void> {
    setIsWorking(true)
    await deleteEntry(dialog.path)
    close()
  }

  return (
    <Modal
      title={`Delete "${dialog.name}"?`}
      onEscape={close}
      actions={
        <>
          <Button variant="outline" autoFocus onClick={close} disabled={isWorking}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => confirmDelete()} disabled={isWorking}>
            Delete
          </Button>
        </>
      }
    >
      <p className="muted">It moves to the Recycle Bin or Trash, so you can restore it from there.</p>
    </Modal>
  )
}

export function FileActionDialogs() {
  const dialog = useFileDialogStore((state) => state.dialog)

  if (dialog === null) {
    return null
  }
  return dialog.kind === 'delete' ? <DeleteDialog dialog={dialog} /> : <NameDialog dialog={dialog} />
}
