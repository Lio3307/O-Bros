import { assertInsideProjectRoots } from '../pathGuard'
import { runGit } from './gitRunner'

const REMOTE_TIMEOUT_MS = 90_000
const PREFERRED_REMOTE = 'origin'

function runRemoteGit(repoPath: string, args: string[]): Promise<string> {
  return runGit(repoPath, args, { timeout: REMOTE_TIMEOUT_MS, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
}

async function currentBranchName(repoPath: string): Promise<string> {
  const name = (await runRemoteGit(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
  if (name === '' || name === 'HEAD') {
    throw new Error('Switch to a branch first.')
  }
  return name
}

async function hasUpstream(repoPath: string): Promise<boolean> {
  try {
    await runRemoteGit(repoPath, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
    return true
  } catch {
    return false
  }
}

async function remoteToPublishTo(repoPath: string): Promise<string> {
  const remotes = (await runRemoteGit(repoPath, ['remote'])).split('\n').filter((name) => name.trim() !== '')
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
  await runRemoteGit(repoPath, ['pull', '--ff-only'])
}

export async function pushCurrentBranch(repoPath: string): Promise<void> {
  await assertInsideProjectRoots(repoPath)
  if (await hasUpstream(repoPath)) {
    await runRemoteGit(repoPath, ['push'])
    return
  }
  const [branch, remote] = await Promise.all([currentBranchName(repoPath), remoteToPublishTo(repoPath)])
  await runRemoteGit(repoPath, ['push', '--set-upstream', remote, branch])
}
