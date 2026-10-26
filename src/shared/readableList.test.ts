import { describe, expect, it } from 'vitest'
import { readableList } from './readableList'

describe('readableList', () => {
  it('joins names the way a sentence would', () => {
    expect(readableList([], 3)).toBe('')
    expect(readableList(['Pencil'], 3)).toBe('Pencil')
    expect(readableList(['@playwright/mcp', 'Pencil'], 3)).toBe('@playwright/mcp and Pencil')
    expect(readableList(['a', 'b', 'c'], 3)).toBe('a, b and c')
  })

  it('counts the names it leaves out', () => {
    expect(readableList(['a', 'b', 'c', 'd', 'e'], 3)).toBe('a, b, c and 2 more')
  })
})
