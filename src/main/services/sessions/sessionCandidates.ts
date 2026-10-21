import { realpath } from 'node:fs'
import type { SessionCandidate } from '../../../shared/teamSessions'
import type { SourceFile } from './sessionSources'

export function realFolderOf(path: string): Promise<string> {
  return new Promise((resolve) => realpath.native(path, (error, resolved) => resolve(error === null ? resolved : path)))
}

export function readSessionCandidates(files: SourceFile[], since: number): Promise<SessionCandidate[]> {
  return Promise.all(
    files
      .filter((file) => file.modifiedAt >= since)
      .map(async (file) => {
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
