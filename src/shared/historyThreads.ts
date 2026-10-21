import { isRecord } from './isRecord'

export const MAX_THREADS = 500
const MARKER_PREFIX = '[O-BROS handoff '
const THREAD_ID_PREFIX_LENGTH = 8

export interface ThreadPart {
  agent: string
  sessionId: string | null
  cwd: string
  startedAt: number
  marker: string
}

export interface HistoryThread {
  id: string
  title: string
  createdAt: number
  parts: ThreadPart[]
}

export interface ThreadSource {
  agent: string
  sessionId: string
  cwd: string
  title: string
  startedAt: number
}

export interface ThreadTarget {
  agent: string
  sessionId: string | null
  cwd: string
  startedAt: number
}

function isThreadPart(value: unknown): value is ThreadPart {
  return (
    isRecord(value) &&
    typeof value.agent === 'string' &&
    (value.sessionId === null || typeof value.sessionId === 'string') &&
    typeof value.cwd === 'string' &&
    typeof value.startedAt === 'number' &&
    typeof value.marker === 'string'
  )
}

function isHistoryThread(value: unknown): value is HistoryThread {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.createdAt === 'number' &&
    Array.isArray(value.parts) &&
    value.parts.every(isThreadPart)
  )
}

export function readThreads(raw: unknown): HistoryThread[] {
  return Array.isArray(raw) ? raw.filter(isHistoryThread).slice(-MAX_THREADS) : []
}

export function handoffMarker(threadId: string, partNumber: number): string {
  return `${MARKER_PREFIX}${threadId.slice(0, THREAD_ID_PREFIX_LENGTH)}-${partNumber}]`
}

export function threadOfSession(threads: HistoryThread[], sessionId: string): HistoryThread | null {
  return threads.find((thread) => thread.parts.some((part) => part.sessionId === sessionId)) ?? null
}

export function addContinuation(
  threads: HistoryThread[],
  newThreadId: string,
  source: ThreadSource,
  target: ThreadTarget
): { threads: HistoryThread[]; thread: HistoryThread; marker: string } {
  const existing = threadOfSession(threads, source.sessionId)
  const base: HistoryThread = existing ?? {
    id: newThreadId,
    title: source.title,
    createdAt: source.startedAt,
    parts: [{ agent: source.agent, sessionId: source.sessionId, cwd: source.cwd, startedAt: source.startedAt, marker: '' }]
  }
  const marker = handoffMarker(base.id, base.parts.length + 1)
  const thread: HistoryThread = { ...base, parts: [...base.parts, { ...target, marker }] }
  const others = threads.filter((candidate) => candidate.id !== thread.id)
  return { threads: [...others, thread].slice(-MAX_THREADS), thread, marker }
}
