import { execFile } from 'node:child_process'
import { shell } from 'electron'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { ReviewBaseline, ReviewChange, ReviewFileRequest } from '../../shared/types'
import { assertInsideProjectRoots, isInsideDirectory } from '../pathGuard'
import { isCommitHash } from './gitLogParser'
import { newUntrackedPaths, parseNameStatus, splitLines } from './gitReviewParser'
import { readGitDiff } from './gitService'
import { parseNumstat } from './gitStatusParser'

const execFileAsync = promisify(execFile)
const MAX_GIT_OUTPUT_BYTES = 10 * 1024 * 1024
const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbd7f3d'
const MAX_COUNTED_FILE_BYTES = 512 * 1024

async function runGit(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: repoPath, maxBuffer: MAX_GIT_OUTPUT_BYTES })
  return stdout
}

async function isRepository(repoPath: string): Promise<boolean> {
  try {
    await stat(join(repoPath, '.git'))
    return true
  } catch {
    return false
  }
}

async function readSnapshotCommit(repoPath: string): Promise<string> {
  try {
    const snapshot = (await runGit(repoPath, ['stash', 'create'])).trim()
    if (snapshot !== '') {
      return snapshot
    }
    return (await runGit(repoPath, ['rev-parse', 'HEAD'])).trim()
  } catch {
    return EMPTY_TREE_HASH
  }
}

async function listUntrackedPaths(repoPath: string): Promise<string[]> {
  return splitLines(await runGit(repoPath, ['ls-files', '--others', '--exclude-standard']))
}

async function countLines(repoPath: string, filePath: string): Promise<number> {
  const info = await stat(join(repoPath, filePath))
  if (!info.isFile() || info.size > MAX_COUNTED_FILE_BYTES) {
    return 0
  }
  const content = await readGitDiff({ repoPath, filePath, isStaged: false, isUntracked: true })
  return splitLines(content).length
}

function assertValidBaseline(baseline: ReviewBaseline): void {
  if (!isCommitHash(baseline.commit)) {
    throw new Error('That is not a saved starting point.')
  }
}

function assertPathInsideRepo(repoPath: string, filePath: string): void {
  if (filePath === '' || !isInsideDirectory(join(repoPath, filePath), repoPath)) {
    throw new Error(`Path is outside the opened project folders: ${filePath}`)
  }
}

export async function captureReviewBaseline(repoPath: string): Promise<ReviewBaseline | null> {
  await assertInsideProjectRoots(repoPath)
  if (!(await isRepository(repoPath))) {
    return null
  }
  const [commit, untrackedPaths] = await Promise.all([readSnapshotCommit(repoPath), listUntrackedPaths(repoPath)])
  return { repoPath, commit, untrackedPaths }
}

export async function readReviewChanges(baseline: ReviewBaseline): Promise<ReviewChange[]> {
  await assertInsideProjectRoots(baseline.repoPath)
  assertValidBaseline(baseline)
  const { repoPath, commit } = baseline

  const [nameStatus, numstat, currentUntracked] = await Promise.all([
    runGit(repoPath, ['diff', '--no-renames', '--name-status', commit]),
    runGit(repoPath, ['diff', '--no-renames', '--numstat', commit]),
    listUntrackedPaths(repoPath)
  ])
  const counts = parseNumstat(numstat)

  const trackedChanges: ReviewChange[] = parseNameStatus(nameStatus).map((entry) => ({
    path: entry.path,
    kind: entry.kind,
    addedLines: counts.get(entry.path)?.addedLines ?? 0,
    removedLines: counts.get(entry.path)?.removedLines ?? 0
  }))
  const newFiles = await Promise.all(
    newUntrackedPaths(currentUntracked, baseline.untrackedPaths).map(
      async (path): Promise<ReviewChange> => ({
        path,
        kind: 'untracked',
        addedLines: await countLines(repoPath, path),
        removedLines: 0
      })
    )
  )
  return [...trackedChanges, ...newFiles]
}

export async function readReviewDiff(request: ReviewFileRequest): Promise<string> {
  const { baseline, change } = request
  await assertInsideProjectRoots(baseline.repoPath)
  assertValidBaseline(baseline)
  assertPathInsideRepo(baseline.repoPath, change.path)
  if (change.kind === 'untracked') {
    return readGitDiff({ repoPath: baseline.repoPath, filePath: change.path, isStaged: false, isUntracked: true })
  }
  return runGit(baseline.repoPath, ['diff', baseline.commit, '--', change.path])
}

export async function revertReviewFile(request: ReviewFileRequest): Promise<void> {
  const { baseline, change } = request
  await assertInsideProjectRoots(baseline.repoPath)
  assertValidBaseline(baseline)
  assertPathInsideRepo(baseline.repoPath, change.path)
  const absolutePath = join(baseline.repoPath, change.path)

  if (change.kind === 'untracked') {
    await shell.trashItem(absolutePath)
    return
  }
  if (change.kind === 'added') {
    await runGit(baseline.repoPath, ['rm', '-f', '--cached', '--ignore-unmatch', '--', change.path])
    await shell.trashItem(absolutePath)
    return
  }
  await runGit(baseline.repoPath, ['restore', `--source=${baseline.commit}`, '--staged', '--worktree', '--', change.path])
}
