import { spawn, type IPty } from '@lydell/node-pty'
import type { WebContents } from 'electron'
import { homedir } from 'node:os'
import { IpcChannel, type PtyCreateRequest } from '../../shared/ipc'
import { buildAccountEnvironment } from './accountEnvironment'
import {
  forgetTerminal,
  noteTerminalExited,
  noteTerminalInput,
  noteTerminalOutput,
  noteTerminalStarted
} from './terminalFacts'
import { withWotEnvironment } from './wot/wotEnvironment'
import { identityEnvironment } from '../../shared/commitIdentity'
import { isTeamMemberPaneId } from '../../shared/teamMemberName'
import { formatDuration } from '../../shared/time'
import { recordActivity } from './activity/activityLog'

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

function agentCommandOf(request: PtyCreateRequest): string | null {
  return request.startsAgent === true && request.startCommand !== null ? request.startCommand : null
}

function recordAgentSession(request: PtyCreateRequest, agentCommand: string, text: string, durationMs: number | null): void {
  if (!isTeamMemberPaneId(request.id)) {
    void recordActivity({ kind: 'session', agentCommand, folder: request.cwd, text, detail: null, outcome: null, durationMs })
  }
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
    env: withWotEnvironment(
      {
        ...inheritedEnvironment(),
        ...buildAccountEnvironment(request.account),
        ...(request.startsAgent === true ? identityEnvironment(request.commitIdentity ?? null) : {})
      },
      request.id
    )
  })
  runningTerminals.set(request.id, terminal)
  const agentCommand = agentCommandOf(request)
  const startedAt = Date.now()
  noteTerminalStarted(request.id, request.cwd, agentCommand)
  if (agentCommand !== null) {
    recordAgentSession(request, agentCommand, 'started', null)
  }

  function sendToWindow(channel: string, payload: unknown): void {
    if (!owner.isDestroyed()) {
      owner.send(channel, payload)
    }
  }

  const output = createBatchedSender((chunk) => sendToWindow(IpcChannel.ptyData, { id: request.id, chunk }))
  terminal.onData((chunk) => {
    if (runningTerminals.get(request.id) === terminal) {
      noteTerminalOutput(request.id, chunk)
    }
    output.push(chunk)
  })
  terminal.onExit(({ exitCode }) => {
    output.flush()
    if (agentCommand !== null) {
      const durationMs = Date.now() - startedAt
      recordAgentSession(request, agentCommand, `closed after ${formatDuration(durationMs)}`, durationMs)
    }
    if (runningTerminals.get(request.id) === terminal) {
      noteTerminalExited(request.id)
      runningTerminals.delete(request.id)
    }
    sendToWindow(IpcChannel.ptyExit, { id: request.id, exitCode })
  })

  if (request.startCommand !== null) {
    terminal.write(`${request.startCommand}\r`)
  }
}

export function terminalPidOf(id: string): number | null {
  return runningTerminals.get(id)?.pid ?? null
}

export function listRunningTerminals(): { id: string; pid: number }[] {
  return Array.from(runningTerminals, ([id, terminal]) => ({ id, pid: terminal.pid }))
}

export function writeToTerminal(id: string, data: string): void {
  const terminal = runningTerminals.get(id)
  if (terminal !== undefined) {
    noteTerminalInput(id)
    terminal.write(data)
  }
}

export function resizeTerminal(id: string, columns: number, rows: number): void {
  runningTerminals.get(id)?.resize(columns, rows)
}

export function killTerminal(id: string): void {
  runningTerminals.get(id)?.kill()
  runningTerminals.delete(id)
  forgetTerminal(id)
}

export function killAllTerminals(): void {
  runningTerminals.forEach((terminal) => terminal.kill())
  runningTerminals.clear()
}
