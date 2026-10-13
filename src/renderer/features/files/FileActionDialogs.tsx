import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ENTRY_NAME_PROBLEM_TEXT, findEntryNameProblem } from '../../../shared/entryName'
import { useFileDialogStore, type FileDialog } from '../../state/fileDialogStore'
import '../../ui/modal.css'
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
    <form className="modal" onSubmit={(event) => void submit(event)}>
      <h2 className="modal-title">{title}</h2>
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
      <div className="modal-actions">
        <button type="button" className="button-outline" onClick={close} disabled={isWorking}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={isWorking}>
          {dialog.kind === 'rename' ? 'Rename' : 'Create'}
        </button>
      </div>
    </form>
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
    <div className="modal" role="dialog" aria-modal="true">
      <h2 className="modal-title">Delete "{dialog.name}"?</h2>
      <p className="muted">It moves to the Recycle Bin or Trash, so you can restore it from there.</p>
      <div className="modal-actions">
        <button type="button" className="button-outline" autoFocus onClick={close} disabled={isWorking}>
          Cancel
        </button>
        <button type="button" className="button-primary" onClick={() => void confirmDelete()} disabled={isWorking}>
          Delete
        </button>
      </div>
    </div>
  )
}

export function FileActionDialogs() {
  const dialog = useFileDialogStore((state) => state.dialog)
  const close = useFileDialogStore((state) => state.close)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        close()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [close])

  if (dialog === null) {
    return null
  }
  return (
    <div className="modal-backdrop">
      {dialog.kind === 'delete' ? <DeleteDialog dialog={dialog} /> : <NameDialog dialog={dialog} />}
    </div>
  )
}
