import { describe, expect, it } from 'vitest'
import { parseDiffRows } from './diffLines'
import { diffLinePair, tokenizeLine } from './inlineDiff'

function changedParts(segments: { text: string; isChanged: boolean }[]): string[] {
  return segments.filter((segment) => segment.isChanged).map((segment) => segment.text)
}

describe('tokenizeLine', () => {
  it('splits words, spaces and single symbols', () => {
    expect(tokenizeLine('const user_id = get(42);')).toEqual(['const', ' ', 'user_id', ' ', '=', ' ', 'get', '(', '42', ')', ';'])
  })
})

describe('diffLinePair', () => {
  it('marks only the changed word', () => {
    const pair = diffLinePair('i love cake', 'i love fish')
    expect(pair).not.toBeNull()
    expect(changedParts(pair!.before)).toEqual(['cake'])
    expect(changedParts(pair!.after)).toEqual(['fish'])
    expect(pair!.after.map((segment) => segment.text).join('')).toBe('i love fish')
  })

  it('marks inserted words on the new side only', () => {
    const pair = diffLinePair('return value', 'return await value')
    expect(changedParts(pair!.before)).toEqual([])
    expect(changedParts(pair!.after)).toEqual(['await '])
  })

  it('skips lines that have almost nothing in common', () => {
    expect(diffLinePair('import React from react', 'export default App')).toBeNull()
  })
})

describe('parseDiffRows inline changes', () => {
  it('pairs a removed line with the added line after it', () => {
    const rows = parseDiffRows(['@@ -1,1 +1,1 @@', '-const name = "cake"', '+const name = "fish"'].join('\n'))
    expect(changedParts(rows[1].segments!)).toEqual(['cake'])
    expect(changedParts(rows[2].segments!)).toEqual(['fish'])
  })

  it('leaves added lines without a removed partner plain', () => {
    const rows = parseDiffRows(['@@ -1,0 +1,1 @@', '+brand new line'].join('\n'))
    expect(rows[1].segments).toBeUndefined()
  })
})
