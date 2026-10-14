import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { firstLineOf, isUsablePrompt, searchPrompts, type Prompt } from '../../../shared/prompts'
import { useLayoutStore } from '../../state/layoutStore'
import { usePromptsStore } from '../../state/promptsStore'
import { sendPromptToTerminal } from '../terminal/sendToTerminal'
import '../files/quickOpen.css'
import './prompts.css'

export function PromptPicker() {
  const prompts = usePromptsStore((state) => state.prompts)
  const closePromptPicker = useLayoutStore((state) => state.closePromptPicker)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)
  const openSection = useLayoutStore((state) => state.openSection)

  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const usablePrompts = useMemo(
    () => prompts.filter((prompt) => isUsablePrompt(prompt.title, prompt.text)),
    [prompts]
  )
  const matches = useMemo(() => searchPrompts(usablePrompts, query), [usablePrompts, query])

  useEffect(() => inputRef.current?.focus(), [])
  useEffect(() => setSelectedIndex(0), [query])

  function send(prompt: Prompt, pressEnter: boolean): void {
    if (sendPromptToTerminal(prompt.text, pressEnter)) {
      closePromptPicker()
    }
  }

  function manage(): void {
    closePromptPicker()
    selectSettingsPage('prompts')
    openSection('settings')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Escape') {
      closePromptPicker()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex(Math.min(selectedIndex + 1, matches.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(Math.max(selectedIndex - 1, 0))
    } else if (event.key === 'Enter' && matches[selectedIndex] !== undefined) {
      send(matches[selectedIndex], event.ctrlKey || event.metaKey)
    }
  }

  return (
    <div className="quick-open-backdrop" onMouseDown={closePromptPicker}>
      <div className="quick-open" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          placeholder="Find a prompt to send to the terminal"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="quick-open-results">
          {matches.map((prompt, index) => (
            <button
              key={prompt.id}
              type="button"
              className={index === selectedIndex ? 'quick-open-row quick-open-row-selected' : 'quick-open-row'}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => send(prompt, false)}
            >
              <span className="quick-open-name">{prompt.title}</span>
              <span className="quick-open-path">{firstLineOf(prompt.text)}</span>
            </button>
          ))}
          {matches.length === 0 && (
            <p className="panel-empty">
              {usablePrompts.length === 0 ? 'No prompts yet. Add one in Settings, Prompts.' : 'No prompt matches.'}
            </p>
          )}
        </div>
        <div className="prompt-picker-footer">
          <span className="muted">Enter inserts it. Ctrl+Enter inserts it and presses Enter.</span>
          <button type="button" className="link-button" onClick={manage}>
            Manage prompts
          </button>
        </div>
      </div>
    </div>
  )
}
