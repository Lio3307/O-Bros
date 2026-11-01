import { describe, expect, it } from 'vitest'
import { pageOf } from './pagination'

const ITEMS = Array.from({ length: 60 }, (_, index) => index)

describe('pageOf', () => {
  it('cuts out the wanted page and says which items it holds', () => {
    const second = pageOf(ITEMS, 2, 25)
    expect(second.items[0]).toBe(25)
    expect(second).toMatchObject({ page: 2, pageCount: 3, from: 26, to: 50, total: 60 })
  })

  it('has a shorter last page', () => {
    expect(pageOf(ITEMS, 3, 25)).toMatchObject({ from: 51, to: 60 })
  })

  it('moves back to the last page when the list has shrunk', () => {
    expect(pageOf(ITEMS.slice(0, 10), 3, 25)).toMatchObject({ page: 1, from: 1, to: 10 })
  })

  it('handles an empty list', () => {
    expect(pageOf([], 1, 25)).toEqual({ items: [], page: 1, pageCount: 1, from: 0, to: 0, total: 0 })
  })
})
