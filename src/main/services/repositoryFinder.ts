import { join } from 'node:path'
import { DEFAULT_REPOSITORY_SEARCH_DEPTH } from '../../shared/repositorySearch'
import type { RepositoryEntry } from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'
import { readDirectoryIfExists } from './fileSystem'
import { isVisibleFolder, readCurrentBranch } from './projectScanner'

const MAX_REPOSITORIES = 100
const SEARCH_TIME_LIMIT_MS = 20_000

interface SearchLimits {
  depth: number
  stopAt: number
}

function isOverLimit(found: RepositoryEntry[], limits: SearchLimits): boolean {
  return found.length >= MAX_REPOSITORIES || Date.now() > limits.stopAt
}

async function collectRepositories(
  folderPath: string,
  relativeParts: string[],
  found: RepositoryEntry[],
  limits: SearchLimits
): Promise<void> {
  if (relativeParts.length >= limits.depth || isOverLimit(found, limits)) {
    return
  }
  const entries = await readDirectoryIfExists(folderPath).catch(() => [])
  const folders = entries.filter((entry) => entry.isDirectory() && isVisibleFolder(entry.name))

  for (const folder of folders) {
    if (isOverLimit(found, limits)) {
      return
    }
    const path = join(folderPath, folder.name)
    const parts = [...relativeParts, folder.name]
    const branch = await readCurrentBranch(path)
    if (branch !== null) {
      found.push({ name: folder.name, path, branch, relativePath: parts.join('/') })
    } else {
      await collectRepositories(path, parts, found, limits)
    }
  }
}

export async function findRepositories(folderPath: string, depth: number = DEFAULT_REPOSITORY_SEARCH_DEPTH): Promise<RepositoryEntry[]> {
  await assertInsideProjectRoots(folderPath)
  const found: RepositoryEntry[] = []
  await collectRepositories(folderPath, [], found, { depth, stopAt: Date.now() + SEARCH_TIME_LIMIT_MS })
  return found.sort((first, second) => first.relativePath.localeCompare(second.relativePath))
}
