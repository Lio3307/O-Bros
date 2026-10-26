import { app } from 'electron'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { colorFromRegistry, DEFAULT_DESKTOP_COLOR, wallpaperFitOf, type DesktopWallpaper } from '../../../shared/desktopWallpaper'
import { imageTypeOfBytes } from '../../../shared/imageFiles'
import { readRegistryKey } from '../registry'

const DESKTOP_KEY = 'HKCU\\Control Panel\\Desktop'
const COLORS_KEY = 'HKCU\\Control Panel\\Colors'
const MAX_WALLPAPER_BYTES = 40 * 1024 * 1024
const NO_WALLPAPER: DesktopWallpaper = { imageUrl: null, fit: 'fill', color: DEFAULT_DESKTOP_COLOR, version: 'none' }

let lastWallpaper: DesktopWallpaper = NO_WALLPAPER

function windowsCopyOfWallpaper(): string {
  return join(app.getPath('appData'), 'Microsoft', 'Windows', 'Themes', 'TranscodedWallpaper')
}

async function imageVersionOf(filePath: string): Promise<string | null> {
  const info = await stat(filePath).catch(() => null)
  if (info === null || !info.isFile() || info.size === 0 || info.size > MAX_WALLPAPER_BYTES) {
    return null
  }
  return `${filePath}|${info.mtimeMs}|${info.size}`
}

async function readImageUrl(filePath: string): Promise<string | null> {
  const content = await readFile(filePath).catch(() => null)
  const type = content === null ? null : imageTypeOfBytes(content)
  return content === null || type === null ? null : `data:${type};base64,${content.toString('base64')}`
}

async function wallpaperFrom(candidates: string[], fit: DesktopWallpaper['fit'], color: string): Promise<DesktopWallpaper> {
  for (const candidate of candidates) {
    const imageVersion = await imageVersionOf(candidate)
    if (imageVersion === null) {
      continue
    }
    const version = `${imageVersion}|${fit}|${color}`
    if (version === lastWallpaper.version) {
      return lastWallpaper
    }
    const imageUrl = await readImageUrl(candidate)
    if (imageUrl !== null) {
      return { imageUrl, fit, color, version }
    }
  }
  return { imageUrl: null, fit, color, version: `color|${color}` }
}

export async function readDesktopWallpaper(): Promise<DesktopWallpaper> {
  if (process.platform !== 'win32') {
    return NO_WALLPAPER
  }
  const [desktop, colors] = await Promise.all([readRegistryKey(DESKTOP_KEY), readRegistryKey(COLORS_KEY)])
  const color = colorFromRegistry(colors.background)
  const fit = wallpaperFitOf(desktop.wallpaperstyle, desktop.tilewallpaper)
  const chosenPath = desktop.wallpaper ?? ''
  const candidates = chosenPath === '' ? [] : [windowsCopyOfWallpaper(), chosenPath]
  lastWallpaper = await wallpaperFrom(candidates, fit, color)
  return lastWallpaper
}
