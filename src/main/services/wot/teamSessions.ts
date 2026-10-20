import { app } from 'electron'
import { realpath } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import {
  findTeamSessionId,
  isSessionFileOf,
  MAX_TEAM_SESSION_RECORDS,
  readTeamSessionRecords,
  type SessionCandidate,
  type TeamSessionRecord
} from '../../../shared/teamSessions'
import type { RemoveSessionsResult } from '../../../shared/types'
import { readJsonIfExists } from '../fileSystem'
import { removeSessions } from '../sessions/sessionRemoval'
import { listSourceFiles, readSessionSources, type SourceFile } from '../sessions/sessionSources'
import { TRANSCRIPT_EXTENSION } from '../sessions/transcriptFormat'

export interface TeamSessionFile {
  record: TeamSessionRecord
  sessionId: string
  filePath: string
  sizeBytes: number
}

const IS_PATH_CASE_INSENSITIVE = process.platform === 'win32' || process.platform === 'darwin'
const RESOLVE_WINDOW_MS = 24 * 60 * 60 * 1000

let records: TeamSessionRecord[] = []
let loading: Promise<void> | null = null
let saving: Promise<void> = Promise.resolve()

function recordsFilePath(): string {
  return join(app.getPath('userData'), 'team-sessions.json')
}

function ensureLoaded(): Promise<void> {
  loading ??= readJsonIfExists<unknown>(recordsFilePath())
    .catch(() => null)
    .then((saved) => {
      records = [...readTeamSessionRecords(saved), ...records].slice(-MAX_TEAM_SESSION_RECORDS)
    })
  return loading
}

function save(): void {
  const snapshot = records
  saving = saving
    .then(async () => {
      await mkdir(dirname(recordsFilePath()), { recursive: true })
      await writeFile(recordsFilePath(), JSON.stringify(snapshot), 'utf8')
    })
    .catch(() => undefined)
}

export async function rememberTeamSession(record: TeamSessionRecord): Promise<void> {
  await ensureLoaded()
  records = [...records, record].slice(-MAX_TEAM_SESSION_RECORDS)
  save()
}

function realFolderOf(path: string): Promise<string> {
  return new Promise((resolve) => realpath.native(path, (error, resolved) => resolve(error === null ? resolved : path)))
}

function baseNameOf(file: SourceFile): string {
  return basename(file.filePath, TRANSCRIPT_EXTENSION)
}

async function candidatesFor(pending: TeamSessionRecord[], files: SourceFile[]): Promise<SessionCandidate[]> {
  const oldestStart = Math.min(...pending.map((record) => record.startedAt))
  const recentFiles = files.filter((file) => file.modifiedAt >= oldestStart)
  return Promise.all(
    recentFiles.map(async (file) => {
      const header = await file.source.format.readHeader(file.filePath)
      return {
        sessionId: header.sessionId,
        provider: file.source.format.provider,
        projectPath: header.projectPath === null ? null : await realFolderOf(header.projectPath),
        title: header.title,
        modifiedAt: file.modifiedAt
      }
    })
  )
}

async function resolvePendingRecords(files: SourceFile[]): Promise<void> {
  const now = Date.now()
  const pending = records.filter(
    (record) => record.sessionId === null && record.taskStart !== '' && now - record.startedAt < RESOLVE_WINDOW_MS
  )
  if (pending.length === 0) {
    return
  }
  const candidates = await candidatesFor(pending, files)
  const claimedIds = new Set(records.flatMap((record) => (record.sessionId === null ? [] : [record.sessionId])))
  let hasResolved = false
  for (const record of pending) {
    const sessionId = findTeamSessionId({ ...record, cwd: await realFolderOf(record.cwd) }, candidates, claimedIds, IS_PATH_CASE_INSENSITIVE)
    if (sessionId !== null) {
      record.sessionId = sessionId
      claimedIds.add(sessionId)
      hasResolved = true
    }
  }
  if (hasResolved) {
    save()
  }
}

export async function listTeamSessionFiles(): Promise<TeamSessionFile[]> {
  await ensureLoaded()
  const files = await listSourceFiles(await readSessionSources())
  await resolvePendingRecords(files)
  return records.flatMap((record) => {
    const sessionId = record.sessionId
    const file = sessionId === null ? undefined : files.find((candidate) => isSessionFileOf(baseNameOf(candidate), sessionId))
    return sessionId === null || file === undefined ? [] : [{ record, sessionId, filePath: file.filePath, sizeBytes: file.sizeBytes }]
  })
}

export async function teamMemberNamesBySessionId(): Promise<Map<string, string>> {
  const files = await listTeamSessionFiles()
  return new Map(files.map(({ sessionId, record }) => [sessionId, record.memberName]))
}

export async function removeTeamSessionFiles(memberId: string | null, permanently: boolean): Promise<RemoveSessionsResult> {
  const files = (await listTeamSessionFiles()).filter((file) => memberId === null || file.record.memberId === memberId)
  return removeSessions(
    files.map((file) => file.filePath),
    permanently
  )
}
