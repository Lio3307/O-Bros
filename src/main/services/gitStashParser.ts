import type { GitStashEntry } from '../../shared/types'

const FIELD_SEPARATOR = '\x1f'
const STASH_FORMAT_FIELDS = 3
const SUBJECT_ON_PREFIX = 'On '
const SUBJECT_WIP_PREFIX = 'WIP on '

export const GIT_STASH_FORMAT = ['%gd', '%at', '%s'].join('%x1f')

function readableMessage(subject: string): string {
  const separatorIndex = subject.indexOf(': ')
  const isGenerated = subject.startsWith(SUBJECT_ON_PREFIX) || subject.startsWith(SUBJECT_WIP_PREFIX)
  return isGenerated && separatorIndex !== -1 ? subject.slice(separatorIndex + 2) : subject
}

export function parseStashList(output: string): GitStashEntry[] {
  const entries: GitStashEntry[] = []

  for (const line of output.split('\n')) {
    const fields = line.split(FIELD_SEPARATOR)
    if (fields.length < STASH_FORMAT_FIELDS || fields[0] === '') {
      continue
    }
    const [ref, createdAtSeconds, ...subjectParts] = fields
    entries.push({
      ref,
      createdAt: Number(createdAtSeconds) * 1000,
      message: readableMessage(subjectParts.join(FIELD_SEPARATOR))
    })
  }

  return entries
}

const STASH_PREFIX = 'stash@{'

export function isStashRef(value: string): boolean {
  if (!value.startsWith(STASH_PREFIX) || !value.endsWith('}')) {
    return false
  }
  const index = value.slice(STASH_PREFIX.length, value.length - 1)
  return index !== '' && index.split('').every((character) => '0123456789'.includes(character))
}
