import type { ActivityEntry, ActivityKind } from '../../../shared/activity'
import { matchesAllWords } from '../../../shared/textSearch'

export type ActivityKindFilter = ActivityKind | 'all'

export function filterActivity(entries: ActivityEntry[], query: string, kind: ActivityKindFilter): ActivityEntry[] {
  const trimmed = query.trim()
  return entries
    .filter((entry) => kind === 'all' || entry.kind === kind)
    .filter((entry) => matchesAllWords([entry.agentCommand, entry.text, entry.detail, entry.folder, entry.outcome].join(' '), trimmed))
    .sort((first, second) => second.at - first.at)
}
