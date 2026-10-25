import { useEffect, useRef, type CSSProperties, type ReactNode, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'

interface FloatingPanelProps {
  x: number
  y: number
  onClose: () => void
  anchor?: Element | null
  className: string
  style?: CSSProperties
  label?: string
  children: ReactNode
}

const VIEWPORT_MARGIN = 8

function keepInsidePanel(event: SyntheticEvent): void {
  event.stopPropagation()
}

export function FloatingPanel({ x, y, onClose, anchor, className, style, label, children }: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (panel !== null) {
      const maxLeft = window.innerWidth - panel.offsetWidth - VIEWPORT_MARGIN
      const maxTop = window.innerHeight - panel.offsetHeight - VIEWPORT_MARGIN
      panel.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(x, maxLeft))}px`
      panel.style.top = `${Math.max(VIEWPORT_MARGIN, Math.min(y, maxTop))}px`
    }

    function ignoreClickOnAnchor(event: MouseEvent): void {
      if (anchor?.contains(event.target as Node) === true) {
        event.stopPropagation()
      }
    }
    function closeWhenOutside(event: MouseEvent): void {
      const target = event.target as Node
      if (panelRef.current !== null && !panelRef.current.contains(target)) {
        if (event.button === 0 && anchor?.contains(target) === true) {
          window.addEventListener('click', ignoreClickOnAnchor, { capture: true, once: true })
        }
        onClose()
      }
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('mousedown', closeWhenOutside, true)
    window.addEventListener('keydown', closeOnEscape, true)
    window.addEventListener('blur', onClose)
    return () => {
      window.removeEventListener('mousedown', closeWhenOutside, true)
      window.removeEventListener('keydown', closeOnEscape, true)
      window.removeEventListener('blur', onClose)
    }
  }, [x, y, onClose, anchor])

  return createPortal(
    <div
      className={className}
      ref={panelRef}
      style={{ ...style, left: x, top: y }}
      role={label === undefined ? undefined : 'dialog'}
      aria-label={label}
      onClick={keepInsidePanel}
      onMouseDown={keepInsidePanel}
      onDoubleClick={keepInsidePanel}
      onContextMenu={keepInsidePanel}
    >
      {children}
    </div>,
    document.body
  )
}
