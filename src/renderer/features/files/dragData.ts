export const DRAGGED_PATH_TYPE = 'application/x-obros-path'

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item !== '')
}

function treePathsOf(data: DataTransfer): string[] {
  try {
    const parsed: unknown = JSON.parse(data.getData(DRAGGED_PATH_TYPE))
    return isStringList(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function setDraggedPaths(data: DataTransfer, paths: string[]): void {
  data.setData(DRAGGED_PATH_TYPE, JSON.stringify(paths))
  data.effectAllowed = 'copy'
}

export function droppedPaths(data: DataTransfer): string[] {
  if (data.types.includes(DRAGGED_PATH_TYPE)) {
    return treePathsOf(data)
  }
  return Array.from(data.files, (file) => window.api.files.pathOf(file)).filter((path) => path !== '')
}

export function acceptsDroppedPaths(data: DataTransfer): boolean {
  return data.types.includes(DRAGGED_PATH_TYPE) || data.types.includes('Files')
}
