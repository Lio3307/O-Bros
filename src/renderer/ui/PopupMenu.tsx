import type { ReactNode } from 'react'
import { cn } from './cn'
import { FloatingPanel } from './FloatingPanel'
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

const MAX_WIDTH = 320

function itemClassName(item: PopupMenuItem): string | undefined {
  return cn('popup-menu-item', item.isActive === true && 'popup-menu-item-active', item.isDanger === true && 'popup-menu-item-danger')
}

export function PopupMenu({ x, y, items, onClose, minWidth, anchor }: PopupMenuProps) {
  return (
    <FloatingPanel className="popup-menu" x={x} y={y} onClose={onClose} anchor={anchor} style={{ minWidth, maxWidth: Math.max(minWidth ?? 0, MAX_WIDTH) }}>
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
    </FloatingPanel>
  )
}
