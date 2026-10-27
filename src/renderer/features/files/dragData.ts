export const DRAGGED_PATH_TYPE = 'application/x-obros-path'

export function droppedPaths(data: DataTransfer): string[] {
  const draggedPath = data.getData(DRAGGED_PATH_TYPE)
  if (draggedPath !== '') {
    return [draggedPath]
  }
  return Array.from(data.files, (file) => window.api.files.pathOf(file)).filter((path) => path !== '')
}
