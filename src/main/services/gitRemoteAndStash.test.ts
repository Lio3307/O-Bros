import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../pathGuard', () => ({ assertInsideProjectRoots: async () => undefined }))

vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 })

const { pullFastForward, pushCurrentBranch } = await import('./gitRemote')
const { applyStash, dropStash, listStashes, stashChanges } = await import('./gitStash')
const run = promisify(execFile)

let workFolder: string

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await run('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], { cwd })
  return stdout.trim()
}

async function createClone(name: string, remotePath: string): Promise<string> {
  const clonePath = join(workFolder, name)
  await run('git', ['clone', remotePath, clonePath])
  return clonePath
}

async function readText(path: string): Promise<string> {
  return (await readFile(path, 'utf8')).split('\r\n').join('\n')
}

async function commitFile(repoPath: string, fileName: string, content: string, message: string): Promise<void> {
  await writeFile(join(repoPath, fileName), content, 'utf8')
  await git(repoPath, 'add', fileName)
  await git(repoPath, 'commit', '-m', message)
}

beforeEach(async () => {
  workFolder = await mkdtemp(join(tmpdir(), 'o-bros-remote-'))
})

afterEach(async () => {
  await rm(workFolder, { recursive: true, force: true })
})

async function createRemoteWithFirstCommit(): Promise<{ remotePath: string; first: string }> {
  const remotePath = join(workFolder, 'remote.git')
  await mkdir(remotePath)
  await git(remotePath, 'init', '--bare', '--initial-branch=main')
  const seed = join(workFolder, 'seed')
  await mkdir(seed)
  await git(seed, 'init', '--initial-branch=main')
  await commitFile(seed, 'readme.txt', 'one\n', 'First')
  await git(seed, 'remote', 'add', 'origin', remotePath)
  await git(seed, 'push', '--set-upstream', 'origin', 'main')
  return { remotePath, first: await createClone('first', remotePath) }
}

describe('push and pull', () => {
  it('pushes a new commit and another clone pulls it with a fast-forward', async () => {
    const { remotePath, first } = await createRemoteWithFirstCommit()
    const second = await createClone('second', remotePath)

    await commitFile(first, 'a.txt', 'from first\n', 'Add a')
    await pushCurrentBranch(first)
    await pullFastForward(second)

    expect(await readText(join(second, 'a.txt'))).toBe('from first\n')
  })

  it('publishes a branch that has no upstream yet', async () => {
    const { first } = await createRemoteWithFirstCommit()
    await git(first, 'switch', '-c', 'feature')
    await commitFile(first, 'f.txt', 'feature\n', 'Feature work')

    await pushCurrentBranch(first)

    expect(await git(first, 'rev-parse', '--abbrev-ref', '@{u}')).toBe('origin/feature')
  })

  it('refuses to pull when the branch has diverged from the remote', async () => {
    const { remotePath, first } = await createRemoteWithFirstCommit()
    const second = await createClone('second', remotePath)
    await commitFile(first, 'a.txt', 'a\n', 'From first')
    await pushCurrentBranch(first)
    await commitFile(second, 'b.txt', 'b\n', 'From second')

    await expect(pullFastForward(second)).rejects.toThrow()
  })

  it('says there is no remote when a repository has none', async () => {
    const lonely = join(workFolder, 'lonely')
    await mkdir(lonely)
    await git(lonely, 'init', '--initial-branch=main')
    await commitFile(lonely, 'a.txt', 'a\n', 'Only')

    await expect(pushCurrentBranch(lonely)).rejects.toThrow('No remote is set up')
  })
})

describe('stash', () => {
  it('stashes changed and new files, lists the stash, applies it and removes it', async () => {
    const { first } = await createRemoteWithFirstCommit()
    await writeFile(join(first, 'readme.txt'), 'changed\n', 'utf8')
    await writeFile(join(first, 'new.txt'), 'new\n', 'utf8')

    await stashChanges({ repoPath: first, message: 'before the refactor' })

    expect(await git(first, 'status', '--porcelain')).toBe('')
    const [entry] = await listStashes(first)
    expect(entry.message).toBe('before the refactor')

    await applyStash({ repoPath: first, ref: entry.ref })

    expect(await readText(join(first, 'readme.txt'))).toBe('changed\n')
    expect(await readText(join(first, 'new.txt'))).toBe('new\n')
    expect(await listStashes(first)).toEqual([])
  })

  it('deletes a stash without applying it', async () => {
    const { first } = await createRemoteWithFirstCommit()
    await writeFile(join(first, 'readme.txt'), 'changed\n', 'utf8')
    await stashChanges({ repoPath: first })
    const [entry] = await listStashes(first)

    await dropStash({ repoPath: first, ref: entry.ref })

    expect(await listStashes(first)).toEqual([])
    expect(await readText(join(first, 'readme.txt'))).toBe('one\n')
  })

  it('reports that there is nothing to stash on a clean tree', async () => {
    const { first } = await createRemoteWithFirstCommit()

    await expect(stashChanges({ repoPath: first })).rejects.toThrow('nothing to stash')
  })

  it('refuses a reference that is not a stash', async () => {
    const { first } = await createRemoteWithFirstCommit()

    await expect(applyStash({ repoPath: first, ref: '--all' })).rejects.toThrow('not a stash')
  })
})
