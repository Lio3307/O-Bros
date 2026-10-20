import { forceLinting, linter, type Diagnostic } from '@codemirror/lint'
import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { isPathInside } from '../../../shared/paths'
import { useEditorSettingsStore } from '../../state/editorSettingsStore'
import { useProjectsStore } from '../../state/projectsStore'
import { lastToolDiagnostics, sharedLintGutter, withToolDiagnostics } from './diagnosticsBoard'
import { toEditorDiagnostics, toolFailureDiagnostic } from './lintDiagnostics'

const AS_YOU_TYPE_DELAY_MS = 800
const viewsWaitingForSaveLint = new WeakSet<EditorView>()

function projectRootFor(filePath: string): string | null {
  const root = useProjectsStore.getState().roots.find((candidate) => isPathInside(filePath, candidate.path))
  return root?.path ?? null
}

async function runLint(view: EditorView, filePath: string): Promise<Diagnostic[]> {
  const result = await window.api.tools.lint({
    filePath,
    content: view.state.doc.toString(),
    rootPath: projectRootFor(filePath)
  })
  if (result.errorMessage !== null) {
    return [toolFailureDiagnostic()]
  }
  return toEditorDiagnostics(view.state.doc, result.diagnostics)
}

export function lintExtensionFor(filePath: string): Extension {
  const source = async (view: EditorView): Promise<Diagnostic[]> => {
    const { lintMode } = useEditorSettingsStore.getState()
    if (lintMode === 'off') {
      return withToolDiagnostics(view, filePath, [])
    }
    const isSaveRequest = viewsWaitingForSaveLint.delete(view)
    if (lintMode === 'on-save' && !isSaveRequest) {
      return withToolDiagnostics(view, filePath, lastToolDiagnostics(view))
    }
    return withToolDiagnostics(view, filePath, await runLint(view, filePath))
  }

  return [linter(source, { delay: AS_YOU_TYPE_DELAY_MS }), sharedLintGutter]
}

export function lintNow(view: EditorView): void {
  viewsWaitingForSaveLint.add(view)
  forceLinting(view)
}
