import type { GitCommit, GitCommitFile, GitCommitFilesRequest, GitLogRequest } from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'
import { GIT_LOG_FORMAT, isCommitHash, parseGitLog } from './gitLogParser'
import { assertBranchExists } from './gitActions'
import { parseNumstat } from './gitStatusParser'
import { runGit } from './gitRunner'

const MAX_COMMITS = 500
const NOT_A_REPOSITORY_MESSAGE = 'fatal: not a git repository'

async function branchArgumentsFor(request: GitLogRequest): Promise<string[]> {
  if (request.branch !== undefined) {
    await assertBranchExists(request.repoPath, request.branch)
    return ['--date-order', request.branch]
  }
  return request.allBranches === true ? ['--all', '--date-order'] : []
}

export async function readCommitLog(request: GitLogRequest): Promise<GitCommit[]> {
  await assertInsideProjectRoots(request.repoPath)
  const limit = Math.min(Math.max(1, Math.floor(request.limit)), MAX_COMMITS)

  try {
    const branchArguments = await branchArgumentsFor(request)
    const pathSeparator = request.branch === undefined ? [] : ['--']
    const output = await runGit(request.repoPath, [
      'log',
      ...branchArguments,
      `--max-count=${limit}`,
      `--format=${GIT_LOG_FORMAT}`,
      ...pathSeparator
    ])
    return parseGitLog(output)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const isEmptyOrNotARepository = message.includes('does not have any commits') || message.includes(NOT_A_REPOSITORY_MESSAGE)
    if (isEmptyOrNotARepository) {
      return []
    }
    throw error
  }
}

export async function readCommitFiles(request: GitCommitFilesRequest): Promise<GitCommitFile[]> {
  await assertInsideProjectRoots(request.repoPath)
  if (!isCommitHash(request.hash)) {
    throw new Error('That is not a commit.')
  }

  const output = await runGit(request.repoPath, ['show', '--format=', '--numstat', request.hash])
  return Array.from(parseNumstat(output), ([path, counts]) => ({ path, ...counts }))
}
