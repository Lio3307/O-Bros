export const REPOSITORY_SEARCH_DEPTHS = [1, 2, 3, 4, 5, 6]
export const DEFAULT_REPOSITORY_SEARCH_DEPTH = 3

export function repositorySearchDepthOf(value: unknown): number {
  return typeof value === 'number' && REPOSITORY_SEARCH_DEPTHS.includes(value) ? value : DEFAULT_REPOSITORY_SEARCH_DEPTH
}
