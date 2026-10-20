import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { FolderMoveRefusal, isLink, linkTarget, moveFolderAndLink, moveFolderBack } from './folderMove'

const createdFolders: string[] = []

async function createFolder(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'o-bros-move-test-'))
  createdFolders.push(folder)
  return folder
}

async function createConversations(parent: string): Promise<string> {
  const source = join(parent, 'sessions')
  await mkdir(join(source, '2026', '10'), { recursive: true })
  await writeFile(join(source, '2026', '10', 'chat.jsonl'), '{"role":"user"}\n', 'utf8')
  await writeFile(join(source, 'index.json'), '[]', 'utf8')
  return source
}

afterEach(async () => {
  await Promise.all(createdFolders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })))
})

describe('moveFolderAndLink', () => {
  it('moves the files and leaves a link that reads and writes in the new place', async () => {
    const home = await createFolder()
    const other = await createFolder()
    const source = await createConversations(home)
    const target = join(other, 'chat-history', 'codex')

    await moveFolderAndLink(source, target)

    expect(await isLink(source)).toBe(true)
    expect((await linkTarget(source))?.toLowerCase()).toBe(target.toLowerCase())
    expect(await readFile(join(target, '2026', '10', 'chat.jsonl'), 'utf8')).toBe('{"role":"user"}\n')
    await writeFile(join(source, 'new.jsonl'), 'new', 'utf8')
    expect(await readFile(join(target, 'new.jsonl'), 'utf8')).toBe('new')
    expect(await readdir(home)).toEqual(['sessions'])
  })

  it('refuses a target that already has files and leaves everything as it was', async () => {
    const home = await createFolder()
    const other = await createFolder()
    const source = await createConversations(home)
    await writeFile(join(other, 'keep.txt'), 'keep', 'utf8')

    await expect(moveFolderAndLink(source, other)).rejects.toBeInstanceOf(FolderMoveRefusal)
    expect(await isLink(source)).toBe(false)
    expect(await readFile(join(source, 'index.json'), 'utf8')).toBe('[]')
    expect(await readFile(join(other, 'keep.txt'), 'utf8')).toBe('keep')
  })

  it('refuses a target inside the folder being moved', async () => {
    const home = await createFolder()
    const source = await createConversations(home)

    await expect(moveFolderAndLink(source, join(source, 'inside'))).rejects.toBeInstanceOf(FolderMoveRefusal)
    expect(await isLink(source)).toBe(false)
  })

  it('refuses a folder that was already moved', async () => {
    const home = await createFolder()
    const other = await createFolder()
    const source = await createConversations(home)
    await moveFolderAndLink(source, join(other, 'first'))

    await expect(moveFolderAndLink(source, join(other, 'second'))).rejects.toBeInstanceOf(FolderMoveRefusal)
  })
})

describe('moveFolderBack', () => {
  it('puts the files back in the original place and removes the moved copy', async () => {
    const home = await createFolder()
    const other = await createFolder()
    const source = await createConversations(home)
    const target = join(other, 'codex')
    await moveFolderAndLink(source, target)
    await writeFile(join(source, 'while-moved.jsonl'), 'later', 'utf8')

    await moveFolderBack(source)

    expect(await isLink(source)).toBe(false)
    expect(await readFile(join(source, '2026', '10', 'chat.jsonl'), 'utf8')).toBe('{"role":"user"}\n')
    expect(await readFile(join(source, 'while-moved.jsonl'), 'utf8')).toBe('later')
    expect(await readdir(other)).toEqual([])
  })

  it('refuses a folder that was never moved', async () => {
    const home = await createFolder()
    const source = await createConversations(home)

    await expect(moveFolderBack(source)).rejects.toBeInstanceOf(FolderMoveRefusal)
  })
})
