import { listSourceFiles, readSessionSources } from '../sessions/sessionSources'
import type { HistorySource } from './historySync'

export async function historySources(): Promise<HistorySource[]> {
  const files = await listSourceFiles(await readSessionSources())
  return files.map((file) => ({
    agent: file.source.format.provider,
    filePath: file.filePath,
    modifiedAt: file.modifiedAt,
    sizeBytes: file.sizeBytes,
    readHeader: file.source.format.readHeader,
    readMessagesFrom: file.source.format.readMessagesFrom
  }))
}
