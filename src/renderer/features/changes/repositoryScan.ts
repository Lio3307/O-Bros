import type { RepositoryEntry } from '../../../shared/types'

export function parentFolderHint(repository: Pick<RepositoryEntry, 'name' | 'relativePath'>): string | undefined {
  const parentLength = repository.relativePath.length - repository.name.length - 1
  return parentLength > 0 ? repository.relativePath.slice(0, parentLength) : undefined
}

const finishedScans = new Map<string, RepositoryEntry[]>()
const runningScans = new Map<string, Promise<RepositoryEntry[]>>()

export function scanRepositories(folderPath: string): Promise<RepositoryEntry[]> {
  const running = runningScans.get(folderPath)
  if (running !== undefined) {
    return running
  }
  const result = window.api.projects
    .repositories(folderPath)
    .catch(() => [])
    .then((found) => {
      finishedScans.set(folderPath, found)
      return found
    })
    .finally(() => runningScans.delete(folderPath))
  runningScans.set(folderPath, result)
  return result
}

export function rescanRepositories(folderPaths: string[]): void {
  folderPaths.forEach(scanRepositories)
}

export async function repositoriesIn(folderPath: string): Promise<RepositoryEntry[]> {
  return finishedScans.get(folderPath) ?? scanRepositories(folderPath)
}
