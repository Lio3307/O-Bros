import { describe, expect, it } from 'vitest'
import type { TintId } from '../../shared/appearance'
import { tintColorOf, tintedTheme, TINTS } from './backgroundTints'
import { contrastRatio } from './colorMath'
import { findColorTheme, type ColorTheme } from './colorThemes'
import { appColorsOf } from './themeDerivation'

function readability(theme: ColorTheme): number {
  const app = appColorsOf(theme)
  return Math.min(contrastRatio(theme.foreground, theme.background), contrastRatio(app.text, app.panel))
}

describe('tintedTheme', () => {
  it('colors the whole app with the shade the theme itself uses', () => {
    const dracula = findColorTheme('dracula')!
    const blue = tintedTheme(dracula, 'blue')
    expect(blue.background).not.toBe(dracula.background)
    expect(appColorsOf(blue).panel).not.toBe(appColorsOf(dracula).panel)
    expect(tintColorOf(dracula, 'blue')).toBe(dracula.ansi[4].toLowerCase())
    expect(blue.foreground).toBe(dracula.foreground)
  })

  it('keeps text readable on every color, in dark, light and low-contrast themes', () => {
    for (const id of ['o-bros', 'o-bros-light', 'dracula', 'solarized-dark']) {
      const theme = findColorTheme(id)!
      const wanted = Math.min(4.5, readability(theme))
      for (const tint of Object.keys(TINTS) as TintId[]) {
        const tinted = tintedTheme(theme, tint)
        expect(readability(tinted)).toBeGreaterThanOrEqual(wanted)
        expect(tinted.background).not.toBe(theme.background)
      }
    }
  })
})
