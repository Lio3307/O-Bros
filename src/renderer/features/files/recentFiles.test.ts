import { describe, expect, it } from 'vitest'
import { pushRecentFile } from './recentFiles'

describe('pushRecentFile', () => {
  it('puts the newest file first and removes its older entry', () => {
    expect(pushRecentFile(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c'])
  })

  it('keeps only the newest files', () => {
    expect(pushRecentFile(['a', 'b'], 'c', 2)).toEqual(['c', 'a'])
  })
})
