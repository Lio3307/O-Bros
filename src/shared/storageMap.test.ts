import { describe, expect, it } from 'vitest'
import { agentNameOf, storageBlocks } from './storageMap'

const size = (bytes: number): string => `${bytes} B`

describe('agentNameOf', () => {
  it('drops the word every row would repeat, and keeps the account', () => {
    expect(agentNameOf('Codex conversations')).toBe('Codex')
    expect(agentNameOf('Claude conversations (work)')).toBe('Claude (work)')
    expect(agentNameOf('O-BROS itself')).toBe('O-BROS itself')
  })
})

describe('storageBlocks', () => {
  it('puts the biggest first with its share of the total, and skips empty items', () => {
    const blocks = storageBlocks(
      [
        { label: 'Claude conversations', path: 'a', bytes: 25 },
        { label: 'Codex conversations', path: 'b', bytes: 75 },
        { label: 'Empty', path: 'c', bytes: 0 }
      ],
      size
    )
    expect(blocks.map((block) => [block.label, block.share])).toEqual([
      ['Codex', 0.75],
      ['Claude', 0.25]
    ])
  })

  it('joins items too small to see, and still names them on hover', () => {
    const blocks = storageBlocks(
      [
        { label: 'Big', path: 'a', bytes: 1000 },
        { label: 'Tiny one', path: 'b', bytes: 1 },
        { label: 'Tiny two', path: 'c', bytes: 2 }
      ],
      size
    )
    expect(blocks[1]).toMatchObject({ label: '2 smaller', bytes: 3, path: null })
    expect(blocks[1].title).toContain('Tiny two: 2 B')
  })

  it('keeps the name when only one item is too small to see', () => {
    const blocks = storageBlocks(
      [
        { label: 'Big', path: 'a', bytes: 1000 },
        { label: 'Gemini conversations', path: 'b', bytes: 1 }
      ],
      size
    )
    expect(blocks[1]).toMatchObject({ label: 'Gemini', path: 'b' })
  })

  it('has nothing to draw when nothing is kept', () => {
    expect(storageBlocks([{ label: 'Empty', path: 'a', bytes: 0 }], size)).toEqual([])
  })
})
