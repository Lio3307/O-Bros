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
