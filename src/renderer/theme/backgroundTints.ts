import type { TintId } from '../../shared/appearance'
import { normalizeHexColor } from '../../shared/hexColor'
import type { AppColors, ColorTheme } from './colorThemes'
import { contrastRatio, mixColors } from './colorMath'
import { appColorsOf, isDarkTheme } from './themeDerivation'

interface TintInfo {
  label: string
  ansiIndex: number
}

export const TINTS: Record<TintId, TintInfo> = {
  blue: { label: 'Blue', ansiIndex: 4 },
  purple: { label: 'Purple', ansiIndex: 5 },
  red: { label: 'Red', ansiIndex: 1 },
  yellow: { label: 'Yellow', ansiIndex: 3 },
  green: { label: 'Green', ansiIndex: 2 },
  cyan: { label: 'Cyan', ansiIndex: 6 }
}

const READABLE_CONTRAST = 4.5
const TINT_SCALES = [1, 0.75, 0.5, 0.25]
const DARK_STRENGTH = { base: 0.2, raised: 0.24, accent: 0.32 }
const LIGHT_STRENGTH = { base: 0.12, raised: 0.16, accent: 0.24 }
const TINTED_SURFACES: { name: keyof AppColors; level: keyof typeof DARK_STRENGTH }[] = [
  { name: 'terminal', level: 'base' },
  { name: 'chrome', level: 'raised' },
  { name: 'panel', level: 'raised' },
  { name: 'hover', level: 'accent' },
  { name: 'selected', level: 'accent' },
  { name: 'border', level: 'accent' }
]

export function tintColorOf(theme: ColorTheme, tint: TintId): string {
  return normalizeHexColor(theme.ansi[TINTS[tint].ansiIndex]) ?? normalizeHexColor(theme.foreground) ?? theme.background
}

function tintedBy(theme: ColorTheme, color: string, scale: number): ColorTheme {
  const strength = isDarkTheme(theme) ? DARK_STRENGTH : LIGHT_STRENGTH
  const app = { ...appColorsOf(theme) }
  for (const surface of TINTED_SURFACES) {
    app[surface.name] = mixColors(app[surface.name], color, strength[surface.level] * scale)
  }
  return { ...theme, background: mixColors(theme.background, color, strength.base * scale), app }
}

function readability(theme: ColorTheme): number {
  const app = appColorsOf(theme)
  return Math.min(contrastRatio(theme.foreground, theme.background), contrastRatio(app.text, app.panel))
}

export function tintedTheme(theme: ColorTheme, tint: TintId): ColorTheme {
  const color = tintColorOf(theme, tint)
  const wanted = Math.min(READABLE_CONTRAST, readability(theme))
  const tinted = TINT_SCALES.map((scale) => tintedBy(theme, color, scale)).find((candidate) => readability(candidate) >= wanted) ?? theme
  return { ...tinted, id: `${theme.id}+${tint}` }
}
