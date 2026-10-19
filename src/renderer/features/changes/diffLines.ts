import { diffLinePair, type TextSegment } from './inlineDiff'

export type DiffLineKind = 'added' | 'removed' | 'hunk' | 'header' | 'context'

const FILE_HEADER_PREFIXES = ['+++', '---', 'diff ', 'index ']

export function classifyDiffLine(line: string): DiffLineKind {
  if (FILE_HEADER_PREFIXES.some((prefix) => line.startsWith(prefix))) {
    return 'header'
  }
  if (line.startsWith('@@')) {
    return 'hunk'
  }
  if (line.startsWith('+')) {
    return 'added'
  }
  if (line.startsWith('-')) {
    return 'removed'
  }
  return 'context'
}

export type DiffCellKind = 'added' | 'removed' | 'context'

export interface DiffRow {
  kind: DiffCellKind | 'hunk'
  oldNumber: number | null
  newNumber: number | null
  text: string
  segments?: TextSegment[]
}

export interface DiffCell {
  kind: DiffCellKind
  number: number
  text: string
  segments?: TextSegment[]
}

export interface SplitDiffRow {
  isHunk: boolean
  hunkText: string
  left: DiffCell | null
  right: DiffCell | null
}

const NO_NEWLINE_MARKER = '\\'

function hunkStart(part: string | undefined): number {
  const start = Number((part ?? '').slice(1).split(',')[0])
  return Number.isFinite(start) ? start : 1
}

export function parseDiffRows(diffText: string): DiffRow[] {
  const rows: DiffRow[] = []
  let isInHunk = false
  let oldNumber = 0
  let newNumber = 0
  for (const line of diffText.split('\n')) {
    if (line.startsWith('@@')) {
      const parts = line.split(' ')
      oldNumber = hunkStart(parts[1])
      newNumber = hunkStart(parts[2])
      isInHunk = true
      rows.push({ kind: 'hunk', oldNumber: null, newNumber: null, text: line })
    } else if (line.startsWith('diff ')) {
      isInHunk = false
    } else if (isInHunk && line.startsWith('+')) {
      rows.push({ kind: 'added', oldNumber: null, newNumber, text: line.slice(1) })
      newNumber += 1
    } else if (isInHunk && line.startsWith('-')) {
      rows.push({ kind: 'removed', oldNumber, newNumber: null, text: line.slice(1) })
      oldNumber += 1
    } else if (isInHunk && line.startsWith(' ')) {
      rows.push({ kind: 'context', oldNumber, newNumber, text: line.slice(1) })
      oldNumber += 1
      newNumber += 1
    } else if (isInHunk && line !== '' && !line.startsWith(NO_NEWLINE_MARKER)) {
      isInHunk = false
    }
  }
  markInlineChanges(rows)
  return rows
}

function markInlineChanges(rows: DiffRow[]): void {
  let index = 0
  while (index < rows.length) {
    const removedStart = index
    while (rows[index]?.kind === 'removed') {
      index += 1
    }
    const addedStart = index
    while (rows[index]?.kind === 'added') {
      index += 1
    }
    const pairCount = Math.min(addedStart - removedStart, index - addedStart)
    for (let offset = 0; offset < pairCount; offset += 1) {
      const removed = rows[removedStart + offset]
      const added = rows[addedStart + offset]
      const pair = diffLinePair(removed.text, added.text)
      if (pair !== null) {
        removed.segments = pair.before
        added.segments = pair.after
      }
    }
    if (index === removedStart) {
      index += 1
    }
  }
}

function cellOf(row: DiffRow, side: 'old' | 'new'): DiffCell | null {
  const number = side === 'old' ? row.oldNumber : row.newNumber
  return number === null || row.kind === 'hunk'
    ? null
    : { kind: row.kind, number, text: row.text, segments: row.segments }
}

export function splitDiffRows(rows: DiffRow[]): SplitDiffRow[] {
  const result: SplitDiffRow[] = []
  let removed: DiffRow[] = []
  let added: DiffRow[] = []

  function flushChanges(): void {
    for (let index = 0; index < Math.max(removed.length, added.length); index += 1) {
      const left = removed[index]
      const right = added[index]
      result.push({
        isHunk: false,
        hunkText: '',
        left: left === undefined ? null : cellOf(left, 'old'),
        right: right === undefined ? null : cellOf(right, 'new')
      })
    }
    removed = []
    added = []
  }

  for (const row of rows) {
    if (row.kind === 'removed') {
      removed.push(row)
    } else if (row.kind === 'added') {
      added.push(row)
    } else {
      flushChanges()
      result.push(
        row.kind === 'hunk'
          ? { isHunk: true, hunkText: row.text, left: null, right: null }
          : { isHunk: false, hunkText: '', left: cellOf(row, 'old'), right: cellOf(row, 'new') }
      )
    }
  }
  flushChanges()
  return result
}
