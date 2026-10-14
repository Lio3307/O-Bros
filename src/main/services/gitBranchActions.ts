import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  GitAmendRequest,
  GitCreateBranchRequest,
  GitDeleteBranchRequest,
  GitRenameBranchRequest
} from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'
import { listBranches } from './gitActions'

const execFileAsync = promisify(execFile)
const MAX_GIT_OUTPUT_BYTES = 10 * 1024 * 1024
const MAX_BRANCH_NAME_LENGTH = 200

async function runGit(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: repoPath, maxBuffer: MAX_GIT_OUTPUT_BYTES })
  return stdout
}

async function assertValidBranchName(repoPath: string, name: string): Promise<string> {
  const trimmed = name.trim()
  const isPlausible = trimmed !== '' && trimmed.length <= MAX_BRANCH_NAME_LENGTH && !trimmed.startsWith('-')
  if (!isPlausible) {
    throw new Error('That is not a valid branch name.')
  }
  try {
    await runGit(repoPath, ['check-ref-format', '--branch', trimmed])
  } catch {
    throw new Error('That is not a valid branch name.')
  }
  return trimmed
}

async function assertBranchExists(repoPath: string, name: string): Promise<void> {
  const { branches } = await listBranches(repoPath)
  if (!branches.includes(name)) {
    throw new Error(`Unknown branch ${name}`)
  }
}

export async function createBranch(request: GitCreateBranchRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  const name = await assertValidBranchName(request.repoPath, request.name)
  const { branches } = await listBranches(request.repoPath)
  if (branches.includes(name)) {
    throw new Error('A branch with that name already exists.')
  }
  await runGit(request.repoPath, ['switch', '-c', name])
}

export async function renameBranch(request: GitRenameBranchRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  await assertBranchExists(request.repoPath, request.from)
  const to = await assertValidBranchName(request.repoPath, request.to)
  const { branches } = await listBranches(request.repoPath)
  if (branches.includes(to)) {
    throw new Error('A branch with that name already exists.')
  }
  await runGit(request.repoPath, ['branch', '-m', request.from, to])
}

export async function deleteBranch(request: GitDeleteBranchRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  await assertBranchExists(request.repoPath, request.name)
  const { current } = await listBranches(request.repoPath)
  if (request.name === current) {
    throw new Error('You cannot delete the branch you are on.')
  }
  await runGit(request.repoPath, ['branch', request.force ? '-D' : '-d', request.name])
}

export async function undoLastCommit(repoPath: string): Promise<void> {
  await assertInsideProjectRoots(repoPath)
  try {
    await runGit(repoPath, ['rev-parse', '--verify', 'HEAD~1'])
  } catch {
    throw new Error('There is no earlier commit to go back to.')
  }
  await runGit(repoPath, ['reset', '--soft', 'HEAD~1'])
}

export async function readLastCommitMessage(repoPath: string): Promise<string> {
  await assertInsideProjectRoots(repoPath)
  return (await runGit(repoPath, ['log', '-1', '--format=%B'])).trim()
}

export async function amendLastCommitMessage(request: GitAmendRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  const message = request.message.trim()
  if (message === '') {
    throw new Error('A commit message is required.')
  }
  await runGit(request.repoPath, ['commit', '--amend', '--only', '-m', message])
}
