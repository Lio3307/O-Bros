export const MAX_RECENT_FILES = 12

export function pushRecentFile(recentPaths: string[], filePath: string, maxCount: number = MAX_RECENT_FILES): string[] {
  return [filePath, ...recentPaths.filter((path) => path !== filePath)].slice(0, maxCount)
}

export function parseRecentFiles(rawText: string | null): string[] {
  if (rawText === null) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(rawText)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}
