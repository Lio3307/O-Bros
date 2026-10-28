import type { SearchAddon } from '@xterm/addon-search'
import type { Terminal } from '@xterm/xterm'
import { useRef, useState, type RefObject } from 'react'

export function useTerminalSearch(terminalRef: RefObject<Terminal | null>) {
  const addonRef = useRef<SearchAddon | null>(null)
  const [searchAddon, setSearchAddon] = useState<SearchAddon | null>(null)

  async function openSearch(): Promise<void> {
    const terminal = terminalRef.current
    if (terminal === null || addonRef.current !== null) {
      return
    }
    const { SearchAddon: SearchAddonClass } = await import('@xterm/addon-search')
    const addon = new SearchAddonClass()
    terminal.loadAddon(addon)
    addonRef.current = addon
    setSearchAddon(addon)
  }

  function closeSearch(): void {
    addonRef.current?.dispose()
    addonRef.current = null
    setSearchAddon(null)
    terminalRef.current?.focus()
  }

  function forgetSearch(): void {
    addonRef.current = null
  }

  return { searchAddon, openSearch, closeSearch, forgetSearch }
}
