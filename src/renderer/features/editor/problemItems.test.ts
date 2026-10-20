import { Text } from '@codemirror/state'
import { describe, expect, it } from 'vitest'
import { toProblemItems } from './problemItems'

describe('toProblemItems', () => {
  it('turns editor diagnostics into line and column problems and leaves out info and hints', () => {
    const document = Text.of(['const a = 1', "const count: number = 'two'"])
    const secondLineStart = document.line(2).from

    const problems = toProblemItems(document, [
      { from: secondLineStart + 6, to: secondLineStart + 11, severity: 'error', message: 'Type mismatch' },
      { from: 0, to: 5, severity: 'warning', message: 'Unused' },
      { from: 0, to: 0, severity: 'info', message: 'The linter could not check this file.' },
      { from: 0, to: 0, severity: 'hint', message: 'Hint' }
    ])

    expect(problems).toEqual([
      { line: 2, column: 7, severity: 'error', message: 'Type mismatch' },
      { line: 1, column: 1, severity: 'warning', message: 'Unused' }
    ])
  })
})
