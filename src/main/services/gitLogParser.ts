import type { GitCommit } from '../../shared/types'

const FIELD_SEPARATOR = '\x1f'
const RECORD_SEPARATOR = '\x1e'
const SHORT_HASH_LENGTH = 7
const HEAD_POINTER_PREFIX = 'HEAD -> '

export const GIT_LOG_FORMAT = ['%H', '%P', '%an', '%at', '%D', '%s'].join('%x1f') + '%x1e'

function parseRefs(decorations: string): string[] {
  return decorations
    .split(', ')
    .map((reference) => (reference.startsWith(HEAD_POINTER_PREFIX) ? reference.slice(HEAD_POINTER_PREFIX.length) : reference))
    .filter((reference) => reference !== '' && reference !== 'HEAD')
}

export function parseGitLog(output: string): GitCommit[] {
  const commits: GitCommit[] = []

  for (const record of output.split(RECORD_SEPARATOR)) {
    const withoutLeadingNewline = record.startsWith('\n') ? record.slice(1) : record
    const fields = record.trim() === '' ? [] : withoutLeadingNewline.split(FIELD_SEPARATOR)
    if (fields.length < 6) {
      continue
    }
    const [hash, parents, author, authoredAtSeconds, decorations, ...subjectParts] = fields
    commits.push({
      hash,
      shortHash: hash.slice(0, SHORT_HASH_LENGTH),
      parents: parents === '' ? [] : parents.split(' '),
      author,
      authoredAt: Number(authoredAtSeconds) * 1000,
      refs: parseRefs(decorations),
      subject: subjectParts.join(FIELD_SEPARATOR)
    })
  }

  return commits
}

const HASH_CHARACTERS = '0123456789abcdef'
const MIN_HASH_LENGTH = 7
const MAX_HASH_LENGTH = 64

export function isCommitHash(value: string): boolean {
  const isRightLength = value.length >= MIN_HASH_LENGTH && value.length <= MAX_HASH_LENGTH
  return isRightLength && value.split('').every((character) => HASH_CHARACTERS.includes(character))
}
