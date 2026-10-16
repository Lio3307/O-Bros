import { FitAddon } from '@xterm/addon-fit'
import type { SearchAddon } from '@xterm/addon-search'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import type { AccountRef } from '../../../shared/types'
import { useAgentCommitStore } from '../../state/agentCommitStore'
import { useColorThemeStore } from '../../state/colorThemeStore'
import { useTerminalFontStore } from '../../state/terminalFontStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { quotePathForShell } from '../../../shared/shellQuote'
import { findColorTheme, terminalThemeOf } from '../../theme/colorThemes'
import { DRAGGED_PATH_TYPE } from '../files/dragData'
import { createFileLinkProvider } from './fileLinkProvider'
import { openFileReference } from './openFileReference'
import { forgetTerminalActivity, noteTerminalOutput } from './terminalActivityMonitor'
import { registerTerminal, unregisterTerminal } from './terminalRegistry'
import { TerminalSearchBar } from './TerminalSearchBar'
import { terminalOptions } from './terminalTheme'
import { routePaneOutput } from './ptyOutputRouter'
import { trimTerminalToHost } from './terminalFit'

interface TerminalViewProps {
  paneId: string
  cwd: string | null
  account: AccountRef | null
  startCommand: string | null
  startsAgent: boolean
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

export function TerminalView({ paneId, cwd, account, startCommand, startsAgent, isVisible }: TerminalViewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const webglAddonRef = useRef<WebglAddon | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)
  const [searchAddon, setSearchAddon] = useState<SearchAddon | null>(null)
  const fontSize = useTerminalFontStore((state) => state.fontSize)
  const scrollback = useTerminalSettingsStore((state) => state.scrollback)
  const useGpuRendering = useTerminalSettingsStore((state) => state.useGpuRendering)
  const colorThemeId = useColorThemeStore((state) => state.themeId)

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
      theme: terminalThemeOf(findColorTheme(useColorThemeStore.getState().themeId)),
      scrollback: useTerminalSettingsStore.getState().scrollback
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(host)
    terminalRef.current = terminal
    fitAddonRef.current = fitAddon
    registerTerminal(paneId, terminal)
    terminal.registerLinkProvider(
      createFileLinkProvider(terminal, (reference) => void openFileReference(reference, cwd))
    )

    terminal.attachCustomKeyEventHandler((event) => {
      const isFindShortcut = event.type === 'keydown' && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f'
      if (isFindShortcut) {
        void openSearch()
      }
      return !isFindShortcut
    })

    function fitToHost(): void {
      fitAddon.fit()
      trimTerminalToHost(terminal, host as HTMLElement)
      window.api.pty.resize(paneId, terminal.cols, terminal.rows)
    }


    const stopRoutingOutput = routePaneOutput(paneId, {
      onOutput: (chunk) => {
        terminal.write(chunk)
        noteTerminalOutput(paneId, chunk)
      },
      onExit: () => terminal.write('\r\n[process exited]\r\n')
    })
    const stopListeningToTyping = terminal.onData((data) => window.api.pty.input(paneId, data))
    const resizeObserver = new ResizeObserver(fitToHost)
    resizeObserver.observe(host)
    void document.fonts.ready.then(() => {
      if (terminalRef.current === terminal) {
        fitToHost()
      }
    })

    void window.api.pty
      .create({ id: paneId, cwd, account, startCommand, startsAgent, commitIdentity: useAgentCommitStore.getState().identity }).then(fitToHost)

    return () => {
      resizeObserver.disconnect()
      stopRoutingOutput()
      stopListeningToTyping.dispose()
      forgetTerminalActivity(paneId)
      unregisterTerminal(paneId)
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
    const wantsWebgl = isVisible && useGpuRendering
    if (wantsWebgl && webglAddonRef.current === null) {
      const addon = createWebglAddon()
      if (addon !== null) {
        terminal.loadAddon(addon)
        webglAddonRef.current = addon
      }
    } else if (!wantsWebgl && webglAddonRef.current !== null) {
      webglAddonRef.current.dispose()
      webglAddonRef.current = null
    }
  }, [isVisible, useGpuRendering, paneId])

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

  useEffect(() => {
    if (terminalRef.current !== null) {
      terminalRef.current.options.theme = terminalThemeOf(findColorTheme(colorThemeId))
    }
  }, [colorThemeId])

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
        style={{ backgroundColor: findColorTheme(colorThemeId).background }}
        ref={hostRef}
        onDragOver={(event) => acceptsDrop(event) && event.preventDefault()}
        onDrop={pasteDroppedPath}
      />
      {searchAddon !== null && <TerminalSearchBar searchAddon={searchAddon} onClose={closeSearch} />}
    </>
  )
}
