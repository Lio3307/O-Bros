import { useEffect, type FormEvent, type ReactNode } from 'react'
import './modal.css'

interface ModalProps {
  title: string
  titleId?: string
  actions: ReactNode
  onEscape?: () => void
  onSubmit?: (event: FormEvent) => void
  children?: ReactNode
}

export function Modal({ title, titleId, actions, onEscape, onSubmit, children }: ModalProps) {
  useEffect(() => {
    if (onEscape === undefined) {
      return
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onEscape?.()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onEscape])

  const content = (
    <>
      <h2 id={titleId} className="modal-title">
        {title}
      </h2>
      {children}
      <div className="modal-actions">{actions}</div>
    </>
  )

  return (
    <div className="modal-backdrop">
      {onSubmit === undefined ? (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          {content}
        </div>
      ) : (
        <form className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onSubmit={onSubmit}>
          {content}
        </form>
      )}
    </div>
  )
}
