import { describe, expect, it } from 'vitest'
import { moveItem } from './tabOrder'

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
