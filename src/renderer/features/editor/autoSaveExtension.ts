import type { Extension } from '@codemirror/state'
import { ViewPlugin, type EditorView, type ViewUpdate } from '@codemirror/view'
import { useEditorSettingsStore } from '../../state/editorSettingsStore'

export function autoSaveExtension(save: (view: EditorView) => void): Extension {
  return ViewPlugin.fromClass(
    class {
      private timer: ReturnType<typeof setTimeout> | null = null

      constructor(private readonly view: EditorView) {}

      update(update: ViewUpdate): void {
        if (!update.docChanged) {
          return
        }
        const { autoSaveEnabled, autoSaveDelayMs } = useEditorSettingsStore.getState()
        this.cancel()
        if (autoSaveEnabled) {
          this.timer = setTimeout(() => {
            this.timer = null
            save(this.view)
          }, autoSaveDelayMs)
        }
      }

      destroy(): void {
        if (this.timer !== null) {
          this.cancel()
          save(this.view)
        }
      }

      private cancel(): void {
        if (this.timer !== null) {
          clearTimeout(this.timer)
          this.timer = null
        }
      }
    }
  )
}
