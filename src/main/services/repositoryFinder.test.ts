import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../pathGuard', () => ({ assertInsideProjectRoots: async () => undefined }))

const { findRepositories } = await import('./repositoryFinder')

let workFolder: string

async function makeRepository(...parts: string[]): Promise<void> {
  const folder = join(workFolder, ...parts)
  await mkdir(join(folder, '.git'), { recursive: true })
  await writeFile(join(folder, '.git', 'HEAD'), 'ref: refs/heads/main\n', 'utf8')
}

beforeEach(async () => {
  workFolder = await mkdtemp(join(tmpdir(), 'o-bros-repos-'))
})

afterEach(async () => {
  await rm(workFolder, { recursive: true, force: true })
})

describe('findRepositories', () => {
  it('finds repositories directly inside the folder and nested inside group folders', async () => {
    await makeRepository('api')
    await makeRepository('clients', 'web')
    await mkdir(join(workFolder, 'notes'))

    const found = await findRepositories(workFolder)

    expect(found.map((entry) => entry.relativePath)).toEqual(['api', 'clients/web'])
    expect(found[0].branch).toBe('main')
  })

  it('does not look inside a repository or inside node_modules and hidden folders', async () => {
    await makeRepository('app')
    await makeRepository('app', 'packages', 'inner')
    await makeRepository('node_modules', 'dependency')
    await makeRepository('.hidden', 'secret')

    const found = await findRepositories(workFolder)

    expect(found.map((entry) => entry.relativePath)).toEqual(['app'])
  })

  it('stops after three levels of folders', async () => {
    await makeRepository('one', 'two', 'three', 'four')

    expect(await findRepositories(workFolder)).toEqual([])
  })
})
