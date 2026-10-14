import { spawn, type IPty } from '@lydell/node-pty'
import type { WebContents } from 'electron'
import { homedir } from 'node:os'
import { IpcChannel, type PtyCreateRequest } from '../../shared/ipc'
import { buildAccountEnvironment } from './accountEnvironment'

const OUTPUT_FLUSH_DELAY_MS = 8
const INITIAL_COLUMNS = 80
const INITIAL_ROWS = 24

const runningTerminals = new Map<string, IPty>()

function defaultShell(): string {
  if (process.platform === 'win32') {
    return 'powershell.exe'
  }
  return process.env.SHELL ?? '/bin/bash'
}

function inheritedEnvironment(): Record<string, string> {
  const entries = Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)
  return Object.fromEntries(entries)
}

function createBatchedSender(send: (chunk: string) => void) {
  let pendingOutput = ''
  let flushTimer: NodeJS.Timeout | null = null

  function flush(): void {
    if (flushTimer !== null) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    if (pendingOutput.length > 0) {
      send(pendingOutput)
      pendingOutput = ''
    }
  }

  function push(chunk: string): void {
    pendingOutput += chunk
    if (flushTimer === null) {
      flushTimer = setTimeout(flush, OUTPUT_FLUSH_DELAY_MS)
    }
  }

  return { push, flush }
}

export function createTerminal(owner: WebContents, request: PtyCreateRequest): void {
  runningTerminals.get(request.id)?.kill()

  const terminal = spawn(defaultShell(), [], {
    name: 'xterm-256color',
    cols: INITIAL_COLUMNS,
    rows: INITIAL_ROWS,
    cwd: request.cwd ?? homedir(),
    env: { ...inheritedEnvironment(), ...buildAccountEnvironment(request.account) }
  })
  runningTerminals.set(request.id, terminal)

  function sendToWindow(channel: string, payload: unknown): void {
    if (!owner.isDestroyed()) {
      owner.send(channel, payload)
    }
  }

  const output = createBatchedSender((chunk) => sendToWindow(IpcChannel.ptyData, { id: request.id, chunk }))
  terminal.onData(output.push)
  terminal.onExit(({ exitCode }) => {
    output.flush()
    runningTerminals.delete(request.id)
    sendToWindow(IpcChannel.ptyExit, { id: request.id, exitCode })
  })

  if (request.startCommand !== null) {
    terminal.write(`${request.startCommand}\r`)
  }
}

export function listRunningTerminals(): { id: string; pid: number }[] {
  return Array.from(runningTerminals, ([id, terminal]) => ({ id, pid: terminal.pid }))
}

export function writeToTerminal(id: string, data: string): void {
  runningTerminals.get(id)?.write(data)
}

export function resizeTerminal(id: string, columns: number, rows: number): void {
  runningTerminals.get(id)?.resize(columns, rows)
}

export function killTerminal(id: string): void {
  runningTerminals.get(id)?.kill()
  runningTerminals.delete(id)
}

export function killAllTerminals(): void {
  runningTerminals.forEach((terminal) => terminal.kill())
  runningTerminals.clear()
}
