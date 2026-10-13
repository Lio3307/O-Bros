export type EntryNameProblem = 'empty' | 'has-separator' | 'reserved' | 'invalid-character' | 'ends-with-dot-or-space'

const FORBIDDEN_CHARACTERS = '<>:"|?*'
const RESERVED_NAMES = ['.', '..']

function hasControlCharacter(name: string): boolean {
  return Array.from(name).some((character) => character.charCodeAt(0) < 32)
}

export function findEntryNameProblem(name: string): EntryNameProblem | null {
  if (name.trim() === '') {
    return 'empty'
  }
  if (name.includes('/') || name.includes('\\')) {
    return 'has-separator'
  }
  if (RESERVED_NAMES.includes(name)) {
    return 'reserved'
  }
  if (Array.from(name).some((character) => FORBIDDEN_CHARACTERS.includes(character)) || hasControlCharacter(name)) {
    return 'invalid-character'
  }
  if (name.endsWith('.') || name.endsWith(' ')) {
    return 'ends-with-dot-or-space'
  }
  return null
}

export const ENTRY_NAME_PROBLEM_TEXT: Record<EntryNameProblem, string> = {
  empty: 'Type a name first.',
  'has-separator': 'A name cannot contain / or \\.',
  reserved: 'That name is not allowed.',
  'invalid-character': 'A name cannot contain < > : " | ? or *.',
  'ends-with-dot-or-space': 'A name cannot end with a dot or a space.'
}
