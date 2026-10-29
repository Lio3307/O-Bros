import { describe, expect, it } from 'vitest'
import { trailOutline } from './trailOutline'

const box = (left: number, top: number) => ({ left, top, width: 2, height: 20 })

describe('trailOutline', () => {
  it('runs from a thin tail at the old place to the full cursor at the new place', () => {
    const outline = trailOutline(box(0, 0), box(100, 0))
    expect(outline).toHaveLength(6)
    expect(outline).toContainEqual([1, 7])
    expect(outline).toContainEqual([1, 13])
    expect(outline).toContainEqual([102, 0])
    expect(outline).toContainEqual([100, 20])
  })

  it('drops corners that sit inside the shape when moving straight down', () => {
    const outline = trailOutline(box(0, 0), box(0, 100))
    expect(outline).toHaveLength(5)
    expect(outline).toContainEqual([1, 7])
    expect(outline).not.toContainEqual([1, 13])
  })
})
