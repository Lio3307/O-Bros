import { Check, ChevronDown } from 'lucide-react'
import { useCallback, useState, type MouseEvent, type ReactNode } from 'react'
import { PopupMenu } from './PopupMenu'
import './dropdown.css'

export interface DropdownOption {
  value: string
  label: string
  hint?: string
}

interface DropdownProps {
  label: string
  value: string | null
  loadOptions: () => DropdownOption[] | Promise<DropdownOption[]>
  onChange: (value: string) => void
  icon?: ReactNode
  title?: string
  className?: string
}

interface OpenMenu {
  x: number
  y: number
  width: number
  options: DropdownOption[]
}

const MENU_GAP = 4

export function Dropdown({ label, value, loadOptions, onChange, icon, title, className }: DropdownProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)
  const closeMenu = useCallback(() => setOpenMenu(null), [])

  async function open(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    const bounds = event.currentTarget.getBoundingClientRect()
    const options = await loadOptions()
    if (options.length > 0) {
      setOpenMenu({ x: bounds.left, y: bounds.bottom + MENU_GAP, width: bounds.width, options })
    }
  }

  return (
    <>
      <button
        type="button"
        className={className === undefined ? 'dropdown' : `dropdown ${className}`}
        title={title}
        aria-haspopup="menu"
        aria-expanded={openMenu !== null}
        onClick={(event) => void open(event)}
      >
        {icon}
        <span className="dropdown-label">{label}</span>
        <ChevronDown size={14} />
      </button>
      {openMenu !== null && (
        <PopupMenu
          x={openMenu.x}
          y={openMenu.y}
          onClose={closeMenu}
          minWidth={openMenu.width}
          items={openMenu.options.map((option) => {
            const isSelected = option.value === value
            return {
              label: option.label,
              hint: option.hint,
              isActive: isSelected,
              icon: <Check size={14} className={isSelected ? undefined : 'dropdown-check-hidden'} />,
              onSelect: () => {
                if (!isSelected) {
                  onChange(option.value)
                }
              }
            }
          })}
        />
      )}
    </>
  )
}
