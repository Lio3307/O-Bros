import { describe, expect, it } from 'vitest'
import { isStashRef, parseStashList } from './gitStashParser'

const US = '\x1f'

describe('parseStashList', () => {
  it('reads the reference, the time and a readable message', () => {
    const output = [
      `stash@{0}${US}1700000000${US}On main: before the refactor`,
      `stash@{1}${US}1690000000${US}WIP on main: 1a2b3c4 Fix the split`
    ].join('\n')

    const entries = parseStashList(output)

    expect(entries).toEqual([
      { ref: 'stash@{0}', createdAt: 1_700_000_000_000, message: 'before the refactor' },
      { ref: 'stash@{1}', createdAt: 1_690_000_000_000, message: '1a2b3c4 Fix the split' }
    ])
  })

  it('keeps a message that does not use the generated form', () => {
    const [entry] = parseStashList(`stash@{0}${US}1${US}my own note`)
    expect(entry.message).toBe('my own note')
  })

  it('returns nothing for empty output', () => {
    expect(parseStashList('')).toEqual([])
    expect(parseStashList('\n')).toEqual([])
  })
})

describe('isStashRef', () => {
  it('accepts a stash reference', () => {
    expect(isStashRef('stash@{0}')).toBe(true)
    expect(isStashRef('stash@{12}')).toBe(true)
  })

  it('rejects anything that could be an option or another reference', () => {
    expect(isStashRef('--all')).toBe(false)
    expect(isStashRef('HEAD')).toBe(false)
    expect(isStashRef('stash@{}')).toBe(false)
    expect(isStashRef('stash@{a}')).toBe(false)
    expect(isStashRef('stash@{0};rm')).toBe(false)
  })
})
