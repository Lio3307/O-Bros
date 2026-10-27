export function pathsBetween(shownPaths: string[], anchor: string, target: string): string[] {
  const start = shownPaths.indexOf(anchor)
  const end = shownPaths.indexOf(target)
  if (start === -1 || end === -1) {
    return [target]
  }
  return shownPaths.slice(Math.min(start, end), Math.max(start, end) + 1)
}

export function togglePath(paths: string[], path: string): string[] {
  return paths.includes(path) ? paths.filter((picked) => picked !== path) : [...paths, path]
}

export function draggedPathsFor(picked: string[], path: string): string[] {
  return picked.includes(path) ? picked : [path]
}
