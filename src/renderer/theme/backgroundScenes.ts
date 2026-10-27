import { withAlpha, type SceneId } from '../../shared/appearance'
import { normalizeHexColor } from '../../shared/hexColor'
import type { ColorTheme } from './colorThemes'
import { isDarkTheme } from './themeDerivation'

const RED = 1
const GREEN = 2
const YELLOW = 3
const BLUE = 4
const MAGENTA = 5
const CYAN = 6
const LIGHT_THEME_STRENGTH = 0.6
const NEUTRAL_TINT = '#808080'

export const SCENE_LABELS: Record<SceneId, string> = {
  glow: 'Glow',
  aurora: 'Aurora',
  horizon: 'Horizon',
  ember: 'Ember',
  tide: 'Tide'
}

function tint(theme: ColorTheme, ansiIndex: number, strength: number): string {
  const color = normalizeHexColor(theme.ansi[ansiIndex]) ?? normalizeHexColor(theme.foreground) ?? NEUTRAL_TINT
  return withAlpha(color, strength * (isDarkTheme(theme) ? 1 : LIGHT_THEME_STRENGTH))
}

function glowAt(position: string, color: string, reach = '60%'): string {
  return `radial-gradient(ellipse at ${position}, ${color}, transparent ${reach})`
}

const SCENE_LAYERS: Record<SceneId, (theme: ColorTheme) => string[]> = {
  glow: (theme) => [glowAt('85% 0%', tint(theme, BLUE, 0.45), '65%')],
  aurora: (theme) => [
    glowAt('15% 10%', tint(theme, CYAN, 0.35)),
    glowAt('80% 25%', tint(theme, MAGENTA, 0.32)),
    glowAt('45% 100%', tint(theme, GREEN, 0.25))
  ],
  horizon: (theme) => [glowAt('50% 115%', tint(theme, MAGENTA, 0.45), '55%'), `linear-gradient(180deg, transparent 35%, ${tint(theme, BLUE, 0.28)})`],
  ember: (theme) => [glowAt('0% 100%', tint(theme, RED, 0.42)), glowAt('100% 80%', tint(theme, YELLOW, 0.28))],
  tide: (theme) => [`linear-gradient(135deg, ${tint(theme, CYAN, 0.32)}, transparent 42%, transparent 58%, ${tint(theme, BLUE, 0.38)})`]
}

export function sceneImage(scene: SceneId, theme: ColorTheme): string {
  return SCENE_LAYERS[scene](theme).join(', ')
}
