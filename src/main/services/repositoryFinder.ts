import { join } from 'node:path'
import type { RepositoryEntry } from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'
import { readDirectoryIfExists } from './fileSystem'
import { isVisibleFolder, readCurrentBranch } from './projectScanner'

const MAX_DEPTH = 3
const MAX_REPOSITORIES = 100

async function collectRepositories(
  folderPath: string,
  relativeParts: string[],
  found: RepositoryEntry[]
): Promise<void> {
  if (relativeParts.length >= MAX_DEPTH || found.length >= MAX_REPOSITORIES) {
    return
  }
  const entries = await readDirectoryIfExists(folderPath).catch(() => [])
  const folders = entries.filter((entry) => entry.isDirectory() && isVisibleFolder(entry.name))

  for (const folder of folders) {
    if (found.length >= MAX_REPOSITORIES) {
      return
    }
    const path = join(folderPath, folder.name)
    const parts = [...relativeParts, folder.name]
    const branch = await readCurrentBranch(path)
    if (branch !== null) {
      found.push({ name: folder.name, path, branch, relativePath: parts.join('/') })
    } else {
      await collectRepositories(path, parts, found)
    }
  }
}

export async function findRepositories(folderPath: string): Promise<RepositoryEntry[]> {
  await assertInsideProjectRoots(folderPath)
  const found: RepositoryEntry[] = []
  await collectRepositories(folderPath, [], found)
  return found.sort((first, second) => first.relativePath.localeCompare(second.relativePath))
}
