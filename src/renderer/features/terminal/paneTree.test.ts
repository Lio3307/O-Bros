import { describe, expect, it } from 'vitest'
import { listPaneIds, removePaneFromLayout, splitPaneInLayout, type PaneLayout } from './paneTree'

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
