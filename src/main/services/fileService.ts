import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { imageTypeOf } from '../../shared/imageFiles'
import type { DirectoryEntry, ImageFile, SearchHit, SearchRequest } from '../../shared/types'
import { assertInsideProjectRoots } from '../pathGuard'

const MAX_EDITABLE_BYTES = 2 * 1024 * 1024
const MAX_IMAGE_BYTES = 32 * 1024 * 1024
const MAX_SEARCHABLE_BYTES = 1024 * 1024
const MAX_SEARCH_HITS = 200
const SEARCH_SKIPPED_FOLDERS = new Set(['node_modules', '.git', 'dist', 'out', '.next'])

function foldersFirstThenByName(first: DirectoryEntry, second: DirectoryEntry): number {
  if (first.isDirectory !== second.isDirectory) {
    return first.isDirectory ? -1 : 1
  }
  return first.name.localeCompare(second.name)
}

export async function listDirectory(directoryPath: string): Promise<DirectoryEntry[]> {
  await assertInsideProjectRoots(directoryPath)
  const entries = await readdir(directoryPath, { withFileTypes: true })
  return entries
    .map((entry) => ({
      name: entry.name,
      path: join(directoryPath, entry.name),
      isDirectory: entry.isDirectory()
    }))
    .sort(foldersFirstThenByName)
}

export async function readTextFile(filePath: string): Promise<string> {
  await assertInsideProjectRoots(filePath)
  const { size } = await stat(filePath)
  if (size > MAX_EDITABLE_BYTES) {
    throw new Error('This file is larger than 2 MB and was not opened.')
  }
  return readFile(filePath, 'utf8')
}

export async function readImageFile(filePath: string): Promise<ImageFile> {
  await assertInsideProjectRoots(filePath)
  const type = imageTypeOf(filePath)
  if (type === null) {
    throw new Error('This file is not an image.')
  }
  const { size } = await stat(filePath)
  if (size > MAX_IMAGE_BYTES) {
    throw new Error('This image is larger than 32 MB and was not opened.')
  }
  const bytes = await readFile(filePath)
  return { dataUrl: `data:${type};base64,${bytes.toString('base64')}`, size }
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await assertInsideProjectRoots(filePath)
  await writeFile(filePath, content, 'utf8')
}

async function fileContainsText(filePath: string, lowerCaseQuery: string): Promise<boolean> {
  const { size } = await stat(filePath)
  if (size > MAX_SEARCHABLE_BYTES) {
    return false
  }
  const content = await readFile(filePath, 'utf8')
  return content.toLowerCase().includes(lowerCaseQuery)
}

export async function searchFiles(request: SearchRequest): Promise<SearchHit[]> {
  await assertInsideProjectRoots(request.root)
  const lowerCaseQuery = request.query.toLowerCase()
  const hits: SearchHit[] = []
  const pendingDirectories = [request.root]

  while (pendingDirectories.length > 0 && hits.length < MAX_SEARCH_HITS) {
    const directoryPath = pendingDirectories.shift() as string
    const entries = await readdir(directoryPath, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = join(directoryPath, entry.name)
      if (entry.isDirectory()) {
        if (!SEARCH_SKIPPED_FOLDERS.has(entry.name)) {
          pendingDirectories.push(entryPath)
        }
        continue
      }
      const isMatch =
        request.mode === 'names'
          ? entry.name.toLowerCase().includes(lowerCaseQuery)
          : await fileContainsText(entryPath, lowerCaseQuery)
      if (isMatch) {
        hits.push({ name: entry.name, path: entryPath })
      }
    }
  }

  return hits.slice(0, MAX_SEARCH_HITS)
}
