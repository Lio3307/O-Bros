import { describe, expect, it } from 'vitest'
import { parseStringList } from './browserStorage'

describe('parseStringList', () => {
  it('keeps saved strings and ignores anything else', () => {
    expect(parseStringList(JSON.stringify(['E:\\', 3, 'C:\\work']))).toEqual(['E:\\', 'C:\\work'])
    expect(parseStringList('{"a":1}')).toEqual([])
    expect(parseStringList('not json')).toEqual([])
    expect(parseStringList(null)).toEqual([])
  })
})
