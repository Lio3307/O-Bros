import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { commandNameOf, listPathCommands } from './agentDetector'

let folder: string

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), 'o-bros-agents-'))
})

afterEach(async () => {
  await rm(folder, { recursive: true, force: true })
})

describe('commandNameOf', () => {
  it('removes the Windows executable extension and lower-cases the name', () => {
    expect(commandNameOf('OpenCode.CMD', 'win32')).toBe('opencode')
    expect(commandNameOf('claude.exe', 'win32')).toBe('claude')
  })

  it('ignores files that are not runnable on Windows', () => {
    expect(commandNameOf('readme.txt', 'win32')).toBeNull()
    expect(commandNameOf('library.dll', 'win32')).toBeNull()
  })

  it('keeps the whole name on other systems', () => {
    expect(commandNameOf('aider', 'linux')).toBe('aider')
  })
})

describe('listPathCommands', () => {
  it('lists unique command names from every folder, sorted', async () => {
    const second = join(folder, 'second')
    await mkdir(second)
    await writeFile(join(folder, 'opencode.cmd'), '')
    await writeFile(join(folder, 'claude.exe'), '')
    await writeFile(join(folder, 'notes.txt'), '')
    await writeFile(join(second, 'claude.cmd'), '')
    await writeFile(join(second, 'aider.exe'), '')

    const commands = await listPathCommands([folder, second], 'win32')

    expect(commands).toEqual(['aider', 'claude', 'opencode'])
  })

  it('skips folders that do not exist', async () => {
    await writeFile(join(folder, 'goose.exe'), '')
    expect(await listPathCommands([join(folder, 'missing'), folder], 'win32')).toEqual(['goose'])
  })

  it('returns nothing when PATH is empty', async () => {
    expect(await listPathCommands([], 'win32')).toEqual([])
  })
})
