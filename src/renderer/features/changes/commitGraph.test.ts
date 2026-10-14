import { describe, expect, it } from 'vitest'
import { buildCommitGraph, laneCount } from './commitGraph'

describe('buildCommitGraph', () => {
  it('keeps a straight history in a single lane', () => {
    const rows = buildCommitGraph([
      { hash: 'c', parents: ['b'] },
      { hash: 'b', parents: ['a'] },
      { hash: 'a', parents: [] }
    ])

    expect(rows.map((row) => row.lane)).toEqual([0, 0, 0])
    expect(rows[0].above).toEqual([])
    expect(rows[0].below).toEqual(['b'])
    expect(rows[1].above).toEqual(['b'])
    expect(rows[2].below).toEqual([])
    expect(laneCount(rows)).toBe(1)
  })

  it('opens a second lane for the second parent of a merge and closes it when they meet', () => {
    const rows = buildCommitGraph([
      { hash: 'm', parents: ['a', 'b'] },
      { hash: 'a', parents: ['base'] },
      { hash: 'b', parents: ['base'] },
      { hash: 'base', parents: [] }
    ])

    expect(rows[0].isMerge).toBe(true)
    expect(rows[0].parentLanes).toEqual([0, 1])
    expect(rows[0].below).toEqual(['a', 'b'])
    expect(rows[1].lane).toBe(0)
    expect(rows[2].lane).toBe(1)
    expect(rows[3].lane).toBe(0)
    expect(rows[2].parentLanes).toEqual([0])
    expect(rows[3].above).toEqual(['base'])
    expect(rows[3].below).toEqual([])
    expect(laneCount(rows)).toBe(2)
  })

  it('puts a second branch head in a new lane next to the first', () => {
    const rows = buildCommitGraph([
      { hash: 'feature', parents: ['base'] },
      { hash: 'main', parents: ['base'] },
      { hash: 'base', parents: [] }
    ])

    expect(rows[0].lane).toBe(0)
    expect(rows[1].lane).toBe(1)
    expect(rows[1].parentLanes).toEqual([0])
    expect(rows[2].above).toEqual(['base'])
  })

  it('joins a lane that already waits for the same parent', () => {
    const rows = buildCommitGraph([
      { hash: 'a', parents: ['shared'] },
      { hash: 'b', parents: ['shared'] },
      { hash: 'shared', parents: [] }
    ])

    expect(rows[1].lane).toBe(1)
    expect(rows[1].parentLanes).toEqual([0])
    expect(rows[1].below).toEqual(['shared'])
  })
})
