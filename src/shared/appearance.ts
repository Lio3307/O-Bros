import { isRecord } from './isRecord'

export type BackgroundKind = 'solid' | 'wallpaper' | 'desktop'

export const TINT_IDS = ['midnight', 'slate', 'aubergine', 'pine', 'mocha', 'graphite'] as const

export type TintId = (typeof TINT_IDS)[number]

export interface Appearance {
  background: BackgroundKind
  color: TintId | null
  surfaceOpacity: number
  wallpaperDim: number
  wallpaperBlur: number
}

export interface WindowColors {
  window: string
  titleBar: string
  symbols: string
}

export interface Range {
  min: number
  max: number
}

export const SURFACE_OPACITY_RANGE: Range = { min: 0.3, max: 1 }
export const WALLPAPER_DIM_RANGE: Range = { min: 0, max: 0.85 }
export const WALLPAPER_BLUR_RANGE: Range = { min: 0, max: 24 }

export const DEFAULT_APPEARANCE: Appearance = { background: 'solid', color: null, surfaceOpacity: 0.72, wallpaperDim: 0.45, wallpaperBlur: 0 }

const BACKGROUND_KINDS: BackgroundKind[] = ['solid', 'wallpaper', 'desktop']
const HEX_COLOR_LENGTH = 7

export function clampTo(value: unknown, range: Range, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(range.max, Math.max(range.min, value)) : fallback
}

function isTintId(value: unknown): value is TintId {
  return TINT_IDS.includes(value as TintId)
}

const TONE_OF_OLD_COLOR: Record<string, TintId> = {
  blue: 'midnight',
  cyan: 'slate',
  purple: 'aubergine',
  green: 'pine',
  yellow: 'mocha',
  red: 'mocha'
}

function toneOf(value: unknown): TintId | null {
  if (isTintId(value)) {
    return value
  }
  return typeof value === 'string' ? (TONE_OF_OLD_COLOR[value] ?? null) : null
}

function savedColorOf(raw: Record<string, unknown>): TintId | null {
  return toneOf(raw.background === 'tint' ? raw.tint : raw.color)
}

export function readAppearance(raw: unknown): Appearance {
  if (!isRecord(raw)) {
    return DEFAULT_APPEARANCE
  }
  return {
    background: BACKGROUND_KINDS.includes(raw.background as BackgroundKind) ? (raw.background as BackgroundKind) : DEFAULT_APPEARANCE.background,
    color: savedColorOf(raw),
    surfaceOpacity: clampTo(raw.surfaceOpacity, SURFACE_OPACITY_RANGE, DEFAULT_APPEARANCE.surfaceOpacity),
    wallpaperDim: clampTo(raw.wallpaperDim, WALLPAPER_DIM_RANGE, DEFAULT_APPEARANCE.wallpaperDim),
    wallpaperBlur: clampTo(raw.wallpaperBlur, WALLPAPER_BLUR_RANGE, DEFAULT_APPEARANCE.wallpaperBlur)
  }
}

export function surfaceAlphaOf(appearance: Appearance, hasWallpaper: boolean): number {
  const showsSomethingBehind = appearance.background === 'desktop' || (appearance.background === 'wallpaper' && hasWallpaper)
  return showsSomethingBehind ? appearance.surfaceOpacity : 1
}

export function innerAlphaOf(surfaceAlpha: number): number {
  return surfaceAlpha < 1 ? 0 : 1
}

function channel(hex: string, start: number): number {
  return Number.parseInt(hex.slice(start, start + 2), 16)
}

export function withAlpha(hexColor: string, alpha: number): string {
  if (alpha >= 1 || hexColor.length !== HEX_COLOR_LENGTH || !hexColor.startsWith('#')) {
    return hexColor
  }
  return `rgba(${channel(hexColor, 1)}, ${channel(hexColor, 3)}, ${channel(hexColor, 5)}, ${alpha})`
}
