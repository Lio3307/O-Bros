import { app } from 'electron'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import {
  findTeamSessionId,
  isSessionFileOf,
  MAX_TEAM_SESSION_RECORDS,
  readTeamSessionRecords,
  type TeamSessionRecord
} from '../../../shared/teamSessions'
import type { RemoveSessionsResult } from '../../../shared/types'
import { IS_PATH_CASE_INSENSITIVE, readJsonIfExists } from '../fileSystem'
import { readSessionCandidates, realFolderOf } from '../sessions/sessionCandidates'
import { removeSessions } from '../sessions/sessionRemoval'
import { listSourceFiles, readSessionSources, type SourceFile } from '../sessions/sessionSources'
import { TRANSCRIPT_EXTENSION } from '../sessions/transcriptFormat'

export interface TeamSessionFile {
  record: TeamSessionRecord
  sessionId: string
  filePath: string
  sizeBytes: number
}

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

function baseNameOf(file: SourceFile): string {
  return basename(file.filePath, TRANSCRIPT_EXTENSION)
}

async function resolvePendingRecords(files: SourceFile[]): Promise<void> {
  const now = Date.now()
  const pending = records.filter(
    (record) => record.sessionId === null && record.taskStart !== '' && now - record.startedAt < RESOLVE_WINDOW_MS
  )
  if (pending.length === 0) {
    return
  }
  const candidates = await readSessionCandidates(files, Math.min(...pending.map((record) => record.startedAt)))
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
