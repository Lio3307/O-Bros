import { describe, expect, it } from 'vitest'
import { findFileReferences } from './fileReference'

function pathsIn(text: string): string[] {
  return findFileReferences(text).map((reference) => reference.path)
}

describe('findFileReferences', () => {
  it('reads path, line and column', () => {
    expect(findFileReferences('src/App.tsx:12:5')).toEqual([
      { path: 'src/App.tsx', line: 12, column: 5, start: 0, end: 16 }
    ])
  })

  it('uses column 1 when only a line is given', () => {
    const [reference] = findFileReferences('src/App.tsx:12')
    expect(reference.line).toBe(12)
    expect(reference.column).toBe(1)
  })

  it('keeps the drive letter of Windows paths', () => {
    const [reference] = findFileReferences('E:\\Repo\\a.ts:7:2')
    expect(reference.path).toBe('E:\\Repo\\a.ts')
    expect(reference.line).toBe(7)
  })

  it('finds a reference inside brackets and returns its exact range', () => {
    const text = 'at run (E:\\x\\y.js:10:3)'
    const [reference] = findFileReferences(text)
    expect(text.slice(reference.start, reference.end)).toBe('E:\\x\\y.js:10:3')
  })

  it('reads the compiler form with parentheses', () => {
    const [reference] = findFileReferences('src/a.ts(12,5): error TS2322')
    expect(reference).toMatchObject({ path: 'src/a.ts', line: 12, column: 5 })
  })

  it('ignores a trailing colon or full stop', () => {
    expect(pathsIn('src/a.ts:12:5: error')).toEqual(['src/a.ts'])
    expect(pathsIn('see src/a.ts:12.')).toEqual(['src/a.ts'])
  })

  it('finds several references in one line', () => {
    expect(pathsIn('a/one.ts:1 and b/two.ts:2')).toEqual(['a/one.ts', 'b/two.ts'])
  })

  it('ignores things that are not files', () => {
    expect(pathsIn('localhost:3000')).toEqual([])
    expect(pathsIn('took 10:30:45')).toEqual([])
    expect(pathsIn('https://example.com/a.js:10')).toEqual([])
    expect(pathsIn('version v1.2:3')).toEqual([])
    expect(pathsIn('src/a.ts:0')).toEqual([])
    expect(pathsIn('src/a.ts')).toEqual([])
  })
})
