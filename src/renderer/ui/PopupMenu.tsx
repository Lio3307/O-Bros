import { useEffect, useRef, type ReactNode } from 'react'
import './popupMenu.css'

export interface PopupMenuItem {
  label: string
  onSelect: () => void
  isActive?: boolean
  isDisabled?: boolean
  isDanger?: boolean
  hint?: string
  icon?: ReactNode
  hasSeparatorBefore?: boolean
}

interface PopupMenuProps {
  x: number
  y: number
  items: PopupMenuItem[]
  onClose: () => void
  minWidth?: number
  anchor?: Element | null
}

const VIEWPORT_MARGIN = 8
const MAX_WIDTH = 320

function itemClassName(item: PopupMenuItem): string {
  const classNames = ['popup-menu-item']
  if (item.isActive === true) {
    classNames.push('popup-menu-item-active')
  }
  if (item.isDanger === true) {
    classNames.push('popup-menu-item-danger')
  }
  return classNames.join(' ')
}

export function PopupMenu({ x, y, items, onClose, minWidth, anchor }: PopupMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const menu = menuRef.current
    if (menu !== null) {
      const maxLeft = window.innerWidth - menu.offsetWidth - VIEWPORT_MARGIN
      const maxTop = window.innerHeight - menu.offsetHeight - VIEWPORT_MARGIN
      menu.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(x, maxLeft))}px`
      menu.style.top = `${Math.max(VIEWPORT_MARGIN, Math.min(y, maxTop))}px`
    }

    function ignoreClickOnAnchor(event: MouseEvent): void {
      if (anchor?.contains(event.target as Node) === true) {
        event.stopPropagation()
      }
    }
    function closeWhenOutside(event: MouseEvent): void {
      const target = event.target as Node
      if (menuRef.current !== null && !menuRef.current.contains(target)) {
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

  return (
    <div className="popup-menu" ref={menuRef} style={{ left: x, top: y, minWidth, maxWidth: Math.max(minWidth ?? 0, MAX_WIDTH) }}>
      {items.map((item) => (
        <div key={item.label} className="popup-menu-entry">
          {item.hasSeparatorBefore === true && <div className="popup-menu-separator" />}
          <button
            type="button"
            disabled={item.isDisabled}
            className={itemClassName(item)}
            onClick={() => {
              onClose()
              item.onSelect()
            }}
          >
            {item.icon !== undefined && <span className="popup-menu-icon">{item.icon}</span>}
            <span className="popup-menu-label">{item.label}</span>
            {item.hint !== undefined && <span className="popup-menu-hint">{item.hint}</span>}
          </button>
        </div>
      ))}
    </div>
  )
}
