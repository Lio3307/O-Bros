import { comparablePath } from './paths'
import type { ProviderId } from './types'
import { isRecord } from './isRecord'

export interface TeamSessionRecord {
  memberId: string
  memberName: string
  agentName: string
  provider: ProviderId
  sessionId: string | null
  cwd: string
  startedAt: number
  taskStart: string
}

export interface SessionCandidate {
  sessionId: string
  provider: ProviderId
  projectPath: string | null
  title: string
  modifiedAt: number
}

export const MAX_TEAM_SESSION_RECORDS = 1000
const TASK_MATCH_LENGTH = 30
const PROVIDERS: ProviderId[] = ['claude', 'codex']

function collapseSpaces(text: string): string {
  return text.split('\n').join(' ').split('\t').join(' ').split(' ').filter((word) => word !== '').join(' ')
}

export function taskStartOf(task: string): string {
  return collapseSpaces(task).slice(0, TASK_MATCH_LENGTH)
}

function isTeamSessionRecord(value: unknown): value is TeamSessionRecord {
  return (
    isRecord(value) &&
    typeof value.memberId === 'string' &&
    typeof value.memberName === 'string' &&
    typeof value.agentName === 'string' &&
    PROVIDERS.includes(value.provider as ProviderId) &&
    (value.sessionId === null || typeof value.sessionId === 'string') &&
    typeof value.cwd === 'string' &&
    typeof value.startedAt === 'number' &&
    typeof value.taskStart === 'string'
  )
}

export function readTeamSessionRecords(raw: unknown): TeamSessionRecord[] {
  return Array.isArray(raw) ? raw.filter(isTeamSessionRecord).slice(-MAX_TEAM_SESSION_RECORDS) : []
}

export function isSessionFileOf(fileBaseName: string, sessionId: string): boolean {
  return fileBaseName === sessionId || fileBaseName.endsWith(`-${sessionId}`)
}

export function findTeamSessionId(
  record: TeamSessionRecord,
  candidates: SessionCandidate[],
  claimedIds: Set<string>,
  ignoreCase: boolean
): string | null {
  if (record.taskStart === '') {
    return null
  }
  const folder = comparablePath(record.cwd, ignoreCase)
  const match = candidates.find(
    (candidate) =>
      candidate.provider === record.provider &&
      candidate.modifiedAt >= record.startedAt &&
      !claimedIds.has(candidate.sessionId) &&
      candidate.projectPath !== null &&
      comparablePath(candidate.projectPath, ignoreCase) === folder &&
      collapseSpaces(candidate.title).startsWith(record.taskStart)
  )
  return match?.sessionId ?? null
}
