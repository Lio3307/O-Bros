import type { FileReference } from '../../../shared/fileReference'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { comparablePath, isAbsolutePath, lastPathSegment, parentPath, resolvePath } from '../../../shared/paths'
import { useEditorNavigationStore } from '../../state/editorNavigationStore'
import { toast } from '../../state/toastStore'

type FileLocation = Pick<FileReference, 'path' | 'line' | 'column'>

function absolutePathOf(reference: FileLocation, cwd: string | null): string | null {
  if (isAbsolutePath(reference.path)) {
    return reference.path
  }
  return cwd === null ? null : resolvePath(cwd, reference.path)
}

export async function openFileReference(reference: FileLocation, cwd: string | null): Promise<void> {
  const filePath = absolutePathOf(reference, cwd)
  if (filePath === null) {
    toast.warning('This terminal has no folder, so the path cannot be resolved.')
    return
  }

  try {
    const entries = await window.api.files.list(parentPath(filePath))
    const wanted = comparablePath(filePath, true)
    const match = entries.find((entry) => comparablePath(entry.path, true) === wanted)
    if (match === undefined) {
      toast.warning(`Could not find ${lastPathSegment(filePath)}.`)
      return
    }
    if (match.isDirectory) {
      toast.warning(`${match.name} is a folder, so it cannot open in the editor.`)
      return
    }
    useEditorNavigationStore.getState().goTo({ path: match.path, line: reference.line, column: reference.column })
  } catch (error) {
    const isMissing = error instanceof Error && error.message.includes('ENOENT')
    const fileName = lastPathSegment(filePath)
    toast.warning(isMissing ? `Could not find ${fileName}.` : friendlyErrorMessage(error, `Could not open ${fileName}.`))
  }
}
