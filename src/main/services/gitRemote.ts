import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { assertInsideProjectRoots } from '../pathGuard'

const execFileAsync = promisify(execFile)
const MAX_GIT_OUTPUT_BYTES = 10 * 1024 * 1024
const REMOTE_TIMEOUT_MS = 90_000
const PREFERRED_REMOTE = 'origin'

async function runGit(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: repoPath,
    maxBuffer: MAX_GIT_OUTPUT_BYTES,
    timeout: REMOTE_TIMEOUT_MS,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  })
  return stdout
}

async function currentBranchName(repoPath: string): Promise<string> {
  const name = (await runGit(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
  if (name === '' || name === 'HEAD') {
    throw new Error('Switch to a branch first.')
  }
  return name
}

async function hasUpstream(repoPath: string): Promise<boolean> {
  try {
    await runGit(repoPath, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
    return true
  } catch {
    return false
  }
}

async function remoteToPublishTo(repoPath: string): Promise<string> {
  const remotes = (await runGit(repoPath, ['remote'])).split('\n').filter((name) => name.trim() !== '')
  if (remotes.length === 0) {
    throw new Error('No remote is set up for this repository.')
  }
  return remotes.includes(PREFERRED_REMOTE) ? PREFERRED_REMOTE : remotes[0].trim()
}

export async function pullFastForward(repoPath: string): Promise<void> {
  await assertInsideProjectRoots(repoPath)
  if (!(await hasUpstream(repoPath))) {
    throw new Error('This branch has no upstream to pull from.')
  }
  await runGit(repoPath, ['pull', '--ff-only'])
}

export async function pushCurrentBranch(repoPath: string): Promise<void> {
  await assertInsideProjectRoots(repoPath)
  if (await hasUpstream(repoPath)) {
    await runGit(repoPath, ['push'])
    return
  }
  const [branch, remote] = await Promise.all([currentBranchName(repoPath), remoteToPublishTo(repoPath)])
  await runGit(repoPath, ['push', '--set-upstream', remote, branch])
}
