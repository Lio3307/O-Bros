import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTextPromptStore, type TextPromptOptions } from '../state/textPromptStore'
import { Button } from './Button'
import { Modal } from './Modal'

function TextPromptDialog({ options }: { options: TextPromptOptions }) {
  const answer = useTextPromptStore((state) => state.answer)
  const [value, setValue] = useState(options.initialValue ?? '')
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const canConfirm = options.allowEmpty === true || value.trim() !== ''

  useEffect(() => {
    fieldRef.current?.focus()
    fieldRef.current?.select()
  }, [])

  function submit(event: FormEvent): void {
    event.preventDefault()
    if (canConfirm) {
      answer(value.trim())
    }
  }

  return (
    <Modal
      title={options.title}
      onEscape={() => answer(null)}
      onSubmit={submit}
      actions={
        <>
          <Button variant="outline" onClick={() => answer(null)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!canConfirm}>
            {options.confirmLabel}
          </Button>
        </>
      }
    >
      {options.message !== undefined && <p className="muted">{options.message}</p>}
      {options.isMultiline === true ? (
        <textarea
          ref={fieldRef}
          className="field text-prompt-multiline"
          placeholder={options.placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      ) : (
        <input
          ref={fieldRef}
          className="field"
          placeholder={options.placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      )}
    </Modal>
  )
}

export function TextPromptHost() {
  const options = useTextPromptStore((state) => state.options)

  if (options === null) {
    return null
  }
  return <TextPromptDialog key={options.title + (options.initialValue ?? '')} options={options} />
}
