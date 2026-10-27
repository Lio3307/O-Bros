import { DEFAULT_DESKTOP_COLOR, type WallpaperFit } from './desktopWallpaper'
import { normalizeHexColor } from './hexColor'

export interface KdeWallpaper {
  image: string | null
  fit: WallpaperFit
  color: string
}

const GNOME_FITS: Record<string, WallpaperFit> = {
  wallpaper: 'tile',
  centered: 'center',
  scaled: 'fit',
  stretched: 'stretch',
  zoom: 'fill',
  spanned: 'span'
}
const KDE_FITS: Record<string, WallpaperFit> = { '0': 'stretch', '1': 'fit', '2': 'fill', '3': 'tile', '4': 'tile', '5': 'tile', '6': 'center' }
const KDE_IMAGE_SECTION_END = '[Wallpaper][org.kde.image][General]'
const RGB_PART_COUNT = 3
const MAX_RGB_PART = 255

export function gsettingsText(output: string): string {
  const text = output.trim()
  const isQuoted = text.length >= 2 && (text.startsWith("'") || text.startsWith('"')) && text.endsWith(text[0])
  return isQuoted ? text.slice(1, -1) : text
}

export function gnomeFitOf(option: string): WallpaperFit | null {
  return GNOME_FITS[option] ?? null
}

export function gnomeColorOf(value: string): string {
  return normalizeHexColor(value) ?? DEFAULT_DESKTOP_COLOR
}

function rgbColorOf(value: string): string {
  const parts = value.split(',').map((part) => Number(part.trim()))
  const isColor = parts.length === RGB_PART_COUNT && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= MAX_RGB_PART)
  return isColor ? `#${parts.map((part) => part.toString(16).padStart(2, '0')).join('')}` : DEFAULT_DESKTOP_COLOR
}

function imageSectionValues(configText: string): Map<string, string> | null {
  let values: Map<string, string> | null = null
  for (const rawLine of configText.split('\n')) {
    const line = rawLine.trim()
    if (line.startsWith('[')) {
      if (values !== null && values.has('Image')) {
        return values
      }
      values = line.endsWith(KDE_IMAGE_SECTION_END) ? new Map() : null
      continue
    }
    const separator = line.indexOf('=')
    if (values !== null && separator > 0) {
      values.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim())
    }
  }
  return values
}

export function kdeWallpaperOf(configText: string): KdeWallpaper | null {
  const values = imageSectionValues(configText)
  if (values === null) {
    return null
  }
  const image = values.get('Image') ?? ''
  return {
    image: image === '' ? null : image,
    fit: KDE_FITS[values.get('FillMode') ?? '2'] ?? 'fill',
    color: rgbColorOf(values.get('Color') ?? '')
  }
}

function pixelCountOf(fileName: string): number {
  const [width, height] = fileName.split('.')[0].split('x').map(Number)
  return Number.isFinite(width) && Number.isFinite(height) ? width * height : 0
}

export function largestPackageImage(fileNames: string[]): string | null {
  const sized = fileNames.filter((name) => pixelCountOf(name) > 0)
  if (sized.length === 0) {
    return fileNames[0] ?? null
  }
  return sized.reduce((largest, name) => (pixelCountOf(name) > pixelCountOf(largest) ? name : largest))
}
