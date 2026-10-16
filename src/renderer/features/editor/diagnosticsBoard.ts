import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint'
import type { EditorView } from '@codemirror/view'

const toolDiagnostics = new WeakMap<EditorView, Diagnostic[]>()
const serverDiagnostics = new WeakMap<EditorView, Diagnostic[]>()

export const sharedLintGutter = lintGutter()

function withinDocument(view: EditorView, diagnostics: Diagnostic[]): Diagnostic[] {
  const length = view.state.doc.length
  return diagnostics
    .filter((diagnostic) => diagnostic.from <= length)
    .map((diagnostic) => ({ ...diagnostic, to: Math.min(Math.max(diagnostic.to, diagnostic.from), length) }))
}

function combined(view: EditorView): Diagnostic[] {
  return withinDocument(view, [...(toolDiagnostics.get(view) ?? []), ...(serverDiagnostics.get(view) ?? [])])
}

export function lastToolDiagnostics(view: EditorView): Diagnostic[] {
  return toolDiagnostics.get(view) ?? []
}

export function withToolDiagnostics(view: EditorView, diagnostics: Diagnostic[]): Diagnostic[] {
  toolDiagnostics.set(view, diagnostics)
  return combined(view)
}

export function showServerDiagnostics(view: EditorView, diagnostics: Diagnostic[]): void {
  serverDiagnostics.set(view, diagnostics)
  view.dispatch(setDiagnostics(view.state, combined(view)))
}
