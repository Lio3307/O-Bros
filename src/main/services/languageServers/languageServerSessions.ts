import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { WebContents } from 'electron'
import { IpcChannel } from '../../../shared/ipc'
import {
  pickServerFor,
  splitCommandLine,
  type LanguageServerSession,
  type LanguageServerStartRequest,
  type LanguageServerStatus,
  type RunningLanguageServer
} from '../../../shared/languageServers'
import { isPathInside } from '../../../shared/paths'
import { loadSettings } from '../../settings'
import { writeLog } from '../logging/logFile'
import { findWorkspaceRoot, listServerStatuses } from './languageServerCatalog'
import { frameMessage, MessageReader } from './messageFraming'

const IDLE_STOP_MS = 60_000
const MAX_LOGGED_ERROR_LINES = 20
const SHELL_SCRIPT_EXTENSIONS = ['.cmd', '.bat']

interface Session {
  info: LanguageServerSession
  key: string
  rootPath: string
  child: ChildProcess
  openFiles: number
  stopTimer: NodeJS.Timeout | null
}

const sessions = new Map<string, Session>()

function quoted(part: string): string {
  return part.includes(' ') ? `"${part}"` : part
}

function needsShell(command: string): boolean {
  const lower = command.toLowerCase()
  return process.platform === 'win32' && SHELL_SCRIPT_EXTENSIONS.some((extension) => lower.endsWith(extension))
}

function commandLineOf(server: LanguageServerStatus): string[] {
  if (server.source === 'custom') {
    return splitCommandLine(server.resolvedPath ?? '')
  }
  return [server.resolvedPath ?? server.command, ...server.args]
}

function startProcess(server: LanguageServerStatus, cwd: string): ChildProcess {
  if (server.source === 'custom') {
    return spawn(server.resolvedPath ?? '', { cwd, shell: true, windowsHide: true })
  }
  const command = server.resolvedPath ?? server.command
  if (needsShell(command)) {
    return spawn([command, ...server.args].map(quoted).join(' '), { cwd, shell: true, windowsHide: true })
  }
  return spawn(command, server.args, { cwd, windowsHide: true })
}

function killTree(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) {
    return
  }
  if (process.platform === 'win32') {
    execFile('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true }, () => undefined)
    return
  }
  child.kill()
}

function stopSession(session: Session): void {
  if (session.stopTimer !== null) {
    clearTimeout(session.stopTimer)
  }
  sessions.delete(session.info.sessionId)
  killTree(session.child)
}

async function projectRootOf(filePath: string): Promise<string> {
  const { projectRoots } = await loadSettings()
  const target = resolve(filePath)
  const root = projectRoots
    .filter((candidate) => isPathInside(target, resolve(candidate)))
    .sort((first, second) => second.length - first.length)[0]
  if (root === undefined) {
    throw new Error(`Path is outside the opened project folders: ${filePath}`)
  }
  return root
}

function attachOutput(session: Session, owner: WebContents): void {
  const reader = new MessageReader()
  let loggedLines = 0
  session.child.stdout?.on('data', (chunk: Buffer) => {
    for (const message of reader.push(chunk)) {
      if (!owner.isDestroyed()) {
        owner.send(IpcChannel.lspMessage, { sessionId: session.info.sessionId, message })
      }
    }
  })
  session.child.stderr?.on('data', (chunk: Buffer) => {
    if (loggedLines < MAX_LOGGED_ERROR_LINES) {
      loggedLines += 1
      writeLog('info', `${session.info.serverTitle}: ${chunk.toString('utf8').trim().slice(0, 300)}`)
    }
  })
  session.child.on('error', (error) => writeLog('warning', `${session.info.serverTitle} could not start: ${error.message}`))
  session.child.on('exit', () => {
    if (sessions.get(session.info.sessionId) === session) {
      sessions.delete(session.info.sessionId)
    }
    if (!owner.isDestroyed()) {
      owner.send(IpcChannel.lspClosed, session.info.sessionId)
    }
  })
}

export async function startLanguageServer(
  request: LanguageServerStartRequest,
  owner: WebContents
): Promise<LanguageServerSession | null> {
  const projectRoot = await projectRootOf(request.filePath)
  const workspaceRoot = await findWorkspaceRoot(request.filePath, projectRoot)
  const statuses = await listServerStatuses(workspaceRoot, request.choices)
  const server = pickServerFor(request.languageId, statuses, request.choices)
  if (server === null) {
    return null
  }
  const parts = commandLineOf(server)
  if (parts.length === 0) {
    return null
  }
  const key = [server.id, workspaceRoot, parts.join(' ')].join('|')
  const running = [...sessions.values()].find((session) => session.key === key)
  if (running !== undefined) {
    running.openFiles += 1
    if (running.stopTimer !== null) {
      clearTimeout(running.stopTimer)
      running.stopTimer = null
    }
    return running.info
  }
  const session: Session = {
    info: { sessionId: randomUUID(), serverId: server.id, serverTitle: server.title, rootUri: pathToFileURL(workspaceRoot).href, initializationOptions: server.initializationOptions },
    key,
    rootPath: workspaceRoot,
    child: startProcess(server, workspaceRoot),
    openFiles: 1,
    stopTimer: null
  }
  sessions.set(session.info.sessionId, session)
  attachOutput(session, owner)
  return session.info
}

export function sendToLanguageServer(sessionId: string, message: string): void {
  const stdin = sessions.get(sessionId)?.child.stdin
  if (stdin !== undefined && stdin !== null && stdin.writable) {
    stdin.write(frameMessage(message))
  }
}

export function releaseLanguageServer(sessionId: string): void {
  const session = sessions.get(sessionId)
  if (session === undefined) {
    return
  }
  session.openFiles = Math.max(session.openFiles - 1, 0)
  if (session.openFiles === 0 && session.stopTimer === null) {
    session.stopTimer = setTimeout(() => stopSession(session), IDLE_STOP_MS)
  }
}

export function stopLanguageServer(sessionId: string): void {
  const session = sessions.get(sessionId)
  if (session !== undefined) {
    stopSession(session)
  }
}

export function stopAllLanguageServers(): void {
  ;[...sessions.values()].forEach(stopSession)
}

export function listLanguageServerProcesses(): { sessionId: string; title: string; rootPath: string; pid: number }[] {
  return [...sessions.values()].flatMap((session) =>
    session.child.pid === undefined
      ? []
      : [{ sessionId: session.info.sessionId, title: session.info.serverTitle, rootPath: session.rootPath, pid: session.child.pid }]
  )
}

export function listRunningLanguageServers(): RunningLanguageServer[] {
  return [...sessions.values()].map((session) => ({
    sessionId: session.info.sessionId,
    serverTitle: session.info.serverTitle,
    rootPath: session.rootPath,
    openFiles: session.openFiles
  }))
}

export async function languageServerStatusesFor(
  folderPath: string | null,
  choices: LanguageServerStartRequest['choices']
): Promise<LanguageServerStatus[]> {
  if (folderPath === null) {
    return listServerStatuses(null, choices)
  }
  await projectRootOf(folderPath)
  return listServerStatuses(resolve(folderPath), choices)
}
