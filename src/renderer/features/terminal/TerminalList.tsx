import { SquareTerminal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useLayoutStore } from '../../state/layoutStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { cn } from '../../ui/cn'
import { handlePickerKey } from '../files/pickerKeys'
import '../files/quickOpen.css'
import { goToPane } from './goToPane'
import { terminalListItems, type TerminalListItem } from './terminalListItems'

export function TerminalList() {
  const tabs = useWorkspaceStore((state) => state.tabs)
  const activeTabId = useWorkspaceStore((state) => state.activeTabId)
  const setVisible = useLayoutStore((state) => state.setTerminalListVisible)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const items = useMemo(() => terminalListItems(tabs, activeTabId, query), [tabs, activeTabId, query])
  const close = () => setVisible(false)

  useEffect(() => inputRef.current?.focus(), [])
  useEffect(() => setSelectedIndex(0), [query])

  function pick(item: TerminalListItem): void {
    close()
    goToPane(item.paneId)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    handlePickerKey(event, { items, selectedIndex, setSelectedIndex, onClose: close, onPick: pick })
  }

  return (
    <div className="quick-open-backdrop" onMouseDown={close}>
      <div className="quick-open" role="dialog" aria-label="Open terminals" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          placeholder="Find an open terminal by name, folder or agent"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="quick-open-results">
          {items.map((item, index) => (
            <button
              key={item.paneId}
              type="button"
              className={cn('quick-open-row', index === selectedIndex && 'quick-open-row-selected')}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => pick(item)}
            >
              {item.agentCommand === null ? <SquareTerminal size={14} /> : <AgentIcon command={item.agentCommand} size={14} />}
              <span className="quick-open-name">{item.title}</span>
              <span className="quick-open-path">{item.isCurrent ? `${item.place} · you are here` : item.place}</span>
            </button>
          ))}
          {items.length === 0 && <p className="panel-empty">{tabs.some((tab) => tab.kind === 'terminal') ? 'No terminal matches.' : 'No terminal is open.'}</p>}
        </div>
      </div>
    </div>
  )
}
