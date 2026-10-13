import { FitAddon } from '@xterm/addon-fit'
import type { SearchAddon } from '@xterm/addon-search'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import type { AccountRef } from '../../../shared/types'
import { useTerminalFontStore } from '../../state/terminalFontStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { quotePathForShell } from '../../../shared/shellQuote'
import { DRAGGED_PATH_TYPE } from '../files/dragData'
import { forgetTerminalActivity, noteTerminalOutput } from './terminalActivityMonitor'
import { TerminalSearchBar } from './TerminalSearchBar'
import { terminalOptions } from './terminalTheme'

interface TerminalViewProps {
  paneId: string
  cwd: string | null
  account: AccountRef | null
  startCommand: string | null
  isVisible: boolean
}

function createWebglAddon(): WebglAddon | null {
  try {
    const addon = new WebglAddon()
    addon.onContextLoss(() => addon.dispose())
    return addon
  } catch {
    return null
  }
}

export function TerminalView({ paneId, cwd, account, startCommand, isVisible }: TerminalViewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const webglAddonRef = useRef<WebglAddon | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)
  const [searchAddon, setSearchAddon] = useState<SearchAddon | null>(null)
  const fontSize = useTerminalFontStore((state) => state.fontSize)
  const scrollback = useTerminalSettingsStore((state) => state.scrollback)

  async function openSearch(): Promise<void> {
    const terminal = terminalRef.current
    if (terminal === null || searchAddonRef.current !== null) {
      return
    }
    const { SearchAddon: SearchAddonClass } = await import('@xterm/addon-search')
    const addon = new SearchAddonClass()
    terminal.loadAddon(addon)
    searchAddonRef.current = addon
    setSearchAddon(addon)
  }

  function closeSearch(): void {
    searchAddonRef.current?.dispose()
    searchAddonRef.current = null
    setSearchAddon(null)
    terminalRef.current?.focus()
  }

  useEffect(() => {
    const host = hostRef.current
    if (host === null) {
      return
    }

    const terminal = new Terminal({
      ...terminalOptions,
      fontSize: useTerminalFontStore.getState().fontSize,
      scrollback: useTerminalSettingsStore.getState().scrollback
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(host)
    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    terminal.attachCustomKeyEventHandler((event) => {
      const isFindShortcut = event.type === 'keydown' && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f'
      if (isFindShortcut) {
        void openSearch()
      }
      return !isFindShortcut
    })

    function fitToHost(): void {
      fitAddon.fit()
      window.api.pty.resize(paneId, terminal.cols, terminal.rows)
    }

    const stopListeningToOutput = window.api.pty.onData((event) => {
      if (event.id === paneId) {
        terminal.write(event.chunk)
        noteTerminalOutput(paneId)
      }
    })
    const stopListeningToExit = window.api.pty.onExit((event) => {
      if (event.id === paneId) {
        terminal.write('\r\n[process exited]\r\n')
      }
    })
    const stopListeningToTyping = terminal.onData((data) => window.api.pty.input(paneId, data))
    const resizeObserver = new ResizeObserver(fitToHost)
    resizeObserver.observe(host)

    void window.api.pty.create({ id: paneId, cwd, account, startCommand }).then(fitToHost)

    return () => {
      resizeObserver.disconnect()
      stopListeningToOutput()
      stopListeningToExit()
      stopListeningToTyping.dispose()
      forgetTerminalActivity(paneId)
      window.api.pty.kill(paneId)
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
      webglAddonRef.current = null
      searchAddonRef.current = null
    }
  }, [paneId])

  useEffect(() => {
    const terminal = terminalRef.current
    if (terminal === null) {
      return
    }
    if (isVisible && webglAddonRef.current === null) {
      const addon = createWebglAddon()
      if (addon !== null) {
        terminal.loadAddon(addon)
        webglAddonRef.current = addon
      }
    } else if (!isVisible && webglAddonRef.current !== null) {
      webglAddonRef.current.dispose()
      webglAddonRef.current = null
    }
  }, [isVisible, paneId])

  useEffect(() => {
    const terminal = terminalRef.current
    const fitAddon = fitAddonRef.current
    if (terminal === null || fitAddon === null) {
      return
    }
    terminal.options.fontSize = fontSize
    fitAddon.fit()
    window.api.pty.resize(paneId, terminal.cols, terminal.rows)
  }, [fontSize, paneId])

  useEffect(() => {
    if (terminalRef.current !== null) {
      terminalRef.current.options.scrollback = scrollback
    }
  }, [scrollback])

  function acceptsDrop(event: DragEvent): boolean {
    const types = Array.from(event.dataTransfer.types)
    return types.includes(DRAGGED_PATH_TYPE) || types.includes('Files')
  }

  function pasteDroppedPath(event: DragEvent): void {
    if (!acceptsDrop(event)) {
      return
    }
    event.preventDefault()
    const draggedPath = event.dataTransfer.getData(DRAGGED_PATH_TYPE)
    const droppedFile = event.dataTransfer.files[0]
    const path = draggedPath !== '' ? draggedPath : droppedFile === undefined ? '' : window.api.files.pathOf(droppedFile)
    if (path !== '') {
      window.api.pty.input(paneId, `${quotePathForShell(path)} `)
      terminalRef.current?.focus()
    }
  }

  return (
    <>
      <div
        className="terminal-host"
        ref={hostRef}
        onDragOver={(event) => acceptsDrop(event) && event.preventDefault()}
        onDrop={pasteDroppedPath}
      />
      {searchAddon !== null && <TerminalSearchBar searchAddon={searchAddon} onClose={closeSearch} />}
    </>
  )
}
