import { isRecord } from './isRecord'
export interface AgentHistoryFolder {
  command: string
  title: string
  path: string
  note: string
  holdsLogin: boolean
}

const HOME_TOKEN = '{home}'
const REQUIRED_TEXT_FIELDS = ['command', 'title', 'path', 'note']

function isFolderEntry(entry: unknown): entry is AgentHistoryFolder {
  return (
    isRecord(entry) &&
    REQUIRED_TEXT_FIELDS.every((field) => typeof entry[field] === 'string' && entry[field] !== '') &&
    (entry.path as string).startsWith(HOME_TOKEN)
  )
}

export function parseHistoryFolders(raw: unknown, home: string): AgentHistoryFolder[] {
  if (!isRecord(raw) || !Array.isArray(raw.folders)) {
    return []
  }
  return raw.folders.filter(isFolderEntry).map((entry) => ({
    command: entry.command,
    title: entry.title,
    note: entry.note,
    holdsLogin: entry.holdsLogin === true,
    path: home + entry.path.slice(HOME_TOKEN.length)
  }))
}
