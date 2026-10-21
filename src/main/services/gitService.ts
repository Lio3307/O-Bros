import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { GitDiffRequest, GitFileChange, GitStatus } from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'
import { readGitOperation } from './gitConflicts'
import { isCommitHash } from './gitLogParser'
import { parseNumstat, parseStatusOutput } from './gitStatusParser'
import { isGitRepository, runGit } from './gitRunner'


async function readLastFetchedAt(repoPath: string): Promise<number | null> {
  try {
    return (await stat(join(repoPath, '.git', 'FETCH_HEAD'))).mtimeMs
  } catch {
    return null
  }
}

async function readLineCounts(repoPath: string) {
  const [unstagedOutput, stagedOutput] = await Promise.all([
    runGit(repoPath, ['diff', '--numstat']),
    runGit(repoPath, ['diff', '--cached', '--numstat'])
  ])
  return { unstaged: parseNumstat(unstagedOutput), staged: parseNumstat(stagedOutput) }
}

export async function readGitStatus(repoPath: string): Promise<GitStatus | null> {
  await assertInsideProjectRoots(repoPath)
  if (!(await isGitRepository(repoPath))) {
    return null
  }

  const [statusOutput, lineCounts, lastFetchedAt, operation] = await Promise.all([
    runGit(repoPath, ['status', '--porcelain=v2', '--branch', '--untracked-files=all']),
    readLineCounts(repoPath),
    readLastFetchedAt(repoPath),
    readGitOperation(repoPath)
  ])
  const parsed = parseStatusOutput(statusOutput)

  const changes: GitFileChange[] = parsed.changes.map((change) => {
    const counts = (change.isStaged ? lineCounts.staged : lineCounts.unstaged).get(change.path)
    return { ...change, addedLines: counts?.addedLines ?? 0, removedLines: counts?.removedLines ?? 0 }
  })

  return {
    branch: parsed.branch,
    headHash: parsed.headHash,
    upstream: parsed.upstream,
    ahead: parsed.ahead,
    behind: parsed.behind,
    lastFetchedAt,
    operation,
    changes
  }
}

export async function fetchAndReadStatus(repoPath: string): Promise<GitStatus | null> {
  await assertInsideProjectRoots(repoPath)
  await runGit(repoPath, ['fetch', '--quiet'])
  return readGitStatus(repoPath)
}

export async function readGitDiff(request: GitDiffRequest): Promise<string> {
  await assertInsideProjectRoots(request.repoPath)

  if (request.commitHash !== undefined) {
    if (!isCommitHash(request.commitHash)) {
      throw new Error('That is not a commit.')
    }
    return runGit(request.repoPath, ['show', '--format=', request.commitHash, '--', request.filePath])
  }

  if (request.isUntracked) {
    const untrackedPath = join(request.repoPath, request.filePath)
    if ((await stat(untrackedPath)).isDirectory()) {
      return ''
    }
    const content = await readFile(untrackedPath, 'utf8')
    return content
      .split('\n')
      .map((line) => `+${line}`)
      .join('\n')
  }

  const stagedFlag = request.isStaged ? ['--cached'] : []
  return runGit(request.repoPath, ['diff', ...stagedFlag, '--', request.filePath])
}
