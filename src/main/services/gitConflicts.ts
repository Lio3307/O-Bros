import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { hasConflictMarkers } from '../../shared/conflictMarkers'
import type { GitOperation, GitOperationKind, GitResolveRequest } from '../../shared/types'
import { assertInsideProjectRoots, isInsideDirectory } from '../pathGuard'
import { pathExists } from './fileSystem'

const execFileAsync = promisify(execFile)
const MAX_GIT_OUTPUT_BYTES = 10 * 1024 * 1024
const BRANCH_PREFIX = 'refs/heads/'
const CURRENT_STAGE = '2'
const INCOMING_STAGE = '3'

const CONTINUE_ARGS: Record<GitOperationKind, string[]> = {
  merge: ['commit', '--no-edit'],
  rebase: ['rebase', '--continue'],
  cherryPick: ['cherry-pick', '--continue'],
  revert: ['revert', '--continue']
}

const ABORT_ARGS: Record<GitOperationKind, string[]> = {
  merge: ['merge', '--abort'],
  rebase: ['rebase', '--abort'],
  cherryPick: ['cherry-pick', '--abort'],
  revert: ['revert', '--abort']
}

async function runGit(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: repoPath,
    maxBuffer: MAX_GIT_OUTPUT_BYTES,
    env: { ...process.env, GIT_EDITOR: 'true' }
  })
  return stdout
}

async function readTextIfExists(path: string): Promise<string | null> {
  try {
    return (await readFile(path, 'utf8')).trim()
  } catch {
    return null
  }
}

async function commitSubject(repoPath: string, ref: string): Promise<string | null> {
  try {
    return (await runGit(repoPath, ['log', '-1', '--format=%s', ref])).trim() || null
  } catch {
    return null
  }
}

async function branchNameOf(repoPath: string, ref: string): Promise<string | null> {
  try {
    return (await runGit(repoPath, ['name-rev', '--name-only', '--no-undefined', ref])).trim() || null
  } catch {
    return null
  }
}

async function rebasedBranch(gitDir: string): Promise<string | null> {
  for (const folder of ['rebase-merge', 'rebase-apply']) {
    const headName = await readTextIfExists(join(gitDir, folder, 'head-name'))
    if (headName !== null) {
      return headName.startsWith(BRANCH_PREFIX) ? headName.slice(BRANCH_PREFIX.length) : headName
    }
  }
  return null
}

export async function readGitOperation(repoPath: string): Promise<GitOperation | null> {
  const gitDir = (await runGit(repoPath, ['rev-parse', '--absolute-git-dir'])).trim()
  if (await pathExists(join(gitDir, 'MERGE_HEAD'))) {
    return { kind: 'merge', incoming: await branchNameOf(repoPath, 'MERGE_HEAD') }
  }
  if ((await pathExists(join(gitDir, 'rebase-merge'))) || (await pathExists(join(gitDir, 'rebase-apply')))) {
    return { kind: 'rebase', incoming: await rebasedBranch(gitDir) }
  }
  if (await pathExists(join(gitDir, 'CHERRY_PICK_HEAD'))) {
    return { kind: 'cherryPick', incoming: await commitSubject(repoPath, 'CHERRY_PICK_HEAD') }
  }
  if (await pathExists(join(gitDir, 'REVERT_HEAD'))) {
    return { kind: 'revert', incoming: await commitSubject(repoPath, 'REVERT_HEAD') }
  }
  return null
}

async function conflictStages(repoPath: string, filePath: string): Promise<string[]> {
  const output = await runGit(repoPath, ['ls-files', '-u', '--', filePath])
  return output
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => line.split('\t')[0].split(' ')[2])
}

export async function resolveConflict(request: GitResolveRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  const fullPath = join(request.repoPath, request.filePath)
  if (request.filePath === '' || !isInsideDirectory(fullPath, request.repoPath)) {
    throw new Error(`Path is outside the opened project folders: ${request.filePath}`)
  }
  if (request.side === null) {
    const content = await readTextIfExists(fullPath)
    if (content !== null && hasConflictMarkers(content)) {
      throw new Error(`${request.filePath} still has conflict markers (<<<<<<< and >>>>>>>). Edit them out first.`)
    }
    await runGit(request.repoPath, ['add', '-A', '--', request.filePath])
    return
  }
  const stage = request.side === 'current' ? CURRENT_STAGE : INCOMING_STAGE
  if (!(await conflictStages(request.repoPath, request.filePath)).includes(stage)) {
    await runGit(request.repoPath, ['rm', '-q', '--', request.filePath])
    return
  }
  await runGit(request.repoPath, ['checkout', request.side === 'current' ? '--ours' : '--theirs', '--', request.filePath])
  await runGit(request.repoPath, ['add', '--', request.filePath])
}

async function requireOperation(repoPath: string): Promise<GitOperationKind> {
  await assertInsideProjectRoots(repoPath)
  const operation = await readGitOperation(repoPath)
  if (operation === null) {
    throw new Error('There is no merge, rebase, cherry-pick or revert in progress.')
  }
  return operation.kind
}

export async function continueOperation(repoPath: string): Promise<void> {
  const kind = await requireOperation(repoPath)
  if ((await runGit(repoPath, ['diff', '--name-only', '--diff-filter=U'])).trim() !== '') {
    throw new Error('Some files still have conflicts. Resolve them first.')
  }
  await runGit(repoPath, CONTINUE_ARGS[kind])
}

export async function abortOperation(repoPath: string): Promise<void> {
  await runGit(repoPath, ABORT_ARGS[await requireOperation(repoPath)])
}
