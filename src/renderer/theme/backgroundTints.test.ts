import { describe, expect, it } from 'vitest'
import { TINT_IDS } from '../../shared/appearance'
import { tintedTheme } from './backgroundTints'
import { contrastRatio } from './colorMath'
import { findColorTheme, type ColorTheme } from './colorThemes'
import { appColorsOf } from './themeDerivation'

function readability(theme: ColorTheme): number {
  const app = appColorsOf(theme)
  return Math.min(contrastRatio(theme.foreground, theme.background), contrastRatio(app.text, app.panel))
}

describe('tintedTheme', () => {
  it('tones the surfaces and leaves the text and code colors alone', () => {
    const dracula = findColorTheme('dracula')!
    const midnight = tintedTheme(dracula, 'midnight')
    expect(midnight.background).not.toBe(dracula.background)
    expect(appColorsOf(midnight).panel).not.toBe(appColorsOf(dracula).panel)
    expect(midnight.foreground).toBe(dracula.foreground)
    expect(midnight.ansi).toEqual(dracula.ansi)
  })

  it('keeps text readable on every tone, in dark, light and low-contrast themes', () => {
    for (const id of ['o-bros', 'o-bros-light', 'dracula', 'solarized-dark']) {
      const theme = findColorTheme(id)!
      const wanted = Math.min(4.5, readability(theme))
      for (const tint of TINT_IDS) {
        const tinted = tintedTheme(theme, tint)
        expect(readability(tinted)).toBeGreaterThanOrEqual(wanted)
        expect(tinted.background).not.toBe(theme.background)
      }
    }
  })
})
