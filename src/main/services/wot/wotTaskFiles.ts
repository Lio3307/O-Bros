import { readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { directorySize } from '../storage/directorySize'

export const WOT_TASK_FOLDER = join(tmpdir(), 'o-bros-wot')

export async function readTaskFiles(): Promise<{ fileCount: number; totalBytes: number }> {
  try {
    const entries = await readdir(WOT_TASK_FOLDER)
    return { fileCount: entries.length, totalBytes: await directorySize(WOT_TASK_FOLDER) }
  } catch {
    return { fileCount: 0, totalBytes: 0 }
  }
}

export async function removeTaskFiles(): Promise<void> {
  await rm(WOT_TASK_FOLDER, { recursive: true, force: true })
}
