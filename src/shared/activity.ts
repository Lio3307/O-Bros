import type { TeamMemberState } from './types'

export type ActivityKind = 'session' | 'git' | 'team'
export type ActivityOutcome = 'allowed' | 'denied'

export interface NewActivity {
  kind: ActivityKind
  agentCommand: string | null
  folder: string | null
  text: string
  detail: string | null
  outcome: ActivityOutcome | null
  durationMs: number | null
}

export interface LiveAgent {
  paneId: string
  agentCommand: string
  cwd: string | null
  startedAt: number
  state: TeamMemberState
  isTeamMember: boolean
}

export interface ActivityEntry extends NewActivity {
  id: string
  at: number
}

export const MAX_ACTIVITY_ENTRIES = 500
const MAX_DETAIL_LENGTH = 160
const ACTIVITY_KINDS: ActivityKind[] = ['session', 'git', 'team']

export function keepNewestActivity(entries: ActivityEntry[]): ActivityEntry[] {
  return entries.slice(-MAX_ACTIVITY_ENTRIES)
}

export function shortDetail(text: string): string {
  const singleLine = text.split('\n').join(' ').trim()
  return singleLine.length <= MAX_DETAIL_LENGTH ? singleLine : `${singleLine.slice(0, MAX_DETAIL_LENGTH - 1)}…`
}

function isActivityEntry(value: unknown): value is ActivityEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === 'string' &&
    typeof entry.at === 'number' &&
    typeof entry.text === 'string' &&
    ACTIVITY_KINDS.includes(entry.kind as ActivityKind)
  )
}

export function readActivityList(value: unknown): ActivityEntry[] {
  if (!Array.isArray(value)) {
    return []
  }
  return keepNewestActivity(
    value.filter(isActivityEntry).map((entry) => ({ ...entry, durationMs: typeof entry.durationMs === 'number' ? entry.durationMs : null }))
  )
}
