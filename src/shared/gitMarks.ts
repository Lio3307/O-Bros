import { comparablePath, lastPathSegment } from './paths'
import type { FileChangeKind, GitFileChange } from './types'

export interface DeletedEntry {
  name: string
  path: string
}

export interface GitMarks {
  fileKinds: Map<string, FileChangeKind>
  folderKinds: Map<string, FileChangeKind>
  deletedByFolder: Map<string, DeletedEntry[]>
}

const WINDOWS_SEPARATOR = '\\'

const STRENGTH: Record<FileChangeKind, number> = { conflicted: 5, deleted: 4, added: 3, untracked: 3, renamed: 2, modified: 1 }

function strongerOf(current: FileChangeKind | undefined, next: FileChangeKind): FileChangeKind {
  return current === undefined || STRENGTH[next] > STRENGTH[current] ? next : current
}

function joinedPath(root: string, relativePath: string, separator: string): string {
  const parts = relativePath.split('/').filter((part) => part !== '')
  return [root.endsWith(separator) ? root.slice(0, -1) : root, ...parts].join(separator)
}

function parentOf(path: string, separator: string): string {
  return path.slice(0, path.lastIndexOf(separator))
}

export function gitMarksOf(changes: GitFileChange[], root: string, ignoreCase: boolean): GitMarks {
  const separator = root.includes(WINDOWS_SEPARATOR) ? WINDOWS_SEPARATOR : '/'
  const key = (path: string) => comparablePath(path, ignoreCase)
  const marks: GitMarks = { fileKinds: new Map(), folderKinds: new Map(), deletedByFolder: new Map() }
  const rootKey = key(root)

  for (const change of changes) {
    const filePath = joinedPath(root, change.path, separator)
    const fileKey = key(filePath)
    marks.fileKinds.set(fileKey, strongerOf(marks.fileKinds.get(fileKey), change.kind))
    if (change.kind === 'deleted') {
      const folderKey = key(parentOf(filePath, separator))
      const shown = marks.deletedByFolder.get(folderKey) ?? []
      if (!shown.some((entry) => key(entry.path) === fileKey)) {
        marks.deletedByFolder.set(folderKey, [...shown, { name: lastPathSegment(filePath), path: filePath }])
      }
    }
    let folder = parentOf(filePath, separator)
    while (folder.length >= root.length && key(folder) !== rootKey) {
      const folderKey = key(folder)
      marks.folderKinds.set(folderKey, strongerOf(marks.folderKinds.get(folderKey), change.kind))
      folder = parentOf(folder, separator)
    }
  }
  return marks
}
