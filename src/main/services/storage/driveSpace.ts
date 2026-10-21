import { realpath, statfs } from 'node:fs/promises'
import { dirname, parse } from 'node:path'
import type { DriveSpace } from '../../../shared/types'

async function nearestExistingPath(path: string): Promise<string> {
  let current = path
  while (true) {
    try {
      return await realpath(current)
    } catch {
      const parent = dirname(current)
      if (parent === current) {
        return current
      }
      current = parent
    }
  }
}

export async function driveOf(path: string): Promise<DriveSpace | null> {
  try {
    const existing = await nearestExistingPath(path)
    const root = parse(existing).root
    const info = await statfs(root)
    return { root, freeBytes: info.bavail * info.bsize, totalBytes: info.blocks * info.bsize }
  } catch {
    return null
  }
}
