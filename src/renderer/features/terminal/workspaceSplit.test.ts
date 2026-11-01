import { describe, expect, it } from 'vitest'
import { dropPartner, dropSideAt, splitAfterChange, splitFromDrop, type SplitChange, type WorkspaceSplit } from './workspaceSplit'

const TABS = [
  { id: 'file-a', kind: 'file' },
  { id: 'file-b', kind: 'file' },
  { id: 'term-a', kind: 'terminal' },
  { id: 'term-b', kind: 'terminal' }
]

function split(first: string, second: string): WorkspaceSplit {
  return { first, second, direction: 'horizontal', ratio: 0.5 }
}

function change(values: Partial<SplitChange> & { split: WorkspaceSplit }): SplitChange {
  return { tabs: TABS, previousActiveTabId: values.split.first, activeTabId: values.split.first, isSameProject: true, ...values }
}

describe('dropSideAt', () => {
  it('picks the nearest edge, and the middle means no split', () => {
    expect(dropSideAt(10, 500, 1000, 1000)).toBe('left')
    expect(dropSideAt(990, 500, 1000, 1000)).toBe('right')
    expect(dropSideAt(500, 10, 1000, 1000)).toBe('top')
    expect(dropSideAt(500, 990, 1000, 1000)).toBe('bottom')
    expect(dropSideAt(500, 500, 1000, 1000)).toBe('center')
  })
})

describe('dropPartner', () => {
  it('shows a dragged tab next to the active one', () => {
    expect(dropPartner(null, 'term-a', 'file-a')).toBe('term-a')
  })

  it('has nothing to pair the only visible tab with', () => {
    expect(dropPartner(null, 'term-a', 'term-a')).toBeNull()
  })

  it('moves the active tab of a split around its partner', () => {
    expect(dropPartner(split('term-a', 'file-a'), 'term-a', 'term-a')).toBe('file-a')
  })
})

describe('splitFromDrop', () => {
  it('puts the dragged tab on the side it was dropped on', () => {
    expect(splitFromDrop('right', 'file-a', 'term-a')).toMatchObject({ first: 'term-a', second: 'file-a', direction: 'horizontal' })
    expect(splitFromDrop('left', 'file-a', 'term-a')).toMatchObject({ first: 'file-a', second: 'term-a', direction: 'horizontal' })
    expect(splitFromDrop('top', 'file-a', 'term-a')).toMatchObject({ first: 'file-a', second: 'term-a', direction: 'vertical' })
    expect(splitFromDrop('bottom', 'file-a', 'term-a')).toMatchObject({ first: 'term-a', second: 'file-a', direction: 'vertical' })
  })
})

describe('splitAfterChange', () => {
  it('opening a file swaps the editor side and leaves the terminal alone', () => {
    const editorAndTerminal = split('file-a', 'term-a')
    const next = splitAfterChange(change({ split: editorAndTerminal, previousActiveTabId: 'term-a', activeTabId: 'file-b' }))
    expect(next).toMatchObject({ first: 'file-b', second: 'term-a' })
  })

  it('a new terminal replaces the terminal side', () => {
    const next = splitAfterChange(change({ split: split('file-a', 'term-a'), previousActiveTabId: 'file-a', activeTabId: 'term-b' }))
    expect(next).toMatchObject({ first: 'file-a', second: 'term-b' })
  })

  it('replaces the focused side when both sides are the same kind', () => {
    const next = splitAfterChange(change({ split: split('term-a', 'term-b'), previousActiveTabId: 'term-b', activeTabId: 'file-a' }))
    expect(next).toMatchObject({ first: 'term-a', second: 'file-a' })
    const sameKind = splitAfterChange(change({ split: split('file-a', 'file-b'), previousActiveTabId: 'file-a', activeTabId: 'term-a' }))
    expect(sameKind).toMatchObject({ first: 'term-a', second: 'file-b' })
  })

  it('ends the split when one of its tabs is closed', () => {
    const tabs = TABS.filter((tab) => tab.id !== 'term-a')
    expect(splitAfterChange(change({ split: split('file-a', 'term-a'), tabs, activeTabId: 'file-a' }))).toBeNull()
  })

  it('stays as it is when focus moves between its sides or to another project', () => {
    const both = split('file-a', 'term-a')
    expect(splitAfterChange(change({ split: both, activeTabId: 'term-a' }))).toBe(both)
    expect(splitAfterChange(change({ split: both, activeTabId: 'term-b', isSameProject: false }))).toBe(both)
  })
})
