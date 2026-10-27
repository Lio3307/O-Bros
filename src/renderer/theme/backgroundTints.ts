import type { TintId } from '../../shared/appearance'
import type { AppColors, ColorTheme } from './colorThemes'
import { contrastRatio, mixColors } from './colorMath'
import { appColorsOf, isDarkTheme } from './themeDerivation'

interface TintInfo {
  label: string
  hint: string
  color: string
}

export const TINTS: Record<TintId, TintInfo> = {
  midnight: { label: 'Midnight', hint: 'Deep navy', color: '#3d5a96' },
  slate: { label: 'Slate', hint: 'Cool blue gray', color: '#5a6b80' },
  aubergine: { label: 'Aubergine', hint: 'Muted plum', color: '#6a4a7e' },
  pine: { label: 'Pine', hint: 'Deep teal green', color: '#3b7066' },
  mocha: { label: 'Mocha', hint: 'Warm brown', color: '#7d604b' },
  graphite: { label: 'Graphite', hint: 'Neutral warm gray', color: '#77736d' }
}

const READABLE_CONTRAST = 4.5
const TINT_SCALES = [1, 0.75, 0.5, 0.25]
const DARK_STRENGTH = { base: 0.3, raised: 0.34, accent: 0.42 }
const LIGHT_STRENGTH = { base: 0.1, raised: 0.13, accent: 0.2 }
const TINTED_SURFACES: { name: keyof AppColors; level: keyof typeof DARK_STRENGTH }[] = [
  { name: 'terminal', level: 'base' },
  { name: 'chrome', level: 'raised' },
  { name: 'panel', level: 'raised' },
  { name: 'hover', level: 'accent' },
  { name: 'selected', level: 'accent' },
  { name: 'border', level: 'accent' }
]

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
  const color = TINTS[tint].color
  const wanted = Math.min(READABLE_CONTRAST, readability(theme))
  const tinted = TINT_SCALES.map((scale) => tintedBy(theme, color, scale)).find((candidate) => readability(candidate) >= wanted) ?? theme
  return { ...tinted, id: `${theme.id}+${tint}` }
}
