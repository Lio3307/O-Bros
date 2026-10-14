import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../pathGuard', () => ({ assertInsideProjectRoots: async () => undefined }))
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 })

const {
  amendLastCommitMessage,
  createBranch,
  deleteBranch,
  readLastCommitMessage,
  renameBranch,
  undoLastCommit
} = await import('./gitBranchActions')
const run = promisify(execFile)

let repoPath: string

async function git(...args: string[]): Promise<string> {
  const { stdout } = await run('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], {
    cwd: repoPath
  })
  return stdout.trim()
}

async function commitFile(fileName: string, message: string): Promise<void> {
  await writeFile(join(repoPath, fileName), `${fileName}\n`, 'utf8')
  await git('add', fileName)
  await git('commit', '-m', message)
}

beforeEach(async () => {
  repoPath = await mkdtemp(join(tmpdir(), 'o-bros-branches-'))
  await git('init', '--initial-branch=main')
  await git('config', 'user.name', 'Test')
  await git('config', 'user.email', 'test@example.com')
  await commitFile('a.txt', 'First')
})

afterEach(async () => {
  await rm(repoPath, { recursive: true, force: true })
})

describe('createBranch', () => {
  it('creates the branch and switches to it', async () => {
    await createBranch({ repoPath, name: 'feature/login' })

    expect(await git('rev-parse', '--abbrev-ref', 'HEAD')).toBe('feature/login')
  })

  it('refuses names git would not accept', async () => {
    await expect(createBranch({ repoPath, name: 'has space' })).rejects.toThrow('not a valid branch name')
    await expect(createBranch({ repoPath, name: '--force' })).rejects.toThrow('not a valid branch name')
    await expect(createBranch({ repoPath, name: '   ' })).rejects.toThrow('not a valid branch name')
  })

  it('refuses a name that already exists', async () => {
    await expect(createBranch({ repoPath, name: 'main' })).rejects.toThrow('already exists')
  })
})

describe('renameBranch', () => {
  it('renames the branch', async () => {
    await git('branch', 'old-name')

    await renameBranch({ repoPath, from: 'old-name', to: 'new-name' })

    expect(await git('branch', '--format=%(refname:short)')).toContain('new-name')
    expect(await git('branch', '--format=%(refname:short)')).not.toContain('old-name')
  })

  it('refuses an unknown branch and a name that is taken', async () => {
    await git('branch', 'other')
    await expect(renameBranch({ repoPath, from: 'missing', to: 'x' })).rejects.toThrow('Unknown branch')
    await expect(renameBranch({ repoPath, from: 'other', to: 'main' })).rejects.toThrow('already exists')
  })
})

describe('deleteBranch', () => {
  it('deletes a merged branch', async () => {
    await git('branch', 'done')

    await deleteBranch({ repoPath, name: 'done', force: false })

    expect(await git('branch', '--format=%(refname:short)')).not.toContain('done')
  })

  it('refuses the current branch', async () => {
    await expect(deleteBranch({ repoPath, name: 'main', force: false })).rejects.toThrow('branch you are on')
  })

  it('needs force for a branch that has unmerged commits', async () => {
    await git('switch', '-c', 'work')
    await commitFile('b.txt', 'Work')
    await git('switch', 'main')

    await expect(deleteBranch({ repoPath, name: 'work', force: false })).rejects.toThrow()
    await deleteBranch({ repoPath, name: 'work', force: true })

    expect(await git('branch', '--format=%(refname:short)')).not.toContain('work')
  })
})

describe('undo and amend', () => {
  it('undoes the last commit and keeps its changes staged', async () => {
    await commitFile('b.txt', 'Second')

    await undoLastCommit(repoPath)

    expect(await git('log', '-1', '--format=%s')).toBe('First')
    expect(await git('status', '--porcelain')).toBe('A  b.txt')
  })

  it('refuses to undo the very first commit', async () => {
    await expect(undoLastCommit(repoPath)).rejects.toThrow('no earlier commit')
  })

  it('reads and amends the last commit message without touching staged files', async () => {
    expect(await readLastCommitMessage(repoPath)).toBe('First')
    await writeFile(join(repoPath, 'c.txt'), 'staged\n', 'utf8')
    await git('add', 'c.txt')

    await amendLastCommitMessage({ repoPath, message: 'First, reworded' })

    expect(await git('log', '-1', '--format=%s')).toBe('First, reworded')
    expect(await git('status', '--porcelain')).toBe('A  c.txt')
  })

  it('needs a message to amend', async () => {
    await expect(amendLastCommitMessage({ repoPath, message: '  ' })).rejects.toThrow('commit message is required')
  })
})
