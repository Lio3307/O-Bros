import { accountToRef } from '../../../shared/accounts'
import type { SessionMessage, SessionSummary } from '../../../shared/types'
import { findSourceOf, listSourceFiles, readSessionSources, type SourceFile } from './sessionSources'

const MAX_LISTED_SESSIONS = 50

export async function summarizeSessionFile(file: SourceFile): Promise<SessionSummary> {
  const header = await file.source.format.readHeader(file.filePath)
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

export async function listSessions(): Promise<SessionSummary[]> {
  const files = await listSourceFiles(await readSessionSources())
  const newestFiles = files
    .sort((first, second) => second.modifiedAt - first.modifiedAt)
    .slice(0, MAX_LISTED_SESSIONS)

  return Promise.all(newestFiles.map(summarizeSessionFile))
}

export async function readSession(filePath: string): Promise<SessionMessage[]> {
  const source = findSourceOf(await readSessionSources(), filePath)
  return source.format.readMessages(filePath)
}
