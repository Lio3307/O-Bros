import { resolve } from 'node:path'
import { isPathInside } from '../shared/paths'
import { loadSettings } from './settings'

export function isInsideDirectory(targetPath: string, directoryPath: string): boolean {
  return isPathInside(resolve(targetPath), resolve(directoryPath))
}

export async function assertInsideProjectRoots(targetPath: string): Promise<void> {
  const { projectRoots } = await loadSettings()
  const isAllowed = projectRoots.some((rootPath) => isInsideDirectory(targetPath, rootPath))
  if (!isAllowed) {
    throw new Error(`Path is outside the opened project folders: ${targetPath}`)
  }
}
