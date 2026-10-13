import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { directorySize } from './directorySize'

const createdFolders: string[] = []

async function createFolder(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'o-bros-size-test-'))
  createdFolders.push(folder)
  return folder
}

afterEach(async () => {
  await Promise.all(createdFolders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })))
})

describe('directorySize', () => {
  it('adds up files in nested folders', async () => {
    const folder = await createFolder()
    await mkdir(join(folder, 'inner'))
    await writeFile(join(folder, 'a.txt'), '12345')
    await writeFile(join(folder, 'inner', 'b.txt'), '123')

    expect(await directorySize(folder)).toBe(8)
  })

  it('returns zero for a folder that does not exist', async () => {
    const folder = await createFolder()

    expect(await directorySize(join(folder, 'missing'))).toBe(0)
  })
})
