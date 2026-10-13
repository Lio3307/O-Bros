import { describe, expect, it } from 'vitest'
import { parseOxlintReport } from './oxlintParser'

const REAL_REPORT = `{ "diagnostics": [{"message": "Variable 'unused' is declared but never used. Unused variables should start with a '_'.","code": "eslint(no-unused-vars)","severity": "warning","url": "https://oxc.rs/docs/guide/usage/linter/rules/eslint/no-unused-vars.html","help": "Consider removing this declaration.","filename": "sample.ts","labels": [{"label": "'unused' is declared here","span": {"offset": 6,"length": 6,"line": 1,"column": 7}}]},
{"message": "\`debugger\` statement is not allowed","code": "eslint(no-debugger)","severity": "error","filename": "sample.ts","labels": [{"span": {"offset": 62,"length": 8,"line": 3,"column": 1}}]},
{"message": "No location","code": "x","severity": "warning","labels": []}],
"number_of_files": 1, "number_of_rules": 96, "threads_count": 8, "start_time": 0.04 }`

describe('parseOxlintReport', () => {
  it('maps the first label of each diagnostic to a position', () => {
    const [first] = parseOxlintReport(REAL_REPORT)
    expect(first).toEqual({
      message: "Variable 'unused' is declared but never used. Unused variables should start with a '_'.",
      severity: 'warning',
      ruleCode: 'eslint(no-unused-vars)',
      helpText: 'Consider removing this declaration.',
      line: 1,
      column: 7,
      length: 6
    })
  })

  it('keeps the error severity and defaults missing help to null', () => {
    const second = parseOxlintReport(REAL_REPORT)[1]
    expect(second.severity).toBe('error')
    expect(second.helpText).toBeNull()
  })

  it('skips diagnostics that have no location', () => {
    expect(parseOxlintReport(REAL_REPORT)).toHaveLength(2)
  })

  it('returns nothing for an empty report', () => {
    expect(parseOxlintReport('{ "diagnostics": [] }')).toEqual([])
  })
})
