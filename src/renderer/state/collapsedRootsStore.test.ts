import { describe, expect, it } from 'vitest'
import { parseCollapsedRoots } from './collapsedRootsStore'

describe('parseCollapsedRoots', () => {
  it('keeps saved folder paths and ignores anything else', () => {
    expect(parseCollapsedRoots(JSON.stringify(['E:\\', 3, 'C:\\work']))).toEqual(['E:\\', 'C:\\work'])
    expect(parseCollapsedRoots('{"a":1}')).toEqual([])
    expect(parseCollapsedRoots('not json')).toEqual([])
    expect(parseCollapsedRoots(null)).toEqual([])
  })
})
