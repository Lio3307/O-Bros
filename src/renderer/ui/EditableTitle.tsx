import { useState } from 'react'

interface EditableTitleProps {
  value: string
  onCommit: (value: string) => void
  className?: string
}

export function EditableTitle({ value, onCommit, className }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function startEditing(): void {
    setDraft(value)
    setIsEditing(true)
  }

  function commitDraft(): void {
    const trimmed = draft.trim()
    if (trimmed.length > 0) {
      onCommit(trimmed)
    }
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <span className={className} onDoubleClick={startEditing}>
        {value}
      </span>
    )
  }

  return (
    <input
      className="editable-title-input"
      autoFocus
      value={draft}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commitDraft()
        }
        if (event.key === 'Escape') {
          setIsEditing(false)
        }
      }}
      onBlur={() => setIsEditing(false)}
    />
  )
}
