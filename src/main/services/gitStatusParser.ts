import type { FileChangeKind } from '../../shared/types'

export interface ParsedChange {
  path: string
  kind: FileChangeKind
  isStaged: boolean
}

export interface ParsedStatus {
  branch: string
  upstream: string | null
  ahead: number
  behind: number
  changes: ParsedChange[]
}

export interface LineCounts {
  addedLines: number
  removedLines: number
}

const ORDINARY_ENTRY_FIELDS = 8
const RENAMED_ENTRY_FIELDS = 9
const NO_CHANGE_MARK = '.'

function splitLeadingFields(line: string, fieldCount: number): { fields: string[]; rest: string } {
  const fields: string[] = []
  let cursor = 0
  while (fields.length < fieldCount) {
    const spaceIndex = line.indexOf(' ', cursor)
    fields.push(line.slice(cursor, spaceIndex))
    cursor = spaceIndex + 1
  }
  return { fields, rest: line.slice(cursor) }
}

function kindFromMark(mark: string): FileChangeKind {
  if (mark === 'A') {
    return 'added'
  }
  if (mark === 'D') {
    return 'deleted'
  }
  if (mark === 'R') {
    return 'renamed'
  }
  return 'modified'
}

function changesFromMarks(path: string, marks: string): ParsedChange[] {
  const stagedMark = marks[0]
  const unstagedMark = marks[1]
  const changes: ParsedChange[] = []
  if (stagedMark !== NO_CHANGE_MARK) {
    changes.push({ path, kind: kindFromMark(stagedMark), isStaged: true })
  }
  if (unstagedMark !== NO_CHANGE_MARK) {
    changes.push({ path, kind: kindFromMark(unstagedMark), isStaged: false })
  }
  return changes
}

function parseChangeLine(line: string): ParsedChange[] {
  if (line.startsWith('? ')) {
    return [{ path: line.slice(2), kind: 'untracked', isStaged: false }]
  }
  if (line.startsWith('1 ')) {
    const { fields, rest } = splitLeadingFields(line, ORDINARY_ENTRY_FIELDS)
    return changesFromMarks(rest, fields[1])
  }
  if (line.startsWith('2 ')) {
    const { fields, rest } = splitLeadingFields(line, RENAMED_ENTRY_FIELDS)
    const newPath = rest.split('\t')[0]
    return changesFromMarks(newPath, fields[1])
  }
  return []
}

export function parseStatusOutput(output: string): ParsedStatus {
  const status: ParsedStatus = { branch: '', upstream: null, ahead: 0, behind: 0, changes: [] }

  for (const line of output.split('\n')) {
    if (line.startsWith('# branch.head ')) {
      status.branch = line.slice('# branch.head '.length)
    } else if (line.startsWith('# branch.upstream ')) {
      status.upstream = line.slice('# branch.upstream '.length)
    } else if (line.startsWith('# branch.ab ')) {
      const [aheadToken, behindToken] = line.slice('# branch.ab '.length).split(' ')
      status.ahead = Number(aheadToken.slice(1))
      status.behind = Number(behindToken.slice(1))
    } else {
      status.changes.push(...parseChangeLine(line))
    }
  }

  return status
}

export function parseNumstat(output: string): Map<string, LineCounts> {
  const countsByPath = new Map<string, LineCounts>()

  for (const line of output.split('\n')) {
    const [added, removed, path] = line.split('\t')
    if (path !== undefined) {
      countsByPath.set(path, { addedLines: Number(added) || 0, removedLines: Number(removed) || 0 })
    }
  }

  return countsByPath
}
