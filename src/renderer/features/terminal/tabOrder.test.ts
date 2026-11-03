import { describe, expect, it } from 'vitest'
import { itemBeside, moveItem } from './tabOrder'

describe('moveItem', () => {
  it('moves an item forward', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
  })

  it('moves an item backward', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('does not change the original list', () => {
    const original = ['a', 'b']
    moveItem(original, 0, 1)
    expect(original).toEqual(['a', 'b'])
  })
})

describe('itemBeside', () => {
  it('steps right and left, wrapping around at the ends', () => {
    expect(itemBeside(['a', 'b', 'c'], 'c', 1)).toBe('a')
    expect(itemBeside(['a', 'b', 'c'], 'a', -1)).toBe('c')
    expect(itemBeside(['a', 'b', 'c'], 'a', 1)).toBe('b')
  })

  it('has nowhere to go with one item, or an item that is not in the list', () => {
    expect(itemBeside(['a'], 'a', 1)).toBeNull()
    expect(itemBeside(['a', 'b'], 'x', 1)).toBeNull()
  })
})
