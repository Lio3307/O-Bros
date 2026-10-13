import type { LintDiagnostic, LintSeverity } from '../../../shared/types'

interface OxlintSpan {
  offset: number
  length: number
  line: number
  column: number
}

interface OxlintLabel {
  label?: string
  span: OxlintSpan
}

interface OxlintDiagnostic {
  message: string
  code?: string
  severity?: string
  help?: string
  labels?: OxlintLabel[]
}

interface OxlintReport {
  diagnostics?: OxlintDiagnostic[]
}

function toSeverity(raw: string | undefined): LintSeverity {
  return raw === 'error' ? 'error' : 'warning'
}

export function parseOxlintReport(output: string): LintDiagnostic[] {
  const report = JSON.parse(output) as OxlintReport
  const diagnostics: LintDiagnostic[] = []

  for (const item of report.diagnostics ?? []) {
    const span = item.labels?.[0]?.span
    if (span === undefined) {
      continue
    }
    diagnostics.push({
      message: item.message,
      severity: toSeverity(item.severity),
      ruleCode: item.code ?? null,
      helpText: item.help ?? null,
      line: span.line,
      column: span.column,
      length: span.length
    })
  }

  return diagnostics
}
