import { describe, expect, it } from 'vitest'
import { newUntrackedPaths, parseNameStatus, splitLines } from './gitReviewParser'

describe('parseNameStatus', () => {
  it('reads added, modified and deleted files', () => {
    expect(parseNameStatus('A\tsrc/new.ts\nM\tsrc/a.ts\nD\told.ts\n')).toEqual([
      { path: 'src/new.ts', kind: 'added' },
      { path: 'src/a.ts', kind: 'modified' },
      { path: 'old.ts', kind: 'deleted' }
    ])
  })

  it('returns nothing for empty output', () => {
    expect(parseNameStatus('')).toEqual([])
  })
})

describe('newUntrackedPaths', () => {
  it('keeps only files that were not untracked at the start', () => {
    expect(newUntrackedPaths(['a.txt', 'b.txt'], ['a.txt'])).toEqual(['b.txt'])
  })
})

describe('splitLines', () => {
  it('drops empty lines', () => {
    expect(splitLines('a\n\nb\n')).toEqual(['a', 'b'])
  })
})
