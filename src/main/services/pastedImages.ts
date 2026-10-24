import { app, clipboard } from 'electron'
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const FOLDER_NAME = 'pasted-images'
const IMAGE_TYPE = 'image/png'
const KEEP_FOR_MS = 7 * 24 * 60 * 60 * 1000

async function removeOldImages(folder: string): Promise<void> {
  const oldestKept = Date.now() - KEEP_FOR_MS
  for (const name of await readdir(folder)) {
    const path = join(folder, name)
    if ((await stat(path)).mtimeMs < oldestKept) {
      await rm(path, { force: true })
    }
  }
}

export async function saveClipboardImage(): Promise<string | null> {
  const items = await clipboard.read()
  const item = items.find((candidate) => candidate.types.includes(IMAGE_TYPE))
  if (item === undefined) {
    return null
  }
  const image = await item.getType(IMAGE_TYPE)
  const folder = join(app.getPath('userData'), FOLDER_NAME)
  await mkdir(folder, { recursive: true })
  await removeOldImages(folder).catch(() => undefined)
  const path = join(folder, `image-${Date.now()}.png`)
  await writeFile(path, Buffer.from(await image.arrayBuffer()))
  return path
}
