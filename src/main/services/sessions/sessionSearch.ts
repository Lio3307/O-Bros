import { findIgnoringCase, makeSnippet } from '../../../shared/searchSnippet'
import type { SessionSearchHit } from '../../../shared/types'
import { summarizeSessionFile } from './sessionLibrary'
import { listSourceFiles, readSessionSources, type SourceFile } from './sessionSources'

const MAX_HITS = 30
const MAX_SEARCHED_FILE_BYTES = 30 * 1024 * 1024
const MIN_QUERY_LENGTH = 2
const FILES_PER_BATCH = 4

async function findInFile(file: SourceFile, query: string): Promise<SessionSearchHit | null> {
  const messages = await file.source.format.readMessages(file.filePath)
  for (const message of messages) {
    const matchIndex = findIgnoringCase(message.text, query)
    if (matchIndex !== -1) {
      return { ...(await summarizeSessionFile(file)), snippet: makeSnippet(message.text, matchIndex, query.length) }
    }
  }
  return null
}

export async function searchSessions(rawQuery: string): Promise<SessionSearchHit[]> {
  const query = rawQuery.trim()
  if (query.length < MIN_QUERY_LENGTH) {
    return []
  }
  const files = (await listSourceFiles(await readSessionSources()))
    .filter((file) => file.sizeBytes <= MAX_SEARCHED_FILE_BYTES)
    .sort((first, second) => second.modifiedAt - first.modifiedAt)

  const hits: SessionSearchHit[] = []
  for (let start = 0; start < files.length && hits.length < MAX_HITS; start += FILES_PER_BATCH) {
    const batch = files.slice(start, start + FILES_PER_BATCH)
    const found = await Promise.all(batch.map((file) => findInFile(file, query).catch(() => null)))
    hits.push(...found.filter((hit): hit is SessionSearchHit => hit !== null))
  }
  return hits.slice(0, MAX_HITS)
}
