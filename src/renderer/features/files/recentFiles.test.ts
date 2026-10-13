import { describe, expect, it } from 'vitest'
import { parseRecentFiles, pushRecentFile } from './recentFiles'

describe('pushRecentFile', () => {
  it('puts the newest file first and removes its older entry', () => {
    expect(pushRecentFile(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c'])
  })

  it('keeps only the newest files', () => {
    expect(pushRecentFile(['a', 'b'], 'c', 2)).toEqual(['c', 'a'])
  })
})

describe('parseRecentFiles', () => {
  it('reads a saved list and ignores broken data', () => {
    expect(parseRecentFiles('["a","b"]')).toEqual(['a', 'b'])
    expect(parseRecentFiles('{"a":1}')).toEqual([])
    expect(parseRecentFiles('nope')).toEqual([])
    expect(parseRecentFiles(null)).toEqual([])
  })
})
