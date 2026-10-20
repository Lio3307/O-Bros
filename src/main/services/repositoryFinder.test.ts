import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../pathGuard', () => ({ assertInsideProjectRoots: async () => undefined }))
vi.mock('./fileSystem', async (importOriginal) => {
  const original = await importOriginal<typeof import('./fileSystem')>()
  const refuseLocked = (path: string): void => {
    if (path.includes('Config.Msi')) {
      throw Object.assign(new Error(`EPERM: operation not permitted, scandir '${path}'`), { code: 'EPERM' })
    }
  }
  return {
    ...original,
    readDirectoryIfExists: async (path: string) => {
      refuseLocked(path)
      return original.readDirectoryIfExists(path)
    },
    readTextIfExists: async (path: string) => {
      refuseLocked(path)
      return original.readTextIfExists(path)
    }
  }
})

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
  it('skips folders the system does not let it read, such as Config.Msi', async () => {
    await makeRepository('api')
    await mkdir(join(workFolder, 'Config.Msi', 'inner'), { recursive: true })

    const found = await findRepositories(workFolder)

    expect(found.map((entry) => entry.relativePath)).toEqual(['api'])
  })


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
