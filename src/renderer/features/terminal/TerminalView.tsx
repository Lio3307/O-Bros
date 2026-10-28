import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { useEffect, useRef, useState, type ClipboardEvent } from 'react'
import { PopupMenu } from '../../ui/PopupMenu'
import { pasteClipboardImage } from './pasteClipboardImage'
import type { AccountRef } from '../../../shared/types'
import { useAgentCommitStore } from '../../state/agentCommitStore'
import { providerForCommand } from '../../state/customProvidersStore'
import { activeColorTheme, useActiveColorTheme } from '../../state/colorThemeStore'
import { useAppearanceStore, useSurfaceAlpha } from '../../state/appearanceStore'
import { innerAlphaOf, surfaceAlphaOf, withAlpha } from '../../../shared/appearance'
import { useTerminalFontStore } from '../../state/terminalFontStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { quotePathForShell } from '../../../shared/shellQuote'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { terminalContrastOf, terminalThemeOf } from '../../theme/colorThemes'
import { useFileTreeStore } from '../../state/fileTreeStore'
import { cn } from '../../ui/cn'
import { LoadingText } from '../../ui/LoadingText'
import { agentLabelOf } from '../../../shared/agentLaunchers'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useFileDropTarget } from '../files/useFileDropTarget'
import { createFileLinkProvider } from './fileLinkProvider'
import { openFileReference } from './openFileReference'
import { forgetTerminalActivity, noteTerminalOutput } from './terminalActivityMonitor'
import { noteAgentOutput, noteAgentTyping } from './agentStatusTracking'
import { forgetPtySize, sendPtySize } from './ptySizeSender'
import { registerTerminal, unregisterTerminal } from './terminalRegistry'
import { TerminalSearchBar } from './TerminalSearchBar'
import { terminalOptions } from './terminalTheme'
import { routePaneOutput } from './ptyOutputRouter'
import { trimTerminalToHost } from './terminalFit'
import { useGpuRenderer } from './useGpuRenderer'
import { useTerminalContextMenu } from './useTerminalContextMenu'
import { useTerminalSearch } from './useTerminalSearch'

interface TerminalViewProps {
  paneId: string
  cwd: string | null
  account: AccountRef | null
  startCommand: string | null
  startsAgent: boolean
  isVisible: boolean
  isFocusTarget: boolean
}

const STARTING_HINT_LIMIT_MS = 10_000

function isDialogOpen(): boolean {
  return document.querySelector('[aria-modal="true"]') !== null
}

function isFindShortcut(event: KeyboardEvent): boolean {
  return event.type === 'keydown' && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f'
}

function fitToHost(paneId: string, terminal: Terminal, fitAddon: FitAddon, host: HTMLElement): void {
  fitAddon.fit()
  trimTerminalToHost(terminal, host)
  sendPtySize(paneId, terminal.cols, terminal.rows)
}

function createTerminal(): Terminal {
  const { appearance, wallpaperUrl } = useAppearanceStore.getState()
  return new Terminal({
    ...terminalOptions,
    fontSize: useTerminalFontStore.getState().fontSize,
    minimumContrastRatio: terminalContrastOf(activeColorTheme()),
    theme: terminalThemeOf(activeColorTheme(), innerAlphaOf(surfaceAlphaOf(appearance, wallpaperUrl !== null))),
    scrollback: useTerminalSettingsStore.getState().scrollback
  })
}

export function TerminalView({ paneId, cwd, account, startCommand, startsAgent, isVisible, isFocusTarget }: TerminalViewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isStarting, setIsStarting] = useState(true)
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const fontSize = useTerminalFontStore((state) => state.fontSize)
  const scrollback = useTerminalSettingsStore((state) => state.scrollback)
  const useGpuRendering = useTerminalSettingsStore((state) => state.useGpuRendering)
  const colorTheme = useActiveColorTheme()
  const surfaceAlpha = useSurfaceAlpha()
  const { searchAddon, openSearch, closeSearch, forgetSearch } = useTerminalSearch(terminalRef)
  const { contextMenu, closeContextMenu, menuHandlers } = useTerminalContextMenu(terminalRef, paneId)
  const { isDropTarget, dropHandlers } = useFileDropTarget(pastePaths)
  const startingLabel = startsAgent && startCommand !== null ? `Starting ${agentLabelOf(startCommand, launchers)}…` : 'Starting the terminal…'

  function refitToHost(): void {
    const terminal = terminalRef.current
    const fitAddon = fitAddonRef.current
    const host = hostRef.current
    if (terminal !== null && fitAddon !== null && host !== null) {
      fitToHost(paneId, terminal, fitAddon, host)
    }
  }

  useEffect(() => {
    const host = hostRef.current
    if (host === null) {
      return
    }
    const terminal = createTerminal()
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(host)
    terminalRef.current = terminal
    fitAddonRef.current = fitAddon
    registerTerminal(paneId, terminal)
    terminal.registerLinkProvider(createFileLinkProvider(terminal, (reference) => void openFileReference(reference, cwd)))
    terminal.attachCustomKeyEventHandler((event) => {
      if (isFindShortcut(event)) {
        void openSearch()
        return false
      }
      return true
    })

    const fit = () => fitToHost(paneId, terminal, fitAddon, host)
    const startingHintTimer = setTimeout(() => setIsStarting(false), STARTING_HINT_LIMIT_MS)
    const stopRoutingOutput = routePaneOutput(paneId, {
      onOutput: (chunk) => {
        setIsStarting(false)
        terminal.write(chunk)
        noteTerminalOutput(paneId, chunk)
        noteAgentOutput(paneId)
      },
      onExit: () => terminal.write('\r\n[process exited]\r\n')
    })
    const stopListeningToTyping = terminal.onData((data) => {
      setIsStarting(false)
      noteAgentTyping(paneId, data)
      window.api.pty.input(paneId, data)
    })
    const resizeObserver = new ResizeObserver(fit)
    resizeObserver.observe(host)
    void document.fonts.ready.then(() => {
      if (terminalRef.current === terminal) {
        fit()
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
      .then(
        () => {
          forgetPtySize(paneId)
          fit()
        },
        (error: unknown) => {
          setIsStarting(false)
          terminal.writeln(friendlyErrorMessage(error, 'The terminal could not start.'))
          terminal.writeln(cwd ?? '')
        }
      )

    return () => {
      resizeObserver.disconnect()
      clearTimeout(startingHintTimer)
      stopRoutingOutput()
      stopListeningToTyping.dispose()
      forgetTerminalActivity(paneId)
      forgetPtySize(paneId)
      unregisterTerminal(paneId)
      window.api.pty.kill(paneId)
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
      forgetSearch()
    }
  }, [paneId])

  useGpuRenderer(terminalRef, paneId, isVisible && useGpuRendering, refitToHost)

  useEffect(() => {
    if (terminalRef.current !== null) {
      terminalRef.current.options.fontSize = fontSize
      refitToHost()
    }
  }, [fontSize, paneId])

  useEffect(() => {
    if (terminalRef.current !== null) {
      terminalRef.current.options.scrollback = scrollback
    }
  }, [scrollback])

  useEffect(() => {
    if (isVisible && isFocusTarget && !isDialogOpen()) {
      terminalRef.current?.focus()
    }
  }, [isVisible, isFocusTarget])

  useEffect(() => {
    if (terminalRef.current !== null) {
      terminalRef.current.options.theme = terminalThemeOf(colorTheme, innerAlphaOf(surfaceAlpha))
      terminalRef.current.options.minimumContrastRatio = terminalContrastOf(colorTheme)
    }
  }, [colorTheme, surfaceAlpha])

  function pastePaths(paths: string[]): void {
    const terminal = terminalRef.current
    if (terminal === null) {
      return
    }
    terminal.paste(`${paths.map(quotePathForShell).join(' ')} `)
    terminal.focus()
    useFileTreeStore.getState().clearPicked()
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

  return (
    <>
      <div
        className={cn('terminal-host', isDropTarget && 'terminal-host-drop')}
        style={{ backgroundColor: withAlpha(colorTheme.background, innerAlphaOf(surfaceAlpha)) }}
        ref={hostRef}
        {...dropHandlers}
        {...menuHandlers}
        onPasteCapture={pasteImageWhenNoText}
      />
      {isStarting && (
        <div className="loading-overlay">
          <LoadingText text={startingLabel} isDelayed />
        </div>
      )}
      {contextMenu !== null && <PopupMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={closeContextMenu} />}
      {searchAddon !== null && <TerminalSearchBar searchAddon={searchAddon} onClose={closeSearch} />}
    </>
  )
}
