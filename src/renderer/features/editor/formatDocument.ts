import type { EditorView } from '@codemirror/view'

export type FormatOutcome = { kind: 'changed' } | { kind: 'unchanged' } | { kind: 'failed'; message: string }

export async function formatDocument(view: EditorView, filePath: string): Promise<FormatOutcome> {
  const original = view.state.doc.toString()
  const result = await window.api.tools.format({ filePath, content: original })

  if (result.formatted === null) {
    return { kind: 'failed', message: result.errorMessage ?? 'Formatting failed.' }
  }
  if (result.formatted === original || view.state.doc.toString() !== original) {
    return { kind: 'unchanged' }
  }

  const cursor = Math.min(view.state.selection.main.head, result.formatted.length)
  view.dispatch({
    changes: { from: 0, to: original.length, insert: result.formatted },
    selection: { anchor: cursor }
  })
  return { kind: 'changed' }
}
