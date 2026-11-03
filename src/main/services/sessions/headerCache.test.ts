import { describe, expect, it } from 'vitest'
import { forgetHeadersExcept, readHeaderOf } from './headerCache'
import type { TranscriptHeader } from './transcriptFormat'

function countingReader(): { read: (filePath: string) => Promise<TranscriptHeader>; calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    read: (filePath) => {
      calls.push(filePath)
      return Promise.resolve({ sessionId: filePath, title: `title ${calls.length}`, projectPath: null })
    }
  }
}

describe('readHeaderOf', () => {
  it('reads a file once, and again only after it changes', async () => {
    const reader = countingReader()
    const file = { filePath: 'a.jsonl', sizeBytes: 10, modifiedAt: 1 }

    expect((await readHeaderOf(file, reader.read)).title).toBe('title 1')
    expect((await readHeaderOf(file, reader.read)).title).toBe('title 1')
    expect(reader.calls).toEqual(['a.jsonl'])

    expect((await readHeaderOf({ ...file, modifiedAt: 2 }, reader.read)).title).toBe('title 2')
    expect((await readHeaderOf({ ...file, modifiedAt: 2, sizeBytes: 11 }, reader.read)).title).toBe('title 3')
  })

  it('forgets files that are gone', async () => {
    const reader = countingReader()
    const kept = { filePath: 'kept.jsonl', sizeBytes: 1, modifiedAt: 1 }
    const gone = { filePath: 'gone.jsonl', sizeBytes: 1, modifiedAt: 1 }
    await readHeaderOf(kept, reader.read)
    await readHeaderOf(gone, reader.read)

    forgetHeadersExcept([kept])
    await readHeaderOf(kept, reader.read)
    await readHeaderOf(gone, reader.read)
    expect(reader.calls).toEqual(['kept.jsonl', 'gone.jsonl', 'gone.jsonl'])
  })
})
