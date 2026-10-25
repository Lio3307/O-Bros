import { FitAddon } from '@xterm/addon-fit'
import type { SearchAddon } from '@xterm/addon-search'
import type { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { useShortcutLabel } from '../../state/shortcutsStore'
import { isTerminalTab, useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { PopupMenu, type PopupMenuItem } from '../../ui/PopupMenu'
import { terminalMenuItems } from './terminalContextMenu'
import { pasteClipboardImage } from './pasteClipboardImage'
import type { AccountRef } from '../../../shared/types'
import { useAgentCommitStore } from '../../state/agentCommitStore'
import { providerForCommand } from '../../state/customProvidersStore'
import { useColorThemeStore } from '../../state/colorThemeStore'
import { useTerminalFontStore } from '../../state/terminalFontStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { quotePathForShell } from '../../../shared/shellQuote'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
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

const RIGHT_BUTTON = 2

interface OpenContextMenu {
  x: number
  y: number
  items: PopupMenuItem[]
}

function createWebglAddon(WebglAddonClass: typeof WebglAddon): WebglAddon | null {
  try {
    const addon = new WebglAddonClass()
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
  const splitRightHint = useShortcutLabel('splitRight')
  const splitDownHint = useShortcutLabel('splitDown')
  const [contextMenu, setContextMenu] = useState<OpenContextMenu | null>(null)
  const closeContextMenu = useCallback(() => setContextMenu(null), [])

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

  function refitToHost(): void {
    const terminal = terminalRef.current
    const fitAddon = fitAddonRef.current
    const host = hostRef.current
    if (terminal === null || fitAddon === null || host === null) {
      return
    }
    fitAddon.fit()
    trimTerminalToHost(terminal, host)
    window.api.pty.resize(paneId, terminal.cols, terminal.rows)
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
      .create({
        id: paneId,
        cwd,
        account,
        startCommand,
        startsAgent,
        commitIdentity: useAgentCommitStore.getState().identity,
        provider: startsAgent ? providerForCommand(startCommand) : null
      })
      .then(fitToHost, (error: unknown) => {
        terminal.writeln(friendlyErrorMessage(error, 'The terminal could not start.'))
        terminal.writeln(cwd ?? '')
      })

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
    if (!wantsWebgl && webglAddonRef.current !== null) {
      webglAddonRef.current.dispose()
      webglAddonRef.current = null
      refitToHost()
    }
    if (!wantsWebgl || webglAddonRef.current !== null) {
      return
    }
    let isStillWanted = true
    void import('@xterm/addon-webgl').then(({ WebglAddon: WebglAddonClass }) => {
      if (!isStillWanted || terminalRef.current !== terminal || webglAddonRef.current !== null) {
        return
      }
      const addon = createWebglAddon(WebglAddonClass)
      if (addon !== null) {
        terminal.loadAddon(addon)
        webglAddonRef.current = addon
        refitToHost()
      }
    })
    return () => {
      isStillWanted = false
    }
  }, [isVisible, useGpuRendering, paneId])

  useEffect(() => {
    const terminal = terminalRef.current
    const fitAddon = fitAddonRef.current
    if (terminal === null || fitAddon === null) {
      return
    }
    terminal.options.fontSize = fontSize
    refitToHost()
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

  function pasteImageWhenNoText(event: ClipboardEvent): void {
    const terminal = terminalRef.current
    if (terminal === null || event.clipboardData.getData('text/plain') !== '') {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    void pasteClipboardImage(terminal)
  }

  function keepRightButtonFromTerminal(event: ReactMouseEvent): void {
    if (event.button === RIGHT_BUTTON) {
      event.stopPropagation()
    }
  }

  function openContextMenu(event: ReactMouseEvent): void {
    event.preventDefault()
    event.stopPropagation()
    const terminal = terminalRef.current
    const tab = useWorkspaceStore.getState().tabs.find((candidate): candidate is TerminalTab => isTerminalTab(candidate) && paneId in candidate.panes)
    if (terminal === null || tab === undefined) {
      return
    }
    useWorkspaceStore.getState().focusPane(tab.id, paneId)
    const position = { x: event.clientX, y: event.clientY }
    const show = (items: PopupMenuItem[]): void => setContextMenu({ ...position, items })
    show(terminalMenuItems({ terminal, tab, paneId, splitRightHint, splitDownHint, reopen: show }))
  }

  return (
    <>
      <div
        className="terminal-host"
        style={{ backgroundColor: findColorTheme(colorThemeId).background }}
        ref={hostRef}
        onDragOver={(event) => acceptsDrop(event) && event.preventDefault()}
        onDrop={pasteDroppedPath}
        onMouseDownCapture={keepRightButtonFromTerminal}
        onMouseUpCapture={keepRightButtonFromTerminal}
        onContextMenuCapture={openContextMenu}
        onPasteCapture={pasteImageWhenNoText}
      />
      {contextMenu !== null && <PopupMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={closeContextMenu} />}
      {searchAddon !== null && <TerminalSearchBar searchAddon={searchAddon} onClose={closeSearch} />}
    </>
  )
}
