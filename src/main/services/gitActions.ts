import { shell } from 'electron'
import { join } from 'node:path'
import type {
  GitBranchList,
  GitCheckoutRequest,
  GitCommitRequest,
  GitDiscardRequest,
  GitPathsRequest
} from '../../shared/types'
import { isInsideDirectory, assertInsideProjectRoots } from '../pathGuard'
import { runGit } from './gitRunner'


function assertPathsInsideRepo(repoPath: string, filePaths: string[]): void {
  for (const filePath of filePaths) {
    if (filePath === '' || !isInsideDirectory(join(repoPath, filePath), repoPath)) {
      throw new Error(`Path is outside the opened project folders: ${filePath}`)
    }
  }
}

export async function stagePaths(request: GitPathsRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  assertPathsInsideRepo(request.repoPath, request.filePaths)
  await runGit(request.repoPath, ['add', '--', ...request.filePaths])
}

export async function unstagePaths(request: GitPathsRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  assertPathsInsideRepo(request.repoPath, request.filePaths)
  try {
    await runGit(request.repoPath, ['restore', '--staged', '--', ...request.filePaths])
  } catch {
    await runGit(request.repoPath, ['rm', '--cached', '-r', '-q', '--', ...request.filePaths])
  }
}

export function requireCommitMessage(message: string): string {
  const trimmed = message.trim()
  if (trimmed === '') {
    throw new Error('A commit message is required.')
  }
  return trimmed
}

export async function commitStaged(request: GitCommitRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  const message = requireCommitMessage(request.message)
  await runGit(request.repoPath, ['commit', '-m', message])
}

export async function discardChange(request: GitDiscardRequest): Promise<void> {
  await assertInsideProjectRoots(request.repoPath)
  assertPathsInsideRepo(request.repoPath, [request.filePath])
  if (request.isUntracked) {
    await shell.trashItem(join(request.repoPath, request.filePath))
    return
  }
  await runGit(request.repoPath, ['restore', '--', request.filePath])
}

export async function listBranches(repoPath: string): Promise<GitBranchList> {
  await assertInsideProjectRoots(repoPath)
  const [branchOutput, currentOutput] = await Promise.all([
    runGit(repoPath, ['branch', '--format=%(refname:short)']),
    runGit(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD'])
  ])
  const branches = branchOutput
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name !== '' && !name.startsWith('('))
  const current = currentOutput.trim()
  return { current: current === '' || current === 'HEAD' ? null : current, branches }
}

export async function assertBranchExists(repoPath: string, name: string): Promise<void> {
  const { branches } = await listBranches(repoPath)
  if (!branches.includes(name)) {
    throw new Error(`Unknown branch ${name}`)
  }
}

export async function switchBranch(request: GitCheckoutRequest): Promise<void> {
  await assertBranchExists(request.repoPath, request.branch)
  await runGit(request.repoPath, ['switch', request.branch])
}
