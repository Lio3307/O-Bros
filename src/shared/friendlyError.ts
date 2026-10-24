interface KnownProblem {
  needle: string
  message: string
}

export const MISSING_FOLDER_MESSAGE = 'This folder is not available. It was moved or deleted, or its drive is not connected.'

const KNOWN_PROBLEMS: KnownProblem[] = [
  { needle: 'The folder is not available', message: MISSING_FOLDER_MESSAGE },
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
  { needle: 'terminal prompts disabled', message: 'Git could not sign in to the remote. Sign in once from a terminal.' },
  { needle: 'could not read Username', message: 'Git could not sign in to the remote. Sign in once from a terminal.' },
  { needle: 'Not possible to fast-forward', message: 'Your branch and the remote both have new commits. Merge or rebase from a terminal.' },
  { needle: 'divergent branches', message: 'Your branch and the remote both have new commits. Merge or rebase from a terminal.' },
  { needle: 'non-fast-forward', message: 'The remote has commits you do not have yet. Pull first, then push.' },
  { needle: 'failed to push some refs', message: 'The remote has commits you do not have yet. Pull first, then push.' },
  { needle: 'No remote is set up', message: 'This repository has no remote to push to.' },
  { needle: 'no upstream to pull from', message: 'This branch has no upstream to pull from. Push it first.' },
  { needle: 'Switch to a branch first', message: 'Switch to a branch first. A detached commit cannot be pushed.' },
  { needle: 'not a valid branch name', message: 'That is not a valid branch name. Avoid spaces and special characters.' },
  { needle: 'branch with that name already exists', message: 'A branch with that name already exists.' },
  { needle: 'branch you are on', message: 'You cannot delete the branch you are on. Switch to another branch first.' },
  { needle: 'not fully merged', message: 'That branch has commits that are not merged anywhere else.' },
  { needle: 'no earlier commit', message: 'There is no earlier commit to go back to.' },
  { needle: 'There is nothing to stash', message: 'There are no changes to stash.' },
  { needle: 'That is not a stash', message: 'That stash no longer exists.' },
  { needle: 'still has conflict markers', message: 'The file still has conflict markers (<<<<<<< and >>>>>>>). Edit them out first, or keep one version.' },
  { needle: 'still have conflicts', message: 'Some files still have conflicts. Resolve them first.' },
  { needle: 'no merge, rebase, cherry-pick or revert in progress', message: 'There is nothing to continue or cancel any more.' },
  { needle: 'conflict', message: 'There is a conflict. Resolve it in the Changes panel, then continue.' },
  { needle: 'Could not resolve host', message: 'Could not reach the remote. Check your connection.' },
  { needle: 'A commit message is required', message: 'Write a commit message first.' },
  { needle: 'Too many account folders', message: 'There are too many account folders already.' }
]

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

let reportHiddenError: ((rawMessage: string) => void) | null = null

export function setHiddenErrorReporter(reporter: (rawMessage: string) => void): void {
  reportHiddenError = reporter
}

export function friendlyErrorMessage(error: unknown, fallback: string = FALLBACK_MESSAGE): string {
  const rawMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const known = KNOWN_PROBLEMS.find((problem) => rawMessage.includes(problem.needle))
  if (known === undefined) {
    reportHiddenError?.(rawMessage)
    return fallback
  }
  return known.message
}
