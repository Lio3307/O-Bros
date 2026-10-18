import { describe, expect, it } from 'vitest'
import { classifyDiffLine, parseDiffRows, splitDiffRows } from './diffLines'

describe('classifyDiffLine', () => {
  it('treats file headers before added and removed lines', () => {
    expect(classifyDiffLine('+++ b/src/app.tsx')).toBe('header')
    expect(classifyDiffLine('--- a/src/app.tsx')).toBe('header')
  })

  it('classifies hunks, additions, removals and context', () => {
    expect(classifyDiffLine('@@ -1,3 +1,4 @@')).toBe('hunk')
    expect(classifyDiffLine('+const a = 1')).toBe('added')
    expect(classifyDiffLine('-const a = 0')).toBe('removed')
    expect(classifyDiffLine(' unchanged')).toBe('context')
  })
})

const SAMPLE_DIFF = [
  'diff --git a/notes.txt b/notes.txt',
  'index 1111111..2222222 100644',
  '--- a/notes.txt',
  '+++ b/notes.txt',
  '@@ -3,4 +3,4 @@ section',
  ' keep',
  '-old one',
  '-old two',
  '+new one',
  ' --- a context line that starts with dashes',
  '--- a removed line that starts with dashes',
  '\\ No newline at end of file',
  ''
].join('\n')

describe('parseDiffRows', () => {
  it('numbers each side and keeps lines that look like headers inside a hunk', () => {
    const rows = parseDiffRows(SAMPLE_DIFF)
    expect(rows.map((row) => [row.kind, row.oldNumber, row.newNumber, row.text])).toEqual([
      ['hunk', null, null, '@@ -3,4 +3,4 @@ section'],
      ['context', 3, 3, 'keep'],
      ['removed', 4, null, 'old one'],
      ['removed', 5, null, 'old two'],
      ['added', null, 4, 'new one'],
      ['context', 6, 5, '--- a context line that starts with dashes'],
      ['removed', 7, null, '-- a removed line that starts with dashes']
    ])
  })
})

describe('splitDiffRows', () => {
  it('pairs removed lines with added lines and leaves the gap empty', () => {
    const split = splitDiffRows(parseDiffRows(SAMPLE_DIFF))
    expect(split.map((row) => (row.isHunk ? 'hunk' : `${row.left?.number ?? '-'}|${row.right?.number ?? '-'}`))).toEqual([
      'hunk',
      '3|3',
      '4|4',
      '5|-',
      '6|5',
      '7|-'
    ])
    expect(split[2].left?.text).toBe('old one')
    expect(split[2].right?.text).toBe('new one')
  })
})
