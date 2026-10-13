import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { readDirectoryIfExists } from '../fileSystem'

async function fileSizeOrZero(filePath: string): Promise<number> {
  try {
    return (await stat(filePath)).size
  } catch {
    return 0
  }
}

export async function directorySize(directoryPath: string): Promise<number> {
  const entries = await readDirectoryIfExists(directoryPath)
  const sizes = await Promise.all(
    entries.map((entry) => {
      const entryPath = join(directoryPath, entry.name)
      return entry.isDirectory() ? directorySize(entryPath) : fileSizeOrZero(entryPath)
    })
  )
  return sizes.reduce((total, size) => total + size, 0)
}
