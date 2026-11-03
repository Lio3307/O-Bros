import { accountToRef } from '../../../shared/accounts'
import type { SessionMessage, SessionPage, SessionSummary } from '../../../shared/types'
import { forgetHeadersExcept, readHeaderOf } from './headerCache'
import { findSourceOf, listSourceFiles, readSessionSources, type SourceFile } from './sessionSources'

const HEADERS_READ_AT_ONCE = 50

export async function summarizeSessionFile(file: SourceFile): Promise<SessionSummary> {
  const header = await readHeaderOf(file, file.source.format.readHeader)
  return {
    filePath: file.filePath,
    sessionId: header.sessionId,
    provider: file.source.format.provider,
    account: accountToRef(file.source.account),
    title: header.title,
    projectPath: header.projectPath,
    lastActiveAt: file.modifiedAt,
    sizeBytes: file.sizeBytes,
    teamMemberName: null
  }
}

async function summarizeAFewAtATime(files: SourceFile[]): Promise<SessionSummary[]> {
  const summaries: SessionSummary[] = []
  for (let start = 0; start < files.length; start += HEADERS_READ_AT_ONCE) {
    summaries.push(...(await Promise.all(files.slice(start, start + HEADERS_READ_AT_ONCE).map(summarizeSessionFile))))
  }
  return summaries
}

export async function listSessions(limit: number): Promise<SessionPage> {
  const files = await listSourceFiles(await readSessionSources())
  forgetHeadersExcept(files)
  const newestFiles = files.sort((first, second) => second.modifiedAt - first.modifiedAt).slice(0, limit)
  return {
    sessions: await summarizeAFewAtATime(newestFiles),
    total: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.sizeBytes, 0)
  }
}

export async function readSession(filePath: string): Promise<SessionMessage[]> {
  const source = findSourceOf(await readSessionSources(), filePath)
  return source.format.readMessages(filePath)
}
