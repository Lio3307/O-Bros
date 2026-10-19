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

export function readTerminalText(paneId: string, lineCount: number): string | null {
  const terminal = terminalsByPaneId.get(paneId)
  if (terminal === undefined) {
    return null
  }
  const buffer = terminal.buffer.active
  const lineAt = (index: number): string => buffer.getLine(index)?.translateToString(true) ?? ''
  let lastIndex = buffer.length - 1
  while (lastIndex > 0 && lineAt(lastIndex).trim() === '') {
    lastIndex -= 1
  }
  const lines: string[] = []
  for (let index = Math.max(0, lastIndex - lineCount + 1); index <= lastIndex; index += 1) {
    lines.push(lineAt(index))
  }
  return lines.join('\n')
}

export function readTerminalMemory(): TerminalMemory {
  const terminals = [...terminalsByPaneId.values()]
  const bufferedLines = terminals.reduce((total, terminal) => total + terminal.buffer.active.length, 0)
  return { terminalCount: terminals.length, bufferedLines }
}

export function clearAllTerminalScrollback(): void {
  terminalsByPaneId.forEach((terminal) => terminal.write(ERASE_SCROLLBACK_SEQUENCE))
}
