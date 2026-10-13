import { describe, expect, it } from 'vitest'
import { countProblems } from './problemsStore'

describe('countProblems', () => {
  it('counts errors and warnings across files', () => {
    const byFile = {
      'a.ts': [
        { line: 1, column: 1, severity: 'error' as const, message: 'x' },
        { line: 2, column: 1, severity: 'warning' as const, message: 'y' }
      ],
      'b.ts': [{ line: 1, column: 1, severity: 'warning' as const, message: 'z' }]
    }
    expect(countProblems(byFile)).toEqual({ errors: 1, warnings: 2 })
  })

  it('is zero when nothing is wrong', () => {
    expect(countProblems({})).toEqual({ errors: 0, warnings: 0 })
  })
})
