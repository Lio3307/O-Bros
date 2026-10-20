import type { RepositoryEntry } from '../../../shared/types'

const scans = new Map<string, Promise<RepositoryEntry[]>>()

export function scanRepositories(folderPath: string): Promise<RepositoryEntry[]> {
  const result = window.api.projects.repositories(folderPath).catch(() => [])
  scans.set(folderPath, result)
  return result
}

export function rescanRepositories(folderPaths: string[]): void {
  folderPaths.forEach(scanRepositories)
}

export function repositoriesIn(folderPath: string): Promise<RepositoryEntry[]> {
  return scans.get(folderPath) ?? scanRepositories(folderPath)
}
