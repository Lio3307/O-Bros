import type { ActivityEntry } from '../../../shared/activity'
import { matchesAllWords } from '../../../shared/textSearch'

export function filterActivity(entries: ActivityEntry[], query: string): ActivityEntry[] {
  const trimmed = query.trim()
  return entries
    .filter((entry) => matchesAllWords([entry.agentCommand, entry.text, entry.detail, entry.folder, entry.outcome].join(' '), trimmed))
    .sort((first, second) => second.at - first.at)
}
