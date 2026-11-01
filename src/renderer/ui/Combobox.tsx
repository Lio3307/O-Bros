import { Check, ChevronDown, Search } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { filterComboboxOptions, type ComboboxOption } from '../../shared/comboboxFilter'
import { handlePickerKey } from '../features/files/pickerKeys'
import { cn } from './cn'
import { FloatingPanel } from './FloatingPanel'
import './combobox.css'
import './popupMenu.css'

export interface ComboboxItem extends ComboboxOption {
  icon?: ReactNode
}

interface ComboboxProps {
  label: string
  value: string | null
  loadOptions: () => ComboboxItem[] | Promise<ComboboxItem[]>
  onChange: (value: string) => void
  searchPlaceholder?: string
  noMatchText?: string
  icon?: ReactNode
  triggerHint?: string
  title?: string
  className?: string
}

interface OpenPanel {
  x: number
  y: number
  width: number
  anchor: HTMLElement
  options: ComboboxItem[]
}

interface ComboboxPanelProps {
  panel: OpenPanel
  value: string | null
  searchPlaceholder: string
  noMatchText: string
  onPick: (value: string) => void
  onClose: () => void
}

const PANEL_GAP = 4
const MIN_PANEL_WIDTH = 320
const SEARCH_SHOWN_FROM_OPTIONS = 8
const MAX_SHOWN_OPTIONS = 200

function ComboboxPanel({ panel, value, searchPlaceholder, noMatchText, onPick, onClose }: ComboboxPanelProps) {
  const listId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const matching = filterComboboxOptions(panel.options, query)
  const shown = matching.slice(0, MAX_SHOWN_OPTIONS)
  const [highlighted, setHighlighted] = useState(() => Math.max(0, shown.findIndex((option) => option.value === value)))
  const isSearchHidden = panel.options.length < SEARCH_SHOWN_FROM_OPTIONS && query === ''

  useEffect(() => {
    listRef.current?.querySelector('.combobox-option-highlighted')?.scrollIntoView({ block: 'nearest' })
  }, [highlighted, query])

  function handleKey(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Tab') {
      onClose()
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
    }
    handlePickerKey(event, {
      items: shown,
      selectedIndex: highlighted,
      setSelectedIndex: setHighlighted,
      onClose,
      onPick: (option) => onPick(option.value)
    })
  }

  return (
    <FloatingPanel
      className="popup-menu combobox-panel"
      x={panel.x}
      y={panel.y}
      anchor={panel.anchor}
      onClose={onClose}
      style={{ width: Math.max(panel.width, MIN_PANEL_WIDTH) }}
    >
      <label className={cn('combobox-search', isSearchHidden && 'combobox-search-hidden')}>
        <Search size={14} />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={shown.length === 0 ? undefined : `${listId}-${highlighted}`}
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlighted(0)
          }}
          onKeyDown={handleKey}
        />
      </label>
      <div id={listId} ref={listRef} className="combobox-list" role="listbox">
        {shown.length === 0 && <p className="combobox-empty muted">{noMatchText}</p>}
        {shown.map((option, index) => {
          const isSelected = option.value === value
          const startsGroup = option.group !== undefined && option.group !== shown[index - 1]?.group
          return (
            <div key={option.value} className="popup-menu-entry" role="presentation">
              {startsGroup && <div className="section-label combobox-group">{option.group}</div>}
              <button
                type="button"
                id={`${listId}-${index}`}
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                title={option.hint}
                className={cn('popup-menu-item', 'combobox-option', isSelected && 'popup-menu-item-active', index === highlighted && 'combobox-option-highlighted')}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => onPick(option.value)}
              >
                <span className="popup-menu-icon">
                  <Check size={14} className={isSelected ? undefined : 'combobox-check-hidden'} />
                  {option.icon}
                </span>
                <span className="popup-menu-label">{option.label}</span>
                {option.hint !== undefined && <span className="popup-menu-hint">{option.hint}</span>}
              </button>
            </div>
          )
        })}
      </div>
      {matching.length > shown.length && (
        <p className="combobox-more muted">
          Showing the first {shown.length.toLocaleString()} of {matching.length.toLocaleString()}. Type to find the rest.
        </p>
      )}
    </FloatingPanel>
  )
}

export function Combobox({
  label,
  value,
  loadOptions,
  onChange,
  searchPlaceholder = 'Search',
  noMatchText = 'Nothing matches that.',
  icon,
  triggerHint,
  title,
  className
}: ComboboxProps) {
  const [panel, setPanel] = useState<OpenPanel | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => {
    setPanel(null)
    triggerRef.current?.focus()
  }, [])

  async function open(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    const anchor = event.currentTarget
    const bounds = anchor.getBoundingClientRect()
    const options = await loadOptions()
    if (options.length > 0) {
      setPanel({ x: bounds.left, y: bounds.bottom + PANEL_GAP, width: bounds.width, anchor, options })
    }
  }

  function pick(picked: string): void {
    close()
    if (picked !== value) {
      onChange(picked)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn('combobox-trigger', className)}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={panel !== null}
        onClick={(event) => void open(event)}
      >
        {icon}
        <span className={cn('combobox-trigger-label', triggerHint !== undefined && 'combobox-trigger-label-with-hint')}>{label}</span>
        {triggerHint !== undefined && <span className="combobox-trigger-hint">{triggerHint}</span>}
        <ChevronDown size={14} />
      </button>
      {panel !== null && (
        <ComboboxPanel panel={panel} value={value} searchPlaceholder={searchPlaceholder} noMatchText={noMatchText} onPick={pick} onClose={close} />
      )}
    </>
  )
}
