import { isRecord } from './isRecord'

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowState {
  bounds: Bounds | null
  isMaximized: boolean
  isFullScreen: boolean
}

export interface Size {
  width: number
  height: number
}

const MIN_VISIBLE_PIXELS = 100

export const DEFAULT_WINDOW_STATE: WindowState = { bounds: null, isMaximized: false, isFullScreen: false }

function isBounds(value: unknown): value is Bounds {
  return isRecord(value) && ['x', 'y', 'width', 'height'].every((key) => typeof value[key] === 'number' && Number.isFinite(value[key]))
}

export function parseWindowState(raw: unknown): WindowState {
  if (!isRecord(raw)) {
    return DEFAULT_WINDOW_STATE
  }
  return {
    bounds: isBounds(raw.bounds) ? raw.bounds : null,
    isMaximized: raw.isMaximized === true,
    isFullScreen: raw.isFullScreen === true
  }
}

function overlap(start: number, length: number, areaStart: number, areaLength: number): number {
  return Math.min(start + length, areaStart + areaLength) - Math.max(start, areaStart)
}

export function isOnScreen(bounds: Bounds, workAreas: Bounds[]): boolean {
  return workAreas.some(
    (area) =>
      overlap(bounds.x, bounds.width, area.x, area.width) >= MIN_VISIBLE_PIXELS &&
      overlap(bounds.y, bounds.height, area.y, area.height) >= MIN_VISIBLE_PIXELS
  )
}

export function startingBounds(state: WindowState, workAreas: Bounds[], minimum: Size, fallback: Size): Bounds | Size {
  const saved = state.bounds
  if (saved === null || !isOnScreen(saved, workAreas)) {
    return fallback
  }
  return { ...saved, width: Math.max(saved.width, minimum.width), height: Math.max(saved.height, minimum.height) }
}
