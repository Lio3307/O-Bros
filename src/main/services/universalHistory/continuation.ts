import { randomUUID } from 'node:crypto'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { programOf, providerOfCommand } from '../../../shared/agentLaunchers'
import { buildHandoff, type HandoffPart } from '../../../shared/handoff'
import { addContinuation, readThreads, type HistoryThread, type ThreadPart } from '../../../shared/historyThreads'
import { comparablePath } from '../../../shared/paths'
import { commandWithSessionId } from '../../../shared/sessionCommand'
import { findTeamSessionId, taskStartOf } from '../../../shared/teamSessions'
import type { ContinuePlan, ContinueRequest, ProviderId, ThreadSummary } from '../../../shared/types'
import { agentFolderName, isHistoryFileOf, readHistoryRecord, type HistoryRecord } from '../../../shared/universalHistory'
import { IS_PATH_CASE_INSENSITIVE, readJsonIfExists } from '../fileSystem'
import { readGitStatus } from '../gitService'
import { readSessionCandidates, realFolderOf } from '../sessions/sessionCandidates'
import { listSourceFiles, readSessionSources, type SourceFile } from '../sessions/sessionSources'
import { currentHistoryFolder, saveUniversalHistoryNow } from './universalHistory'

const THREADS_FILE_NAME = 'threads.json'
const READABLE_AGENTS: string[] = ['claude', 'codex']
const AGENT_NAMES: Record<string, string> = { claude: 'Claude', codex: 'Codex' }

let threadQueue: Promise<unknown> = Promise.resolve()

function oneAtATime<Result>(task: () => Promise<Result>): Promise<Result> {
  const run = threadQueue.then(task)
  threadQueue = run.catch(() => undefined)
  return run
}

function agentNameOf(agent: string): string {
  return AGENT_NAMES[agent] ?? agent
}

async function loadThreads(folder: string): Promise<HistoryThread[]> {
  return readThreads(await readJsonIfExists<unknown>(join(folder, THREADS_FILE_NAME)).catch(() => null))
}

async function saveThreads(folder: string, threads: HistoryThread[]): Promise<void> {
  await mkdir(folder, { recursive: true })
  await writeFile(join(folder, THREADS_FILE_NAME), JSON.stringify(threads, null, 1), 'utf8')
}

function samePath(first: string, second: string): boolean {
  return comparablePath(first, IS_PATH_CASE_INSENSITIVE) === comparablePath(second, IS_PATH_CASE_INSENSITIVE)
}

async function allSourceFiles(): Promise<SourceFile[]> {
  return listSourceFiles(await readSessionSources())
}

async function linkPendingParts(threads: HistoryThread[]): Promise<boolean> {
  const pending = threads.flatMap((thread) => thread.parts).filter((part) => part.sessionId === null && READABLE_AGENTS.includes(part.agent))
  if (pending.length === 0) {
    return false
  }
  const candidates = await readSessionCandidates(await allSourceFiles(), Math.min(...pending.map((part) => part.startedAt)))
  const claimedIds = new Set(threads.flatMap((thread) => thread.parts.flatMap((part) => (part.sessionId === null ? [] : [part.sessionId]))))
  let hasLinked = false
  for (const part of pending) {
    const pendingSession = { provider: part.agent as ProviderId, cwd: await realFolderOf(part.cwd), startedAt: part.startedAt, taskStart: taskStartOf(part.marker) }
    const sessionId = findTeamSessionId(pendingSession, candidates, claimedIds, IS_PATH_CASE_INSENSITIVE)
    if (sessionId !== null) {
      part.sessionId = sessionId
      claimedIds.add(sessionId)
      hasLinked = true
    }
  }
  return hasLinked
}

async function recordOf(folder: string, part: ThreadPart): Promise<{ record: HistoryRecord; path: string } | null> {
  if (part.sessionId === null) {
    return null
  }
  const sessionId = part.sessionId
  const agentFolder = join(folder, agentFolderName(part.agent))
  const fileName = (await readdir(agentFolder).catch(() => [])).find((name) => isHistoryFileOf(name, sessionId))
  if (fileName === undefined) {
    return null
  }
  const path = join(agentFolder, fileName)
  const record = readHistoryRecord(await readJsonIfExists<unknown>(path).catch(() => null))
  return record === null ? null : { record, path }
}

async function handoffPartOf(folder: string, part: ThreadPart): Promise<HandoffPart> {
  const found = await recordOf(folder, part)
  return {
    agentName: agentNameOf(part.agent),
    title: found?.record.title ?? 'A conversation O-BROS could not read',
    updatedAt: found?.record.updatedAt ?? part.startedAt,
    messages: found?.record.messages ?? [],
    recordPath: found?.path ?? null
  }
}

async function changedFilesOf(cwd: string): Promise<string[]> {
  try {
    const status = await readGitStatus(cwd)
    return status === null ? [] : [...new Set(status.changes.map((change) => `${change.kind} ${change.path}`))]
  } catch {
    return []
  }
}

async function findSourceFile(sessionFilePath: string): Promise<SourceFile> {
  const file = (await allSourceFiles()).find((candidate) => samePath(candidate.filePath, sessionFilePath))
  if (file === undefined) {
    throw new Error('Not a known session file')
  }
  return file
}

export async function prepareContinuation(request: ContinueRequest): Promise<ContinuePlan> {
  const sourceFile = await findSourceFile(request.sessionFilePath)
  const header = await sourceFile.source.format.readHeader(sourceFile.filePath)
  const cwd = header.projectPath
  if (cwd === null) {
    throw new Error('This conversation has no folder, so another agent cannot continue it there.')
  }
  await saveUniversalHistoryNow()
  const folder = await currentHistoryFolder()
  const agentCommand = request.agentCommand.trim()
  const targetProvider = providerOfCommand(agentCommand)
  const targetSessionId = targetProvider === 'claude' ? randomUUID() : null

  return oneAtATime(async () => {
    const threads = await loadThreads(folder)
    await linkPendingParts(threads)
    const continued = addContinuation(
      threads,
      randomUUID(),
      { agent: sourceFile.source.format.provider, sessionId: header.sessionId, cwd, title: header.title, startedAt: sourceFile.modifiedAt },
      { agent: targetProvider ?? programOf(agentCommand), sessionId: targetSessionId, cwd, startedAt: Date.now() }
    )
    await saveThreads(folder, continued.threads)
    const earlierParts = continued.thread.parts.slice(0, -1)
    const handoffText = buildHandoff({
      marker: continued.marker,
      cwd,
      parts: await Promise.all(earlierParts.map((part) => handoffPartOf(folder, part))),
      changedFiles: await changedFilesOf(cwd)
    })
    return { cwd, command: commandWithSessionId(agentCommand, targetSessionId), handoffText, threadId: continued.thread.id }
  })
}

export async function latestSessionFile(provider: unknown, cwd: unknown, since: unknown): Promise<string | null> {
  if ((provider !== 'claude' && provider !== 'codex') || typeof cwd !== 'string' || typeof since !== 'number') {
    return null
  }
  const files = (await allSourceFiles()).filter((file) => file.source.format.provider === provider && file.modifiedAt >= since)
  const newestFirst = [...files].sort((first, second) => second.modifiedAt - first.modifiedAt)
  for (const file of newestFirst) {
    const header = await file.source.format.readHeader(file.filePath)
    if (header.projectPath !== null && samePath(await realFolderOf(header.projectPath), await realFolderOf(cwd))) {
      return file.filePath
    }
  }
  return null
}

export async function listThreadSummaries(): Promise<ThreadSummary[]> {
  const folder = await currentHistoryFolder()
  return oneAtATime(async () => {
    const threads = await loadThreads(folder)
    if (await linkPendingParts(threads)) {
      await saveThreads(folder, threads)
    }
    return threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      parts: thread.parts.map((part) => ({ agentName: agentNameOf(part.agent), sessionId: part.sessionId, startedAt: part.startedAt }))
    }))
  })
}
