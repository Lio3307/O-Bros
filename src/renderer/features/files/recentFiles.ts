export const MAX_RECENT_FILES = 12

export function pushRecentFile(recentPaths: string[], filePath: string, maxCount: number = MAX_RECENT_FILES): string[] {
  return [filePath, ...recentPaths.filter((path) => path !== filePath)].slice(0, maxCount)
}
