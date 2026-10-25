import { readdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { extname, join } from 'node:path'
import type { ThemeFile, WarpThemeFiles } from '../../../shared/themeImport'
import { isFolder } from '../fileSystem'

const THEME_EXTENSIONS = ['.yaml', '.yml']
const MAX_DEPTH = 3
const MAX_FILES = 300
const MAX_FILE_BYTES = 64 * 1024

function warpThemeFolders(): string[] {
  const home = homedir()
  const localAppData = process.env.LOCALAPPDATA ?? join(home, 'AppData', 'Local')
  const dataHome = process.env.XDG_DATA_HOME ?? join(home, '.local', 'share')
  const byPlatform: Record<string, string[]> = {
    win32: [join(localAppData, 'warp', 'Warp', 'data', 'themes')],
    linux: [join(dataHome, 'warp-terminal', 'themes')]
  }
  return [join(home, '.warp', 'themes'), ...(byPlatform[process.platform] ?? [])]
}

async function themeFilesIn(folder: string, depth: number, found: string[]): Promise<void> {
  const entries = await readdir(folder, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (found.length >= MAX_FILES) {
      return
    }
    const entryPath = join(folder, entry.name)
    if (entry.isDirectory() && depth < MAX_DEPTH) {
      await themeFilesIn(entryPath, depth + 1, found)
    } else if (entry.isFile() && THEME_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
      found.push(entryPath)
    }
  }
}

async function readThemeFile(filePath: string): Promise<ThemeFile | null> {
  const info = await stat(filePath).catch(() => null)
  if (info === null || info.size > MAX_FILE_BYTES) {
    return null
  }
  const content = await readFile(filePath, 'utf8').catch(() => null)
  return content === null ? null : { name: filePath, content }
}

export async function readWarpThemes(): Promise<WarpThemeFiles> {
  const folders: string[] = []
  for (const folder of warpThemeFolders()) {
    if (await isFolder(folder)) {
      folders.push(folder)
    }
  }
  const paths: string[] = []
  for (const folder of folders) {
    await themeFilesIn(folder, 1, paths)
  }
  const files = await Promise.all(paths.map(readThemeFile))
  return { searched: warpThemeFolders(), folders, files: files.filter((file) => file !== null) }
}
