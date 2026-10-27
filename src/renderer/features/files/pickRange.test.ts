import { describe, expect, it } from 'vitest'
import { draggedPathsFor, pathsBetween, togglePath } from './pickRange'

const SHOWN = ['src', 'src/a.ts', 'src/b.ts', 'README.md']

describe('picking several files', () => {
  it('picks everything shown between the first pick and the shift-click, in either direction', () => {
    expect(pathsBetween(SHOWN, 'src/a.ts', 'README.md')).toEqual(['src/a.ts', 'src/b.ts', 'README.md'])
    expect(pathsBetween(SHOWN, 'README.md', 'src')).toEqual(SHOWN)
    expect(pathsBetween(SHOWN, 'gone.txt', 'src/b.ts')).toEqual(['src/b.ts'])
  })

  it('adds and removes a ctrl-clicked item', () => {
    expect(togglePath(['src'], 'README.md')).toEqual(['src', 'README.md'])
    expect(togglePath(['src', 'README.md'], 'src')).toEqual(['README.md'])
  })

  it('drags every picked item when the dragged one is picked, otherwise only that one', () => {
    expect(draggedPathsFor(['src', 'README.md'], 'README.md')).toEqual(['src', 'README.md'])
    expect(draggedPathsFor(['src', 'README.md'], 'src/a.ts')).toEqual(['src/a.ts'])
  })
})
