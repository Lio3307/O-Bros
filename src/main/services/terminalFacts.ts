import { appendToTail } from '../../shared/waitingPrompt'
import type { TerminalFacts } from './wot/memberState'

const BRACKETED_PASTE_ON = '\u001b[?2004h'
const BRACKETED_PASTE_OFF = '\u001b[?2004l'

export interface TerminalRecord extends TerminalFacts {
  cwd: string | null
  agentCommand: string | null
}

const records = new Map<string, TerminalRecord>()

function bracketedPasteAfter(chunk: string, wasOn: boolean): boolean {
  const lastOn = chunk.lastIndexOf(BRACKETED_PASTE_ON)
  const lastOff = chunk.lastIndexOf(BRACKETED_PASTE_OFF)
  if (lastOn === lastOff) {
    return wasOn
  }
  return lastOn > lastOff
}

export function noteTerminalStarted(id: string, cwd: string | null, agentCommand: string | null): void {
  records.set(id, {
    cwd,
    agentCommand,
    startedAt: Date.now(),
    lastOutputAt: null,
    lastInputAt: null,
    hasExited: false,
    isBracketedPaste: false,
    tail: ''
  })
}

export function noteTerminalOutput(id: string, chunk: string): void {
  const record = records.get(id)
  if (record !== undefined) {
    record.lastOutputAt = Date.now()
    record.tail = appendToTail(record.tail, chunk)
    record.isBracketedPaste = bracketedPasteAfter(chunk, record.isBracketedPaste)
  }
}

export function noteTerminalInput(id: string): void {
  const record = records.get(id)
  if (record !== undefined) {
    record.lastInputAt = Date.now()
  }
}

export function noteTerminalExited(id: string): void {
  const record = records.get(id)
  if (record !== undefined) {
    record.hasExited = true
  }
}

export function forgetTerminal(id: string): void {
  records.delete(id)
}

export function listTerminalRecords(): [string, TerminalRecord][] {
  return [...records.entries()]
}

export function terminalFactsOf(id: string): TerminalRecord | undefined {
  return records.get(id)
}
