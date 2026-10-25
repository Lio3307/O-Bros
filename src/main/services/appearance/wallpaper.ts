import { app, dialog, type BrowserWindow } from 'electron'
import { copyFile, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { imageExtensions, imageTypeOf } from '../../../shared/imageFiles'

const FOLDER_NAME = 'wallpaper'
const FILE_BASE_NAME = 'current'
const MAX_WALLPAPER_BYTES = 20 * 1024 * 1024

function wallpaperFolder(): string {
  return join(app.getPath('userData'), FOLDER_NAME)
}

async function savedWallpaperPath(): Promise<string | null> {
  const names = await readdir(wallpaperFolder()).catch(() => [])
  const name = names.find((candidate) => imageTypeOf(candidate) !== null)
  return name === undefined ? null : join(wallpaperFolder(), name)
}

async function asDataUrl(filePath: string): Promise<string> {
  const bytes = await readFile(filePath)
  return `data:${imageTypeOf(filePath)};base64,${bytes.toString('base64')}`
}

export async function loadWallpaper(): Promise<string | null> {
  const filePath = await savedWallpaperPath()
  return filePath === null ? null : asDataUrl(filePath)
}

export async function chooseWallpaper(window: BrowserWindow | null): Promise<string | null> {
  const options = { title: 'Choose a wallpaper', properties: ['openFile' as const], filters: [{ name: 'Images', extensions: imageExtensions() }] }
  const choice = window === null ? await dialog.showOpenDialog(options) : await dialog.showOpenDialog(window, options)
  const [chosenPath] = choice.filePaths
  if (choice.canceled || chosenPath === undefined) {
    return null
  }
  if (imageTypeOf(chosenPath) === null) {
    throw new Error('That file is not an image O-BROS can show.')
  }
  if ((await stat(chosenPath)).size > MAX_WALLPAPER_BYTES) {
    throw new Error('That image is larger than 20 MB. Pick a smaller one.')
  }
  await rm(wallpaperFolder(), { recursive: true, force: true })
  await mkdir(wallpaperFolder(), { recursive: true })
  const savedPath = join(wallpaperFolder(), `${FILE_BASE_NAME}${extname(chosenPath).toLowerCase()}`)
  await copyFile(chosenPath, savedPath)
  return asDataUrl(savedPath)
}

export async function removeWallpaper(): Promise<void> {
  await rm(wallpaperFolder(), { recursive: true, force: true })
}

export function showDesktopBehind(window: BrowserWindow, isSeeThrough: boolean): void {
  if (process.platform !== 'win32') {
    return
  }
  window.setBackgroundColor(isSeeThrough ? '#00000000' : '#000000')
  window.setBackgroundMaterial(isSeeThrough ? 'acrylic' : 'none')
}
