import { Text } from '@codemirror/state'
import { describe, expect, it } from 'vitest'
import type { LintDiagnostic } from '../../../shared/types'
import { toEditorDiagnostics } from './lintDiagnostics'

const document = Text.of(['const unused = 1', 'debugger'])

function diagnostic(changes: Partial<LintDiagnostic>): LintDiagnostic {
  return {
    message: 'Problem',
    severity: 'warning',
    ruleCode: null,
    helpText: null,
    line: 1,
    column: 1,
    length: 1,
    ...changes
  }
}

describe('toEditorDiagnostics', () => {
  it('converts a one-based line and column into a document range', () => {
    const [result] = toEditorDiagnostics(document, [diagnostic({ line: 1, column: 7, length: 6 })])
    expect(result.from).toBe(6)
    expect(result.to).toBe(12)
  })

  it('adds the document offset of later lines', () => {
    const [result] = toEditorDiagnostics(document, [diagnostic({ line: 2, column: 1, length: 8 })])
    expect(result.from).toBe(17)
    expect(result.to).toBe(25)
  })

  it('keeps positions inside the document when the report is out of range', () => {
    const [result] = toEditorDiagnostics(document, [diagnostic({ line: 99, column: 99, length: 99 })])
    expect(result.from).toBeLessThanOrEqual(document.length)
    expect(result.to).toBe(document.length)
  })

  it('joins message, rule and help text', () => {
    const [result] = toEditorDiagnostics(document, [diagnostic({ ruleCode: 'eslint(no-debugger)', helpText: 'Remove it.' })])
    expect(result.message).toBe('Problem (eslint(no-debugger)) - Remove it.')
  })
})
