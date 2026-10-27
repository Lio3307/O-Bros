import { execFile } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { DEFAULT_DESKTOP_COLOR, type WallpaperFit } from '../../../shared/desktopWallpaper'
import { gnomeColorOf, gnomeFitOf, gsettingsText, kdeWallpaperOf, largestPackageImage } from '../../../shared/linuxWallpaper'
import { isFolder, readTextIfExists } from '../fileSystem'

export interface WallpaperSetting {
  candidates: string[]
  fit: WallpaperFit
  color: string
}

const execFileAsync = promisify(execFile)
const GSETTINGS_TIMEOUT_MS = 3000
const FILE_URL_PREFIX = 'file://'
const KDE_CONFIG_PATH = join(homedir(), '.config', 'plasma-org.kde.plasma.desktop-appletsrc')

function pathOf(location: string): string | null {
  if (location.startsWith(FILE_URL_PREFIX)) {
    return fileURLToPath(location)
  }
  return location.startsWith('/') ? location : null
}

async function gsetting(schema: string, key: string): Promise<string> {
  const { stdout } = await execFileAsync('gsettings', ['get', schema, key], { timeout: GSETTINGS_TIMEOUT_MS })
  return gsettingsText(stdout)
}

async function readGnomeWallpaper(): Promise<WallpaperSetting | null> {
  try {
    const background = 'org.gnome.desktop.background'
    const [lightUri, darkUri, option, color, scheme] = await Promise.all([
      gsetting(background, 'picture-uri'),
      gsetting(background, 'picture-uri-dark').catch(() => ''),
      gsetting(background, 'picture-options'),
      gsetting(background, 'primary-color'),
      gsetting('org.gnome.desktop.interface', 'color-scheme').catch(() => '')
    ])
    const uri = scheme === 'prefer-dark' && darkUri !== '' ? darkUri : lightUri
    const fit = gnomeFitOf(option)
    const path = fit === null ? null : pathOf(uri)
    return { candidates: path === null ? [] : [path], fit: fit ?? 'fill', color: gnomeColorOf(color) }
  } catch {
    return null
  }
}

async function packageImageOf(folder: string): Promise<string | null> {
  const imagesFolder = join(folder, 'contents', 'images')
  const names = await readdir(imagesFolder).catch(() => [])
  const largest = largestPackageImage(names)
  return largest === null ? null : join(imagesFolder, largest)
}

async function readKdeWallpaper(): Promise<WallpaperSetting | null> {
  const configText = await readTextIfExists(KDE_CONFIG_PATH).catch(() => null)
  const wallpaper = configText === null ? null : kdeWallpaperOf(configText)
  if (wallpaper === null) {
    return configText === null ? null : { candidates: [], fit: 'fill', color: DEFAULT_DESKTOP_COLOR }
  }
  const path = wallpaper.image === null ? null : pathOf(wallpaper.image)
  const image = path !== null && (await isFolder(path)) ? await packageImageOf(path) : path
  return { candidates: image === null ? [] : [image], fit: wallpaper.fit, color: wallpaper.color }
}

export async function readLinuxWallpaper(): Promise<WallpaperSetting | null> {
  const desktop = (process.env.XDG_CURRENT_DESKTOP ?? '').toUpperCase()
  if (desktop.includes('KDE')) {
    return readKdeWallpaper()
  }
  return readGnomeWallpaper()
}
