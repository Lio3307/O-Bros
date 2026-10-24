import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { SessionMessage } from '../../../shared/types'
import { measureHistory, pruneHistory, syncHistory, type HistorySource } from './historySync'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 9, 21, 12, 0).getTime()
const createdFolders: string[] = []

async function createFolder(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'o-bros-history-test-'))
  createdFolders.push(folder)
  return folder
}

afterEach(async () => {
  await Promise.all(createdFolders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })))
})

function source(agent: string, sessionId: string, modifiedAt: number, messages: SessionMessage[]): HistorySource & { reads: number[] } {
  const result = {
    agent,
    filePath: `C:/transcripts/${sessionId}.jsonl`,
    modifiedAt,
    sizeBytes: messages.length,
    reads: [] as number[],
    readHeader: async () => ({ sessionId, title: `Chat ${sessionId}`, projectPath: 'E:/work' }),
    readMessagesFrom: async (_filePath: string, startByte: number) => {
      result.reads.push(startByte)
      return { messages: messages.slice(startByte), endByte: messages.length }
    }
  }
  return result
}

async function savedMessages(folder: string, fileName: string): Promise<SessionMessage[]> {
  return JSON.parse(await readFile(join(folder, 'claude-resume', fileName), 'utf8')).messages
}

describe('syncHistory', () => {
  it('saves each conversation once into its agent folder and only again when it changed', async () => {
    const folder = await createFolder()
    const claude = source('claude', 'a1', NOW - 1000, [{ role: 'user', text: 'fix login' }])
    const codex = source('codex', 'b2', NOW - 500, [{ role: 'assistant', text: 'done' }])

    expect(await syncHistory(folder, [claude, codex], null, NOW)).toBe(2)
    expect(await readdir(join(folder, 'claude-resume'))).toEqual(['2026-10-21_a1.json'])
    const saved = JSON.parse(await readFile(join(folder, 'codex-resume', '2026-10-21_b2.json'), 'utf8'))
    expect(saved).toMatchObject({ agent: 'codex', sessionId: 'b2', title: 'Chat b2', messages: [{ role: 'assistant', text: 'done' }] })

    expect(await syncHistory(folder, [claude, codex], null, NOW)).toBe(0)
    expect(claude.reads).toEqual([0])

    const later = source('claude', 'a1', NOW, [{ role: 'user', text: 'fix login' }, { role: 'assistant', text: 'fixed' }])
    expect(await syncHistory(folder, [later], null, NOW + DAY_MS)).toBe(1)
    expect(await readdir(join(folder, 'claude-resume'))).toEqual(['2026-10-21_a1.json'])
    expect(later.reads).toEqual([1])
    expect(await savedMessages(folder, '2026-10-21_a1.json')).toEqual([
      { role: 'user', text: 'fix login' },
      { role: 'assistant', text: 'fixed' }
    ])
  })

  it('reads a conversation from the start again when its file got shorter', async () => {
    const folder = await createFolder()
    await syncHistory(folder, [source('claude', 'a1', NOW - 1000, [{ role: 'user', text: 'one' }, { role: 'assistant', text: 'two' }])], null, NOW)

    const rewritten = source('claude', 'a1', NOW, [{ role: 'user', text: 'summary' }])
    expect(await syncHistory(folder, [rewritten], null, NOW)).toBe(1)
    expect(rewritten.reads).toEqual([0])
    expect(await savedMessages(folder, '2026-10-21_a1.json')).toEqual([{ role: 'user', text: 'summary' }])
  })

  it('waits until a saved conversation stops changing before reading it again', async () => {
    const folder = await createFolder()
    const quietMs = 120_000
    expect(await syncHistory(folder, [source('claude', 'a1', NOW - 1000, [{ role: 'user', text: 'start' }])], null, NOW, quietMs)).toBe(1)

    const growing = source('claude', 'a1', NOW + 10_000, [{ role: 'user', text: 'start' }, { role: 'assistant', text: 'still going' }])
    expect(await syncHistory(folder, [growing], null, NOW + 20_000, quietMs)).toBe(0)
    expect(growing.reads).toEqual([])

    expect(await syncHistory(folder, [growing], null, NOW + 10_000 + quietMs, quietMs)).toBe(1)
    const changedJustNow = source('claude', 'a1', NOW + quietMs * 2, [{ role: 'user', text: 'one more' }])
    expect(await syncHistory(folder, [changedJustNow], null, NOW + quietMs * 2)).toBe(1)
  })

  it('skips empty conversations and ones older than the keep period', async () => {
    const folder = await createFolder()
    const empty = source('claude', 'empty', NOW, [])
    const old = source('codex', 'old', NOW - 40 * DAY_MS, [{ role: 'user', text: 'old' }])

    expect(await syncHistory(folder, [empty, old], 30, NOW)).toBe(0)
    expect(await measureHistory(folder)).toEqual([])
  })
})

describe('pruneHistory and measureHistory', () => {
  it('removes copies older than the keep period and measures what is left per agent', async () => {
    const folder = await createFolder()
    await syncHistory(
      folder,
      [source('claude', 'new', NOW, [{ role: 'user', text: 'new' }]), source('codex', 'old', NOW - 40 * DAY_MS, [{ role: 'user', text: 'old' }])],
      null,
      NOW
    )

    expect(await pruneHistory(folder, 30, NOW)).toBe(1)
    const sizes = await measureHistory(folder)
    expect(sizes.map((size) => [size.agent, size.conversationCount])).toEqual([
      ['claude', 1],
      ['codex', 0]
    ])
    expect(sizes[0].totalBytes).toBeGreaterThan(0)
  })
})
