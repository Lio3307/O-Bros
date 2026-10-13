import type { Diagnostic } from '@codemirror/lint'
import type { Text } from '@codemirror/state'
import type { LintDiagnostic } from '../../../shared/types'

const LINT_SOURCE_NAME = 'oxlint'

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function messageOf(diagnostic: LintDiagnostic): string {
  const parts = [diagnostic.message]
  if (diagnostic.ruleCode !== null) {
    parts.push(`(${diagnostic.ruleCode})`)
  }
  if (diagnostic.helpText !== null) {
    parts.push(`- ${diagnostic.helpText}`)
  }
  return parts.join(' ')
}

export function toEditorDiagnostics(document: Text, diagnostics: LintDiagnostic[]): Diagnostic[] {
  return diagnostics.map((diagnostic) => {
    const line = document.line(clamp(diagnostic.line, 1, document.lines))
    const from = clamp(line.from + diagnostic.column - 1, line.from, line.to)
    const to = clamp(from + diagnostic.length, from, document.length)
    return { from, to, severity: diagnostic.severity, message: messageOf(diagnostic), source: LINT_SOURCE_NAME }
  })
}

export function toolFailureDiagnostic(): Diagnostic {
  return { from: 0, to: 0, severity: 'info', message: 'The linter could not check this file.', source: LINT_SOURCE_NAME }
}
