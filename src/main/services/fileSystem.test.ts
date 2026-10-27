import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hasEntries } from './fileSystem'

let folder: string

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), 'o-bros-entries-'))
})

afterEach(async () => {
  await rm(folder, { recursive: true, force: true })
})

describe('hasEntries', () => {
  it('tells an empty folder from one with something inside', async () => {
    await mkdir(join(folder, 'empty'))
    await mkdir(join(folder, 'full'))
    await writeFile(join(folder, 'full', 'a.txt'), 'a', 'utf8')
    expect(await hasEntries(join(folder, 'empty'))).toBe(false)
    expect(await hasEntries(join(folder, 'full'))).toBe(true)
  })

  it('assumes something is inside when the folder cannot be read', async () => {
    expect(await hasEntries(join(folder, 'missing'))).toBe(true)
  })
})
