import { isPathInside, lastPathSegment, relativePathFrom, resolvePath } from './paths'

export interface FolderStep {
  name: string
  path: string
}

export function folderTrail(rootPath: string | null, folderPath: string): FolderStep[] {
  if (rootPath === null || !isPathInside(folderPath, rootPath)) {
    return [{ name: lastPathSegment(folderPath), path: folderPath }]
  }
  const steps: FolderStep[] = [{ name: lastPathSegment(rootPath), path: rootPath }]
  for (const name of relativePathFrom(folderPath, rootPath).split('/').filter((segment) => segment !== '')) {
    steps.push({ name, path: resolvePath(steps[steps.length - 1].path, name) })
  }
  return steps
}
