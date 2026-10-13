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
}

const VIEWPORT_MARGIN = 8

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

export function PopupMenu({ x, y, items, onClose }: PopupMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const menu = menuRef.current
    if (menu !== null) {
      const maxLeft = window.innerWidth - menu.offsetWidth - VIEWPORT_MARGIN
      const maxTop = window.innerHeight - menu.offsetHeight - VIEWPORT_MARGIN
      menu.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(x, maxLeft))}px`
      menu.style.top = `${Math.max(VIEWPORT_MARGIN, Math.min(y, maxTop))}px`
    }

    function closeWhenOutside(event: MouseEvent): void {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) {
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
  }, [x, y, onClose])

  return (
    <div className="popup-menu" ref={menuRef} style={{ left: x, top: y }}>
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
