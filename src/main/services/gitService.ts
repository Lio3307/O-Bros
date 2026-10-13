import { execFile } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { GitDiffRequest, GitFileChange, GitStatus } from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'
import { parseNumstat, parseStatusOutput } from './gitStatusParser'

const execFileAsync = promisify(execFile)
const MAX_GIT_OUTPUT_BYTES = 10 * 1024 * 1024

async function runGit(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: repoPath, maxBuffer: MAX_GIT_OUTPUT_BYTES })
  return stdout
}

async function isGitRepository(repoPath: string): Promise<boolean> {
  try {
    await stat(join(repoPath, '.git'))
    return true
  } catch {
    return false
  }
}

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

  const [statusOutput, lineCounts, lastFetchedAt] = await Promise.all([
    runGit(repoPath, ['status', '--porcelain=v2', '--branch']),
    readLineCounts(repoPath),
    readLastFetchedAt(repoPath)
  ])
  const parsed = parseStatusOutput(statusOutput)

  const changes: GitFileChange[] = parsed.changes.map((change) => {
    const counts = (change.isStaged ? lineCounts.staged : lineCounts.unstaged).get(change.path)
    return { ...change, addedLines: counts?.addedLines ?? 0, removedLines: counts?.removedLines ?? 0 }
  })

  return {
    branch: parsed.branch,
    upstream: parsed.upstream,
    ahead: parsed.ahead,
    behind: parsed.behind,
    lastFetchedAt,
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

  if (request.isUntracked) {
    const content = await readFile(join(request.repoPath, request.filePath), 'utf8')
    return content
      .split('\n')
      .map((line) => `+${line}`)
      .join('\n')
  }

  const stagedFlag = request.isStaged ? ['--cached'] : []
  return runGit(request.repoPath, ['diff', ...stagedFlag, '--', request.filePath])
}
