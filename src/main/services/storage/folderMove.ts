import { cp, lstat, mkdir, readdir, realpath, rename, rm, rmdir, stat, symlink, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { comparablePath, isPathInside } from '../../../shared/paths'
import { IS_PATH_CASE_INSENSITIVE, entryExists } from '../fileSystem'

const STAGING_SUFFIX = '.o-bros-moving'

export interface FolderTotals {
  fileCount: number
  totalBytes: number
}

export class FolderMoveRefusal extends Error {}

export async function isLink(path: string): Promise<boolean> {
  try {
    return (await lstat(path)).isSymbolicLink()
  } catch {
    return false
  }
}

export async function linkTarget(path: string): Promise<string | null> {
  return (await isLink(path)) ? realpath(path).catch(() => null) : null
}

export async function folderTotals(path: string): Promise<FolderTotals> {
  const entries = await readdir(path, { withFileTypes: true })
  const totals = await Promise.all(
    entries.map(async (entry): Promise<FolderTotals> => {
      const entryPath = join(path, entry.name)
      if (entry.isDirectory()) {
        return folderTotals(entryPath)
      }
      return { fileCount: 1, totalBytes: entry.isFile() ? (await stat(entryPath)).size : 0 }
    })
  )
  return totals.reduce(
    (sum, item) => ({ fileCount: sum.fileCount + item.fileCount, totalBytes: sum.totalBytes + item.totalBytes }),
    { fileCount: 0, totalBytes: 0 }
  )
}

function isSameOrInside(childPath: string, parentPath: string): boolean {
  return isPathInside(comparablePath(childPath, IS_PATH_CASE_INSENSITIVE), comparablePath(parentPath, IS_PATH_CASE_INSENSITIVE))
}

async function isMissingOrEmptyFolder(path: string): Promise<boolean> {
  if (!(await entryExists(path))) {
    return true
  }
  return (await stat(path)).isDirectory() && (await readdir(path)).length === 0
}

async function renameOrRefuse(from: string, to: string): Promise<void> {
  try {
    await rename(from, to)
  } catch {
    throw new FolderMoveRefusal(`A program is still using files in ${from}. Close the agent that writes there and try again.`)
  }
}

async function copyAndCheck(from: string, to: string): Promise<void> {
  await mkdir(dirname(to), { recursive: true })
  await cp(from, to, { recursive: true, errorOnExist: true, force: false, preserveTimestamps: true, verbatimSymlinks: true })
  const [expected, copied] = await Promise.all([folderTotals(from), folderTotals(to)])
  if (expected.fileCount !== copied.fileCount || expected.totalBytes !== copied.totalBytes) {
    throw new FolderMoveRefusal(`The copy in ${to} did not match the original, so nothing was moved.`)
  }
}

async function removeLink(path: string): Promise<void> {
  try {
    await unlink(path)
  } catch {
    await rmdir(path)
  }
}

async function linkFolder(linkPath: string, targetPath: string): Promise<void> {
  await symlink(targetPath, linkPath, 'junction')
}

export async function moveFolderAndLink(sourcePath: string, targetPath: string): Promise<void> {
  if (await isLink(sourcePath)) {
    throw new FolderMoveRefusal(`${sourcePath} has already been moved.`)
  }
  if (!(await entryExists(sourcePath)) || !(await stat(sourcePath)).isDirectory()) {
    throw new FolderMoveRefusal(`${sourcePath} does not exist yet, so there is nothing to move.`)
  }
  if (isSameOrInside(targetPath, sourcePath) || isSameOrInside(sourcePath, targetPath)) {
    throw new FolderMoveRefusal('Pick a folder that is not inside the conversations folder, and the other way round.')
  }
  if (!(await isMissingOrEmptyFolder(targetPath))) {
    throw new FolderMoveRefusal(`${targetPath} already has files in it. Pick another folder or empty it first.`)
  }
  const stagingPath = sourcePath + STAGING_SUFFIX
  if (await entryExists(stagingPath)) {
    throw new FolderMoveRefusal(`${stagingPath} is left from an earlier move. Check its files, then delete or rename it.`)
  }

  await renameOrRefuse(sourcePath, stagingPath)
  try {
    await copyAndCheck(stagingPath, targetPath)
    await linkFolder(sourcePath, targetPath)
  } catch (error) {
    await rm(targetPath, { recursive: true, force: true })
    if (!(await entryExists(sourcePath))) {
      await rename(stagingPath, sourcePath)
    }
    throw error
  }
  await rm(stagingPath, { recursive: true, force: true })
}

export async function moveFolderBack(linkPath: string): Promise<void> {
  const targetPath = await linkTarget(linkPath)
  if (targetPath === null) {
    throw new FolderMoveRefusal(`${linkPath} is not a moved folder.`)
  }
  const stagingPath = targetPath + STAGING_SUFFIX
  if (await entryExists(stagingPath)) {
    throw new FolderMoveRefusal(`${stagingPath} is left from an earlier move. Check its files, then delete or rename it.`)
  }

  await renameOrRefuse(targetPath, stagingPath)
  try {
    await removeLink(linkPath)
    await copyAndCheck(stagingPath, linkPath)
  } catch (error) {
    if (!(await isLink(linkPath))) {
      await rm(linkPath, { recursive: true, force: true })
    }
    await rename(stagingPath, targetPath)
    if (!(await isLink(linkPath))) {
      await linkFolder(linkPath, targetPath)
    }
    throw error
  }
  await rm(stagingPath, { recursive: true, force: true })
}
