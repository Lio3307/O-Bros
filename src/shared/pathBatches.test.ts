import { describe, expect, it } from 'vitest'
import { pathBatches } from './pathBatches'

describe('pathBatches', () => {
  it('keeps every path, in order, and stays under the limit', () => {
    const paths = Array.from({ length: 5000 }, (_, index) => `folder/file-${index}.txt`)
    const batches = pathBatches(paths, 1000)
    expect(batches.length).toBeGreaterThan(1)
    expect(batches.flat()).toEqual(paths)
    for (const batch of batches) {
      expect(batch.reduce((total, path) => total + path.length + 3, 0)).toBeLessThanOrEqual(1000)
    }
  })

  it('gives a path longer than the limit its own batch', () => {
    const long = 'x'.repeat(50)
    expect(pathBatches(['a', long, 'b'], 10)).toEqual([['a'], [long], ['b']])
  })

  it('has no batches for no paths', () => {
    expect(pathBatches([])).toEqual([])
  })
})
