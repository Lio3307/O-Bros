import type { SearchAddon } from '@xterm/addon-search'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useActiveColorTheme } from '../../state/colorThemeStore'
import type { ColorTheme } from '../../theme/colorThemes'
import { appColorsOf } from '../../theme/themeDerivation'

interface TerminalSearchBarProps {
  searchAddon: SearchAddon
  onClose: () => void
}

function matchDecorationsOf(theme: ColorTheme) {
  const app = appColorsOf(theme)
  return {
    matchBackground: theme.selection,
    activeMatchBackground: app.strong,
    activeMatchColorOverviewRuler: app.strong,
    matchOverviewRuler: app.muted
  }
}

export function TerminalSearchBar({ searchAddon, onClose }: TerminalSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const colorTheme = useActiveColorTheme()
  const matchDecorations = useMemo(() => matchDecorationsOf(colorTheme), [colorTheme])

  useEffect(() => {
    inputRef.current?.focus()
    return () => searchAddon.clearDecorations()
  }, [searchAddon])

  function findNext(): void {
    searchAddon.findNext(query, { decorations: matchDecorations })
  }

  function findPrevious(): void {
    searchAddon.findPrevious(query, { decorations: matchDecorations })
  }

  function changeQuery(nextQuery: string): void {
    setQuery(nextQuery)
    if (nextQuery === '') {
      searchAddon.clearDecorations()
      return
    }
    searchAddon.findNext(nextQuery, { incremental: true, decorations: matchDecorations })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' && event.shiftKey) {
      findPrevious()
    } else if (event.key === 'Enter') {
      findNext()
    } else if (event.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="terminal-search">
      <input
        ref={inputRef}
        placeholder="Find in terminal"
        value={query}
        onChange={(event) => changeQuery(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="button" className="icon-button icon-button-small" title="Previous match (Shift+Enter)" onClick={findPrevious}>
        <ChevronUp size={14} />
      </button>
      <button type="button" className="icon-button icon-button-small" title="Next match (Enter)" onClick={findNext}>
        <ChevronDown size={14} />
      </button>
      <button type="button" className="icon-button icon-button-small" title="Close (Esc)" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  )
}
