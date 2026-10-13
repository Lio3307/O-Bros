import type { Dirent } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

export async function readDirectoryIfExists(directoryPath: string): Promise<Dirent[]> {
  try {
    return await readdir(directoryPath, { withFileTypes: true })
  } catch (error) {
    if (isMissingFileError(error)) {
      return []
    }
    throw error
  }
}

export async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    if (isMissingFileError(error)) {
      return null
    }
    throw error
  }
}

export async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  const text = await readTextIfExists(filePath)
  if (text === null) {
    return null
  }
  try {
    return JSON.parse(text) as T
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null
    }
    throw error
  }
}
