import type { Terminal } from '@xterm/xterm'

const ERASE_SCROLLBACK_SEQUENCE = '\u001b[3J'

export interface TerminalMemory {
  terminalCount: number
  bufferedLines: number
}

const terminalsByPaneId = new Map<string, Terminal>()

export function registerTerminal(paneId: string, terminal: Terminal): void {
  terminalsByPaneId.set(paneId, terminal)
}

export function unregisterTerminal(paneId: string): void {
  terminalsByPaneId.delete(paneId)
}

export function readTerminalMemory(): TerminalMemory {
  const terminals = [...terminalsByPaneId.values()]
  const bufferedLines = terminals.reduce((total, terminal) => total + terminal.buffer.active.length, 0)
  return { terminalCount: terminals.length, bufferedLines }
}

export function clearAllTerminalScrollback(): void {
  terminalsByPaneId.forEach((terminal) => terminal.write(ERASE_SCROLLBACK_SEQUENCE))
}
