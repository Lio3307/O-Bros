import { rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readDirectoryIfExists } from '../fileSystem'
import { directorySize } from './directorySize'

export const LINT_TEMP_PREFIX = 'o-bros-lint-'
const MIN_AGE_MS = 60_000

async function isOldEnough(folderPath: string): Promise<boolean> {
  try {
    return Date.now() - (await stat(folderPath)).mtimeMs >= MIN_AGE_MS
  } catch {
    return false
  }
}

async function listLeftoverTempFolders(): Promise<string[]> {
  const entries = await readDirectoryIfExists(tmpdir())
  const folderPaths = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(LINT_TEMP_PREFIX))
    .map((entry) => join(tmpdir(), entry.name))
  const ageChecks = await Promise.all(folderPaths.map(isOldEnough))
  return folderPaths.filter((_folderPath, index) => ageChecks[index])
}

export async function readLeftoverTempFolders(): Promise<{ folderCount: number; totalBytes: number }> {
  const folderPaths = await listLeftoverTempFolders()
  const sizes = await Promise.all(folderPaths.map(directorySize))
  return { folderCount: folderPaths.length, totalBytes: sizes.reduce((total, size) => total + size, 0) }
}

export async function removeLeftoverTempFolders(): Promise<void> {
  const folderPaths = await listLeftoverTempFolders()
  await Promise.all(folderPaths.map((folderPath) => rm(folderPath, { recursive: true, force: true })))
}
