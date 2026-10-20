import type { Diagnostic } from '@codemirror/lint'
import type { Text } from '@codemirror/state'
import type { ProblemItem } from '../../state/problemsStore'

export function toProblemItems(document: Text, diagnostics: Diagnostic[]): ProblemItem[] {
  const problems: ProblemItem[] = []
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity !== 'error' && diagnostic.severity !== 'warning') {
      continue
    }
    const line = document.lineAt(diagnostic.from)
    problems.push({ line: line.number, column: diagnostic.from - line.from + 1, severity: diagnostic.severity, message: diagnostic.message })
  }
  return problems
}
