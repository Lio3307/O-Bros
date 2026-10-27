import { EditorView } from '@codemirror/view'
import { droppedPaths } from '../files/dragData'
import { openFileReference } from '../terminal/openFileReference'

export const openDroppedFiles = EditorView.domEventHandlers({
  drop: (event) => {
    const paths = event.dataTransfer === null ? [] : droppedPaths(event.dataTransfer)
    if (paths.length === 0) {
      return false
    }
    event.preventDefault()
    for (const path of paths) {
      void openFileReference({ path, line: 1, column: 1 }, null)
    }
    return true
  }
})
