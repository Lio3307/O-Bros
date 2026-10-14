import { describe, expect, it } from 'vitest'
import {
  clampSplitRatio,
  computePaneRects,
  listDividers,
  listPaneIds,
  removePaneFromLayout,
  setSplitRatio,
  splitPaneInLayout,
  type PaneLayout
} from './paneTree'

const singlePane: PaneLayout = { kind: 'pane', paneId: 'a' }

describe('splitPaneInLayout', () => {
  it('turns a single pane into a split with the new pane second', () => {
    const result = splitPaneInLayout(singlePane, 'a', 'horizontal', 'b')
    expect(result).toEqual({
      kind: 'split',
      direction: 'horizontal',
      first: { kind: 'pane', paneId: 'a' },
      second: { kind: 'pane', paneId: 'b' }
    })
  })

  it('splits a nested pane without touching its sibling', () => {
    const once = splitPaneInLayout(singlePane, 'a', 'horizontal', 'b')
    const twice = splitPaneInLayout(once, 'b', 'vertical', 'c')
    expect(listPaneIds(twice)).toEqual(['a', 'b', 'c'])
  })
})

describe('removePaneFromLayout', () => {
  it('collapses a split back to the remaining pane', () => {
    const split = splitPaneInLayout(singlePane, 'a', 'horizontal', 'b')
    expect(removePaneFromLayout(split, 'a')).toEqual({ kind: 'pane', paneId: 'b' })
  })

  it('returns null when the last pane is removed', () => {
    expect(removePaneFromLayout(singlePane, 'a')).toBeNull()
  })
})

describe('computePaneRects', () => {
  it('gives a single pane the whole area', () => {
    expect(computePaneRects(singlePane)).toEqual({ a: { left: 0, top: 0, width: 100, height: 100 } })
  })

  it('puts the second pane to the right of the first for a horizontal split', () => {
    const rects = computePaneRects(splitPaneInLayout(singlePane, 'a', 'horizontal', 'b'))
    expect(rects.a).toEqual({ left: 0, top: 0, width: 50, height: 100 })
    expect(rects.b).toEqual({ left: 50, top: 0, width: 50, height: 100 })
  })

  it('stacks the second pane below the first for a vertical split and uses the ratio', () => {
    const split = setSplitRatio(splitPaneInLayout(singlePane, 'a', 'vertical', 'b'), [], 0.25)
    const rects = computePaneRects(split)
    expect(rects.a).toEqual({ left: 0, top: 0, width: 100, height: 25 })
    expect(rects.b).toEqual({ left: 0, top: 25, width: 100, height: 75 })
  })

  it('keeps a pane in the same place when another pane is split away from it', () => {
    const once = splitPaneInLayout(singlePane, 'a', 'horizontal', 'b')
    const twice = splitPaneInLayout(once, 'b', 'vertical', 'c')
    const rects = computePaneRects(twice)
    expect(rects.a).toEqual({ left: 0, top: 0, width: 50, height: 100 })
    expect(rects.b).toEqual({ left: 50, top: 0, width: 50, height: 50 })
    expect(rects.c).toEqual({ left: 50, top: 50, width: 50, height: 50 })
  })
})

describe('listDividers and setSplitRatio', () => {
  it('lists one divider per split with the path to it', () => {
    const once = splitPaneInLayout(singlePane, 'a', 'horizontal', 'b')
    const twice = splitPaneInLayout(once, 'b', 'vertical', 'c')
    expect(listDividers(twice).map((divider) => divider.path)).toEqual([[], ['second']])
  })

  it('changes only the split at the given path', () => {
    const once = splitPaneInLayout(singlePane, 'a', 'horizontal', 'b')
    const twice = splitPaneInLayout(once, 'b', 'vertical', 'c')
    const resized = setSplitRatio(twice, ['second'], 0.3)
    const dividers = listDividers(resized)
    expect(dividers[0].ratio).toBe(0.5)
    expect(dividers[1].ratio).toBe(0.3)
  })

  it('keeps the ratio between the smallest and largest allowed values', () => {
    expect(clampSplitRatio(0)).toBe(0.15)
    expect(clampSplitRatio(1)).toBe(0.85)
    expect(clampSplitRatio(0.4)).toBe(0.4)
  })
})
