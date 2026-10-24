import { Annotation } from '@codemirror/state'
import type { EditorView, ViewUpdate } from '@codemirror/view'
import { changeBetween } from './diskChange'

const fromDisk = Annotation.define<boolean>()

export function isFromDisk(update: ViewUpdate): boolean {
  return update.transactions.some((transaction) => transaction.annotation(fromDisk) === true)
}

export function showDiskText(view: EditorView, text: string): void {
  const change = changeBetween(view.state.doc.toString(), text)
  if (change !== null) {
    view.dispatch({ changes: change, annotations: fromDisk.of(true) })
  }
}

export function followDiskChanges(filePath: string, onChange: () => void): () => void {
  const isWatching = window.api.files.watch(filePath).then(
    () => true,
    () => false
  )
  const stopListening = window.api.files.onChanged((changedPath) => {
    if (changedPath === filePath) {
      onChange()
    }
  })
  return () => {
    stopListening()
    void isWatching.then((watching) => (watching ? window.api.files.unwatch(filePath) : undefined))
  }
}
