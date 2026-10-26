export type WallpaperFit = 'fill' | 'fit' | 'stretch' | 'tile' | 'center' | 'span'

export interface DesktopWallpaper {
  imageUrl: string | null
  fit: WallpaperFit
  color: string
  version: string
}

export interface DesktopPlacement {
  left: number
  top: number
  width: number
  height: number
}

export interface DesktopView {
  wallpaper: DesktopWallpaper
  placement: DesktopPlacement
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

const FIT_BY_STYLE: Record<string, WallpaperFit> = { '0': 'center', '2': 'stretch', '6': 'fit', '10': 'fill', '22': 'span' }
const TILED = '1'
const COLOR_PART_COUNT = 3
const MAX_COLOR_PART = 255
export const DEFAULT_DESKTOP_COLOR = '#000000'

export function wallpaperFitOf(style: string | undefined, tile: string | undefined): WallpaperFit {
  if (tile === TILED) {
    return 'tile'
  }
  return FIT_BY_STYLE[style ?? ''] ?? 'fill'
}

function hexPart(value: number): string {
  return value.toString(16).padStart(2, '0')
}

export function colorFromRegistry(value: string | undefined): string {
  const parts = (value ?? '').split(' ').filter((part) => part !== '').map(Number)
  const isColor = parts.length === COLOR_PART_COUNT && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= MAX_COLOR_PART)
  return isColor ? `#${parts.map(hexPart).join('')}` : DEFAULT_DESKTOP_COLOR
}

export function placementOf(display: Bounds, content: Bounds): DesktopPlacement {
  return { left: display.x - content.x, top: display.y - content.y, width: display.width, height: display.height }
}
