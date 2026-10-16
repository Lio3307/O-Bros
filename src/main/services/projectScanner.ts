import { join } from 'node:path'
import { lastPathSegment } from '../../shared/paths'
import type { ProjectFolder, ProjectRoot } from '../../shared/types'
import { loadSettings } from '../settings'
import { readDirectoryIfExists, readTextIfExists } from './fileSystem'

const HEAD_REFERENCE_PREFIX = 'ref: refs/heads/'
const DETACHED_HASH_LENGTH = 7
const HIDDEN_OR_GENERATED_FOLDERS = new Set(['node_modules', 'dist', 'out', 'System Volume Information'])
const SYSTEM_FOLDER_PREFIXES = ['.', '$']

export async function readCurrentBranch(folderPath: string): Promise<string | null> {
  const head = await readTextIfExists(join(folderPath, '.git', 'HEAD'))
  if (head === null) {
    return null
  }
  const trimmed = head.trim()
  return trimmed.startsWith(HEAD_REFERENCE_PREFIX)
    ? trimmed.slice(HEAD_REFERENCE_PREFIX.length)
    : trimmed.slice(0, DETACHED_HASH_LENGTH)
}

export function isVisibleFolder(name: string): boolean {
  return !SYSTEM_FOLDER_PREFIXES.some((prefix) => name.startsWith(prefix)) && !HIDDEN_OR_GENERATED_FOLDERS.has(name)
}

async function describeFolder(parentPath: string, name: string): Promise<ProjectFolder> {
  const path = join(parentPath, name)
  return { name, path, branch: await readCurrentBranch(path) }
}

async function describeRoot(rootPath: string): Promise<ProjectRoot> {
  const entries = await readDirectoryIfExists(rootPath)
  const folderNames = entries
    .filter((entry) => entry.isDirectory() && isVisibleFolder(entry.name))
    .map((entry) => entry.name)

  return {
    name: lastPathSegment(rootPath),
    path: rootPath,
    branch: await readCurrentBranch(rootPath),
    folders: await Promise.all(folderNames.map((name) => describeFolder(rootPath, name)))
  }
}

export async function listProjectRoots(): Promise<ProjectRoot[]> {
  const { projectRoots } = await loadSettings()
  return Promise.all(projectRoots.map(describeRoot))
}
