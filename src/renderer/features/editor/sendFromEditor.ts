import type { EditorView } from '@codemirror/view'
import { sendCodeToAgent } from '../prompts/sendToAgent'

export function sendEditorContentToAgent(view: EditorView, filePath: string, wholeFile: boolean): void {
  const { state } = view
  const selection = state.selection.main
  if (wholeFile || selection.empty) {
    void sendCodeToAgent({ path: filePath, code: state.doc.toString() })
    return
  }
  void sendCodeToAgent({
    path: filePath,
    code: state.sliceDoc(selection.from, selection.to),
    startLine: state.doc.lineAt(selection.from).number,
    endLine: state.doc.lineAt(selection.to).number
  })
}

export function hasSelection(view: EditorView): boolean {
  return !view.state.selection.main.empty
}
