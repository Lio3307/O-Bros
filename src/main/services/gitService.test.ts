import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../pathGuard', () => ({ assertInsideProjectRoots: async () => undefined }))

const { readGitDiff, readGitStatus } = await import('./gitService')
const execFileAsync = promisify(execFile)

let repoPath: string

beforeEach(async () => {
  repoPath = await mkdtemp(join(tmpdir(), 'o-bros-git-'))
  await execFileAsync('git', ['init'], { cwd: repoPath })
})

afterEach(async () => {
  await rm(repoPath, { recursive: true, force: true })
})

describe('untracked folders', () => {
  it('lists the files inside a new folder instead of the folder itself', async () => {
    await mkdir(join(repoPath, 'docs'))
    await writeFile(join(repoPath, 'docs', 'guide.md'), '# Guide\n', 'utf8')

    const status = await readGitStatus(repoPath)

    expect(status?.changes.map((change) => change.path)).toEqual(['docs/guide.md'])
  })

  it('returns an empty diff, not an error, when the path is a folder', async () => {
    await mkdir(join(repoPath, 'docs'))

    const diff = await readGitDiff({ repoPath, filePath: 'docs', isStaged: false, isUntracked: true })

    expect(diff).toBe('')
  })
})
