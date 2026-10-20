import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint'
import type { EditorView } from '@codemirror/view'
import { useProblemsStore } from '../../state/problemsStore'
import { toProblemItems } from './problemItems'

const toolDiagnostics = new WeakMap<EditorView, Diagnostic[]>()
const serverDiagnostics = new WeakMap<EditorView, Diagnostic[]>()

export const sharedLintGutter = lintGutter()

function withinDocument(view: EditorView, diagnostics: Diagnostic[]): Diagnostic[] {
  const length = view.state.doc.length
  return diagnostics
    .filter((diagnostic) => diagnostic.from <= length)
    .map((diagnostic) => ({ ...diagnostic, to: Math.min(Math.max(diagnostic.to, diagnostic.from), length) }))
}

function combinedAndPublished(view: EditorView, filePath: string): Diagnostic[] {
  const diagnostics = withinDocument(view, [...(toolDiagnostics.get(view) ?? []), ...(serverDiagnostics.get(view) ?? [])])
  useProblemsStore.getState().setFile(filePath, toProblemItems(view.state.doc, diagnostics))
  return diagnostics
}

export function lastToolDiagnostics(view: EditorView): Diagnostic[] {
  return toolDiagnostics.get(view) ?? []
}

export function withToolDiagnostics(view: EditorView, filePath: string, diagnostics: Diagnostic[]): Diagnostic[] {
  toolDiagnostics.set(view, diagnostics)
  return combinedAndPublished(view, filePath)
}

export function showServerDiagnostics(view: EditorView, filePath: string, diagnostics: Diagnostic[]): void {
  serverDiagnostics.set(view, diagnostics)
  view.dispatch(setDiagnostics(view.state, combinedAndPublished(view, filePath)))
}
