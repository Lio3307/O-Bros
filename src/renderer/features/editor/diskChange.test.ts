import { describe, expect, it } from 'vitest'
import { changeBetween } from './diskChange'

function apply(text: string, change: ReturnType<typeof changeBetween>): string {
  return change === null ? text : text.slice(0, change.from) + change.insert + text.slice(change.to)
}

describe('changeBetween', () => {
  it('replaces only the part an agent changed', () => {
    const before = 'API_URL=http://old\nPORT=3000\n'
    const after = 'API_URL=https://new.example\nPORT=3000\n'
    const change = changeBetween(before, after)
    expect(change).toEqual({ from: 12, to: 18, insert: 's://new.example' })
    expect(apply(before, change)).toBe(after)
  })

  it('handles added and removed lines at either end', () => {
    for (const [before, after] of [
      ['a\nb\n', 'a\nb\nc\n'],
      ['a\nb\nc\n', 'b\nc\n'],
      ['', 'new file'],
      ['all of it', ''],
      ['aaa', 'aa']
    ]) {
      expect(apply(before, changeBetween(before, after))).toBe(after)
    }
  })

  it('reports nothing when the text is the same', () => {
    expect(changeBetween('same', 'same')).toBeNull()
  })
})
