import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  agentFolderName,
  agentOfFolderName,
  HISTORY_FORMAT_VERSION,
  historyFileName,
  isHistoryExpired,
  isHistoryFile,
  type HistoryRecord
} from '../../../shared/universalHistory'
import { isRecord } from '../../../shared/isRecord'
import type { SessionMessage } from '../../../shared/types'
import { readJsonIfExists } from '../fileSystem'
import type { TranscriptHeader } from '../sessions/transcriptFormat'

const INDEX_FILE_NAME = 'index.json'
const INDEX_SAVE_EVERY = 20

export interface HistorySource {
  agent: string
  filePath: string
  modifiedAt: number
  readHeader: (filePath: string) => Promise<TranscriptHeader>
  readMessages: (filePath: string) => Promise<SessionMessage[]>
}

interface IndexEntry {
  modifiedAt: number
  recordFile: string
}

type HistoryIndex = Record<string, IndexEntry>

export interface AgentHistorySize {
  agent: string
  folderName: string
  conversationCount: number
  totalBytes: number
}

function isIndexEntry(value: unknown): value is IndexEntry {
  return isRecord(value) && typeof value.modifiedAt === 'number' && typeof value.recordFile === 'string'
}

async function readIndex(folder: string): Promise<HistoryIndex> {
  const raw = await readJsonIfExists<unknown>(join(folder, INDEX_FILE_NAME)).catch(() => null)
  if (!isRecord(raw)) {
    return {}
  }
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, IndexEntry] => isIndexEntry(entry[1])))
}

async function saveIndex(folder: string, index: HistoryIndex): Promise<void> {
  await mkdir(folder, { recursive: true })
  await writeFile(join(folder, INDEX_FILE_NAME), JSON.stringify(index), 'utf8')
}

async function writeRecord(folder: string, source: HistorySource, known: IndexEntry | undefined, now: number): Promise<IndexEntry | null> {
  const [header, messages] = await Promise.all([source.readHeader(source.filePath), source.readMessages(source.filePath)])
  if (messages.length === 0) {
    return null
  }
  const recordFile = known?.recordFile ?? join(agentFolderName(source.agent), historyFileName(header.sessionId, now))
  const record: HistoryRecord = {
    formatVersion: HISTORY_FORMAT_VERSION,
    agent: source.agent,
    sessionId: header.sessionId,
    title: header.title,
    projectPath: header.projectPath,
    updatedAt: source.modifiedAt,
    source: 'transcript',
    sourceFile: source.filePath,
    messages
  }
  const fullPath = join(folder, recordFile)
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, JSON.stringify(record, null, 1), 'utf8')
  return { modifiedAt: source.modifiedAt, recordFile }
}

export async function syncHistory(folder: string, sources: HistorySource[], keepDays: number | null, now: number): Promise<number> {
  const index = await readIndex(folder)
  let savedCount = 0
  const ordered = [...sources].sort((first, second) => first.modifiedAt - second.modifiedAt)
  for (const source of ordered) {
    const known = index[source.filePath]
    if ((known !== undefined && known.modifiedAt === source.modifiedAt) || isHistoryExpired(source.modifiedAt, keepDays, now)) {
      continue
    }
    const entry = await writeRecord(folder, source, known, now).catch(() => null)
    if (entry === null) {
      continue
    }
    index[source.filePath] = entry
    savedCount += 1
    if (savedCount % INDEX_SAVE_EVERY === 0) {
      await saveIndex(folder, index)
    }
  }
  if (savedCount > 0) {
    await saveIndex(folder, index)
  }
  return savedCount
}

export async function pruneHistory(folder: string, keepDays: number | null, now: number): Promise<number> {
  const index = await readIndex(folder)
  const expired = Object.entries(index).filter(([, entry]) => isHistoryExpired(entry.modifiedAt, keepDays, now))
  for (const [sourceFile, entry] of expired) {
    await rm(join(folder, entry.recordFile), { force: true })
    delete index[sourceFile]
  }
  if (expired.length > 0) {
    await saveIndex(folder, index)
  }
  return expired.length
}

async function sizeOfAgentFolder(folder: string, folderName: string): Promise<AgentHistorySize | null> {
  const agent = agentOfFolderName(folderName)
  if (agent === null) {
    return null
  }
  const files = (await readdir(join(folder, folderName)).catch(() => [])).filter(isHistoryFile)
  const sizes = await Promise.all(files.map((file) => stat(join(folder, folderName, file)).then((info) => info.size, () => 0)))
  return { agent, folderName, conversationCount: files.length, totalBytes: sizes.reduce((total, size) => total + size, 0) }
}

export async function measureHistory(folder: string): Promise<AgentHistorySize[]> {
  const entries = await readdir(folder, { withFileTypes: true }).catch(() => [])
  const sizes = await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => sizeOfAgentFolder(folder, entry.name)))
  return sizes.filter((size): size is AgentHistorySize => size !== null).sort((first, second) => first.agent.localeCompare(second.agent))
}
