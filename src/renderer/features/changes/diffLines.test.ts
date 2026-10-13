import { describe, expect, it } from 'vitest'
import { classifyDiffLine } from './diffLines'

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
