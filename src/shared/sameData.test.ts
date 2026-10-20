import { describe, expect, it } from 'vitest'
import { isSameData } from './sameData'

describe('isSameData', () => {
  it('compares plain data by value', () => {
    expect(isSameData({ a: [1, 2], b: null }, { a: [1, 2], b: null })).toBe(true)
    expect(isSameData({ a: [1, 2] }, { a: [2, 1] })).toBe(false)
    expect(isSameData(null, null)).toBe(true)
  })
})
