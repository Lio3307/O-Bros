import { useEffect } from 'react'
import { useConfirmStore } from '../state/confirmStore'
import './modal.css'

export function ConfirmHost() {
  const options = useConfirmStore((state) => state.options)
  const answer = useConfirmStore((state) => state.answer)

  useEffect(() => {
    if (options === null) {
      return
    }
    function cancelOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        answer(false)
      }
    }
    window.addEventListener('keydown', cancelOnEscape)
    return () => window.removeEventListener('keydown', cancelOnEscape)
  }, [options, answer])

  if (options === null) {
    return null
  }
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true">
        <h2 className="modal-title">{options.title}</h2>
        <p className="muted">{options.message}</p>
        <div className="modal-actions">
          <button type="button" className="button-outline" autoFocus onClick={() => answer(false)}>
            Cancel
          </button>
          <button type="button" className="button-primary" onClick={() => answer(true)}>
            {options.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
