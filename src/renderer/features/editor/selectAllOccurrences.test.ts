import { describe, expect, it } from 'vitest'
import { occurrenceRanges } from './selectAllOccurrences'

describe('occurrenceRanges', () => {
  it('finds whole words only', () => {
    const text = 'API_URL=a\nAPI_URL_OLD=b\nx=${API_URL}'
    expect(occurrenceRanges(text, 'API_URL')).toEqual([
      { from: 0, to: 7 },
      { from: 28, to: 35 }
    ])
  })

  it('finds any text when the selection is not a word', () => {
    expect(occurrenceRanges('a-b a-b', 'a-b')).toHaveLength(2)
  })

  it('returns nothing for an empty word', () => {
    expect(occurrenceRanges('abc', '')).toEqual([])
  })
})
