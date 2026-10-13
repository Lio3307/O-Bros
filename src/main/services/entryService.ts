import { shell } from 'electron'
import { access, mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { findEntryNameProblem } from '../../shared/entryName'
import type { CreateEntryRequest, RenameEntryRequest } from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'
import { loadSettings } from '../settings'

const INVALID_NAME_MESSAGE = 'That name is not allowed.'
const PROJECT_ROOT_MESSAGE = 'A project folder itself cannot be changed here. Remove it from Settings instead.'

function assertValidName(name: string): void {
  if (findEntryNameProblem(name) !== null) {
    throw new Error(INVALID_NAME_MESSAGE)
  }
}

async function assertNotProjectRoot(targetPath: string): Promise<void> {
  const { projectRoots } = await loadSettings()
  if (projectRoots.some((rootPath) => resolve(rootPath) === resolve(targetPath))) {
    throw new Error(PROJECT_ROOT_MESSAGE)
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

function alreadyExistsError(): Error {
  const error: NodeJS.ErrnoException = new Error('EEXIST: that name is already used')
  error.code = 'EEXIST'
  return error
}

export async function createEntry(request: CreateEntryRequest): Promise<string> {
  await assertInsideProjectRoots(request.parentPath)
  assertValidName(request.name)

  const targetPath = join(request.parentPath, request.name)
  if (await pathExists(targetPath)) {
    throw alreadyExistsError()
  }
  if (request.kind === 'folder') {
    await mkdir(targetPath)
  } else {
    await writeFile(targetPath, '', { flag: 'wx' })
  }
  return targetPath
}

export async function renameEntry(request: RenameEntryRequest): Promise<string> {
  await assertInsideProjectRoots(request.path)
  await assertNotProjectRoot(request.path)
  assertValidName(request.newName)

  const targetPath = join(dirname(request.path), request.newName)
  if (await pathExists(targetPath)) {
    throw alreadyExistsError()
  }
  await rename(request.path, targetPath)
  return targetPath
}

export async function moveEntryToTrash(targetPath: string): Promise<void> {
  await assertInsideProjectRoots(targetPath)
  await assertNotProjectRoot(targetPath)
  await shell.trashItem(targetPath)
}
