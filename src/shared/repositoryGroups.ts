import type { RepositoryEntry } from './types'

export type RepositoryListItem =
  | { kind: 'folder'; name: string; repositoryCount: number }
  | { kind: 'repository'; repository: RepositoryEntry }

export function groupRepositoriesByFolder(repositories: RepositoryEntry[]): RepositoryListItem[] {
  const folders = new Map<string, number>()
  const direct: RepositoryListItem[] = []
  for (const repository of repositories) {
    const [firstSegment, ...rest] = repository.relativePath.split('/')
    if (rest.length === 0) {
      direct.push({ kind: 'repository', repository })
    } else {
      folders.set(firstSegment, (folders.get(firstSegment) ?? 0) + 1)
    }
  }
  const folderItems: RepositoryListItem[] = [...folders.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([name, repositoryCount]) => ({ kind: 'folder', name, repositoryCount }))
  return [...folderItems, ...direct]
}
