import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { isPathInside, lastPathSegment, relativePathFrom } from '../../../shared/paths'
import type { EntryKind } from '../../../shared/types'
import { useFileTreeStore } from '../../state/fileTreeStore'
import { openTerminalIn } from '../../state/openTerminal'
import { useProjectsStore } from '../../state/projectsStore'
import { toast } from '../../state/toastStore'
import { useWorkspaceStore } from '../../state/workspaceStore'

function unsavedTitlesInside(path: string): string[] {
  return useWorkspaceStore
    .getState()
    .tabs.filter((tab) => tab.kind === 'file' && tab.isModified && isPathInside(tab.path, path))
    .map((tab) => tab.title)
}

function warnAboutUnsavedFiles(path: string, action: string): boolean {
  const titles = unsavedTitlesInside(path)
  if (titles.length === 0) {
    return false
  }
  toast.warning(`Save or close ${titles.join(', ')} before you ${action}.`)
  return true
}

export async function createEntry(parentPath: string, name: string, kind: EntryKind): Promise<boolean> {
  try {
    const createdPath = await window.api.files.create({ parentPath, name, kind })
    useFileTreeStore.getState().refresh()
    toast.success(`Created "${name}".`)
    if (kind === 'file') {
      useWorkspaceStore.getState().openFileTab(createdPath)
    }
    return true
  } catch (error) {
    toast.error(friendlyErrorMessage(error, `Could not create "${name}".`))
    return false
  }
}

export async function renameEntry(path: string, newName: string): Promise<boolean> {
  if (warnAboutUnsavedFiles(path, 'rename it')) {
    return false
  }
  try {
    await window.api.files.rename({ path, newName })
    useWorkspaceStore.getState().closeFileTabsInside(path)
    useFileTreeStore.getState().refresh()
    toast.success(`Renamed to "${newName}".`)
    return true
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not rename it.'))
    return false
  }
}

export async function deleteEntry(path: string): Promise<boolean> {
  if (warnAboutUnsavedFiles(path, 'delete it')) {
    return false
  }
  try {
    await window.api.files.trash(path)
    useWorkspaceStore.getState().closeFileTabsInside(path)
    useFileTreeStore.getState().refresh()
    toast.success(`Moved "${lastPathSegment(path)}" to the Recycle Bin or Trash.`)
    return true
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not delete it.'))
    return false
  }
}

async function copyText(text: string, successMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
  } catch {
    toast.error('Could not copy to the clipboard.')
  }
}

export function copyPath(path: string): Promise<void> {
  return copyText(path, 'Path copied.')
}

export function copyRelativePath(path: string): Promise<void> {
  const { roots } = useProjectsStore.getState()
  const root = roots.find((candidate) => isPathInside(path, candidate.path))
  const text = root === undefined ? path : relativePathFrom(path, root.path)
  return copyText(text, 'Relative path copied.')
}

export async function revealInFileExplorer(path: string): Promise<void> {
  try {
    await window.api.shell.reveal(path)
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not show it in the file explorer.'))
  }
}

export function openFolderInTerminal(folderPath: string): void {
  openTerminalIn(folderPath)
}
