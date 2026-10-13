interface KnownProblem {
  needle: string
  message: string
}

const KNOWN_PROBLEMS: KnownProblem[] = [
  { needle: 'ENOENT', message: 'That file or folder no longer exists.' },
  { needle: 'EEXIST', message: 'A file or folder with that name already exists.' },
  { needle: 'EACCES', message: 'o-bros does not have permission to do that.' },
  { needle: 'EPERM', message: 'The system did not allow that. The item may be in use or protected.' },
  { needle: 'EBUSY', message: 'That item is being used by another program. Close it and try again.' },
  { needle: 'ENOTEMPTY', message: 'That folder is not empty.' },
  { needle: 'ENOSPC', message: 'There is no space left on the disk.' },
  { needle: 'EISDIR', message: 'That is a folder, not a file.' },
  { needle: 'ENOTDIR', message: 'That is a file, not a folder.' },
  { needle: 'outside the opened project folders', message: 'That location is outside your project folders.' },
  { needle: 'Not a known session file', message: 'That session file is not recognized.' },
  { needle: 'larger than 2 MB', message: 'This file is larger than 2 MB, so it was not opened.' },
  { needle: 'took longer than', message: 'The tool took too long and was stopped.' },
  { needle: 'would be overwritten', message: 'Your changes would be overwritten. Commit or discard them first.' },
  { needle: 'nothing to commit', message: 'There is nothing staged to commit.' },
  { needle: 'no changes added', message: 'There is nothing staged to commit.' },
  { needle: 'Author identity unknown', message: 'Git does not know your name and email yet. Set them with git config.' },
  { needle: 'Please tell me who you are', message: 'Git does not know your name and email yet. Set them with git config.' },
  { needle: 'not a git repository', message: 'This folder is not a git repository.' },
  { needle: 'Authentication failed', message: 'Git could not sign in to the remote.' },
  { needle: 'Could not resolve host', message: 'Could not reach the remote. Check your connection.' },
  { needle: 'A commit message is required', message: 'Write a commit message first.' },
  { needle: 'Too many account folders', message: 'There are too many account folders already.' }
]

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

export function friendlyErrorMessage(error: unknown, fallback: string = FALLBACK_MESSAGE): string {
  const rawMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const known = KNOWN_PROBLEMS.find((problem) => rawMessage.includes(problem.needle))
  return known === undefined ? fallback : known.message
}
