import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { searchCommands } from '../../../shared/commandSearch'
import { formatShortcut } from '../../../shared/shortcuts'
import { useLayoutStore } from '../../state/layoutStore'
import { isMacPlatform, useShortcutsStore } from '../../state/shortcutsStore'
import '../files/quickOpen.css'
import './commands.css'
import { ALL_COMMANDS } from './allCommands'
import type { AppCommand } from './commandTypes'

export function CommandPalette() {
  const closeCommandPalette = useLayoutStore((state) => state.closeCommandPalette)
  const shortcuts = useShortcutsStore((state) => state.shortcuts)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const matches = useMemo(() => searchCommands(ALL_COMMANDS, query), [query])

  useEffect(() => inputRef.current?.focus(), [])
  useEffect(() => setSelectedIndex(0), [query])

  function shortcutLabelOf(command: AppCommand): string {
    if (command.shortcutAction !== undefined) {
      return formatShortcut(shortcuts[command.shortcutAction], isMacPlatform())
    }
    return command.shortcutText ?? ''
  }

  function run(command: AppCommand): void {
    closeCommandPalette()
    void Promise.resolve(command.run())
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Escape') {
      closeCommandPalette()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex(Math.min(selectedIndex + 1, matches.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(Math.max(selectedIndex - 1, 0))
    } else if (event.key === 'Enter' && matches[selectedIndex] !== undefined) {
      run(matches[selectedIndex])
    }
  }

  return (
    <div className="quick-open-backdrop" onMouseDown={closeCommandPalette}>
      <div className="quick-open" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          placeholder="Type a command, for example: split, push, agents"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="quick-open-results">
          {matches.map((command, index) => (
            <button
              key={command.id}
              type="button"
              className={index === selectedIndex ? 'quick-open-row quick-open-row-selected' : 'quick-open-row'}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => run(command)}
            >
              <span className="command-group">{command.group}</span>
              <span className="quick-open-name">{command.title}</span>
              <span className="quick-open-path command-shortcut">{shortcutLabelOf(command)}</span>
            </button>
          ))}
          {matches.length === 0 && <p className="panel-empty">No command matches.</p>}
        </div>
      </div>
    </div>
  )
}
