import { create } from 'zustand'
import type { LintSeverity } from '../../shared/types'

export interface ProblemItem {
  line: number
  column: number
  severity: LintSeverity
  message: string
}

interface ProblemsState {
  byFile: Record<string, ProblemItem[]>
  setFile: (filePath: string, problems: ProblemItem[]) => void
  clearFile: (filePath: string) => void
}

export const useProblemsStore = create<ProblemsState>()((set, get) => ({
  byFile: {},

  setFile: (filePath, problems) => {
    const byFile = { ...get().byFile }
    if (problems.length === 0) {
      delete byFile[filePath]
    } else {
      byFile[filePath] = problems
    }
    set({ byFile })
  },

  clearFile: (filePath) => get().setFile(filePath, [])
}))

export function countProblems(byFile: Record<string, ProblemItem[]>): { errors: number; warnings: number } {
  let errors = 0
  let warnings = 0
  for (const problems of Object.values(byFile)) {
    for (const problem of problems) {
      if (problem.severity === 'error') {
        errors += 1
      } else {
        warnings += 1
      }
    }
  }
  return { errors, warnings }
}
