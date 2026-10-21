import { isRecord } from './isRecord'
import type { SessionMessage } from './types'

export const HISTORY_FORMAT_VERSION = 1
export const HISTORY_FOLDER_NAME = 'o-bros-history'
export const HISTORY_KEEP_DAYS_OPTIONS: (number | null)[] = [null, 30, 90, 365]
const DAY_MS = 24 * 60 * 60 * 1000
const AGENT_FOLDER_SUFFIX = '-resume'
const FILE_NAME_SEPARATOR = '_'
const RECORD_EXTENSION = '.json'

export interface HistoryRecord {
  formatVersion: number
  agent: string
  sessionId: string
  title: string
  projectPath: string | null
  updatedAt: number
  source: 'transcript'
  sourceFile: string
  messages: SessionMessage[]
}

export function agentFolderName(agent: string): string {
  return agent + AGENT_FOLDER_SUFFIX
}

export function agentOfFolderName(folderName: string): string | null {
  return folderName.endsWith(AGENT_FOLDER_SUFFIX) && folderName.length > AGENT_FOLDER_SUFFIX.length
    ? folderName.slice(0, -AGENT_FOLDER_SUFFIX.length)
    : null
}

function localDay(timestamp: number): string {
  const date = new Date(timestamp)
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, '0')).join('-')
}

export function historyFileName(sessionId: string, firstSavedAt: number): string {
  return localDay(firstSavedAt) + FILE_NAME_SEPARATOR + sessionId + RECORD_EXTENSION
}

export function isHistoryFileOf(fileName: string, sessionId: string): boolean {
  return fileName.endsWith(FILE_NAME_SEPARATOR + sessionId + RECORD_EXTENSION)
}

export function isHistoryFile(fileName: string): boolean {
  return fileName.endsWith(RECORD_EXTENSION)
}

export function historyKeepDaysOf(value: unknown): number | null {
  return typeof value === 'number' && HISTORY_KEEP_DAYS_OPTIONS.includes(value) ? value : null
}

export function isHistoryExpired(updatedAt: number, keepDays: number | null, now: number): boolean {
  return keepDays !== null && now - updatedAt > keepDays * DAY_MS
}

export function readHistoryRecord(raw: unknown): HistoryRecord | null {
  if (!isRecord(raw) || raw.formatVersion !== HISTORY_FORMAT_VERSION || !Array.isArray(raw.messages)) {
    return null
  }
  const textFields = ['agent', 'sessionId', 'title', 'sourceFile']
  if (!textFields.every((field) => typeof raw[field] === 'string') || typeof raw.updatedAt !== 'number') {
    return null
  }
  return raw as unknown as HistoryRecord
}
