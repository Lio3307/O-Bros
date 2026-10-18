import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { GitStashEntry, GitStashRefRequest, GitStashRequest } from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'
import { GIT_STASH_FORMAT, isStashRef, parseStashList } from './gitStashParser'

const execFileAsync = promisify(execFile)
const MAX_GIT_OUTPUT_BYTES = 10 * 1024 * 1024
const MAX_STASH_MESSAGE_LENGTH = 200
const NOT_A_REPOSITORY = 'not a git repository'
const NOTHING_TO_STASH = 'No local changes to save'

async function runGit(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: repoPath, maxBuffer: MAX_GIT_OUTPUT_BYTES })
  return stdout
}

export async function listStashes(repoPath: string): Promise<GitStashEntry[]> {
  await assertInsideProjectRoots(repoPath)
  try {
    return parseStashList(await runGit(repoPath, ['stash', 'list', `--format=${GIT_STASH_FORMAT}`]))
  } catch (error) {
    if (error instanceof Error && error.message.includes(NOT_A_REPOSITORY)) {
      return []
    }
    throw error
  }
}

export async function stashChanges(request: GitStashRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  const message = (request.message ?? '').trim().slice(0, MAX_STASH_MESSAGE_LENGTH)
  const messageArguments = message === '' ? [] : ['-m', message]
  const output = await runGit(request.repoPath, ['stash', 'push', '--include-untracked', ...messageArguments])
  if (output.includes(NOTHING_TO_STASH)) {
    throw new Error('There is nothing to stash.')
  }
}

export async function applyStash(request: GitStashRefRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  if (!isStashRef(request.ref)) {
    throw new Error('That is not a stash.')
  }
  await runGit(request.repoPath, ['stash', 'pop', request.ref])
}

export async function dropStash(request: GitStashRefRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  if (!isStashRef(request.ref)) {
    throw new Error('That is not a stash.')
  }
  await runGit(request.repoPath, ['stash', 'drop', request.ref])
}
