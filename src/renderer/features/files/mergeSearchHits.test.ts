import { describe, expect, it } from 'vitest'
import { mergeSearchHits } from './mergeSearchHits'

const readme = { name: 'readme.md', path: '/p/readme.md' }
const app = { name: 'app.ts', path: '/p/app.ts' }
const util = { name: 'util.ts', path: '/p/util.ts' }

describe('mergeSearchHits', () => {
  it('lists name matches first and marks content-only matches', () => {
    expect(mergeSearchHits([readme], [app])).toEqual([
      { hit: readme, isContentOnly: false },
      { hit: app, isContentOnly: true }
    ])
  })

  it('shows a file once when both its name and contents match', () => {
    expect(mergeSearchHits([readme, util], [util, app])).toHaveLength(3)
  })

  it('handles no results', () => {
    expect(mergeSearchHits([], [])).toEqual([])
  })
})
