import { describe, expect, it } from 'vitest'
import { isHexColor } from '../../shared/hexColor'
import { contrastRatio, isDarkColor, mixColors, readableOn } from './colorMath'
import { COLOR_THEMES, DEFAULT_COLOR_THEME_ID, DEFAULT_LIGHT_COLOR_THEME_ID, findColorTheme, terminalContrastOf } from './colorThemes'
import { appColorsOf, isDarkTheme, themeFromPalette } from './themeDerivation'

const MINIMUM_THEMES_PER_MODE = 20

describe('colorMath', () => {
  it('mixes and measures contrast like the WCAG formula', () => {
    expect(mixColors('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mixColors('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(mixColors('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5)
  })

  it('tells dark from light backgrounds', () => {
    expect(isDarkColor('#1e1e2e')).toBe(true)
    expect(isDarkColor('#eff1f5')).toBe(false)
  })

  it('makes a color readable without changing one that already is', () => {
    expect(readableOn('#ffffff', '#000000', 4.5)).toBe('#ffffff')
    const fixed = readableOn('#f0e68c', '#ffffff', 4.5)
    expect(contrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('the theme list', () => {
  it('has unique ids and only plain colors', () => {
    expect(new Set(COLOR_THEMES.map((theme) => theme.id)).size).toBe(COLOR_THEMES.length)
    for (const theme of COLOR_THEMES) {
      const colors = [theme.background, theme.foreground, theme.cursor, theme.selection, ...theme.ansi, ...Object.values(theme.code)]
      expect(theme.ansi, theme.label).toHaveLength(16)
      expect(colors.every(isHexColor), theme.label).toBe(true)
      expect(Object.values(appColorsOf(theme)).every(isHexColor), theme.label).toBe(true)
    }
  })

  it('offers plenty of dark and light themes, each starting with the O-BROS one', () => {
    const dark = COLOR_THEMES.filter(isDarkTheme)
    const light = COLOR_THEMES.filter((theme) => !isDarkTheme(theme))
    expect(dark.length).toBeGreaterThanOrEqual(MINIMUM_THEMES_PER_MODE)
    expect(light.length).toBeGreaterThanOrEqual(MINIMUM_THEMES_PER_MODE)
    expect(dark[0].id).toBe(DEFAULT_COLOR_THEME_ID)
    expect(light[0].id).toBe(DEFAULT_LIGHT_COLOR_THEME_ID)
  })

  it('keeps every derived app color readable', () => {
    for (const theme of COLOR_THEMES.filter((candidate) => candidate.app === undefined)) {
      const app = appColorsOf(theme)
      expect(contrastRatio(app.text, app.panel), `${theme.label} text`).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(app.muted, app.panel), `${theme.label} muted`).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(app.faint, app.panel), `${theme.label} faint`).toBeGreaterThanOrEqual(3)
      expect(contrastRatio(app.strong, app.terminal), `${theme.label} strong`).toBeGreaterThanOrEqual(contrastRatio(app.text, app.terminal) - 0.01)
    }
  })

  it('keeps the O-BROS theme looking exactly as before', () => {
    const app = appColorsOf(findColorTheme(DEFAULT_COLOR_THEME_ID)!)
    expect(app).toMatchObject({ terminal: '#000000', chrome: '#0b0b0b', panel: '#111111', text: '#ededed', strong: '#ffffff' })
    expect(terminalContrastOf(findColorTheme(DEFAULT_COLOR_THEME_ID)!)).toBe(1)
    expect(terminalContrastOf(findColorTheme(DEFAULT_LIGHT_COLOR_THEME_ID)!)).toBe(4.5)
  })
})

describe('themeFromPalette', () => {
  const harshLight = {
    id: 'harsh',
    label: 'Harsh',
    background: '#ffffff',
    foreground: '#333333',
    cursor: '#333333',
    selection: '#fffffe',
    ansi: ['#000000', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff', '#eeeeee', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff']
  }

  it('turns unreadable terminal colors into readable code colors', () => {
    const theme = themeFromPalette(harshLight)
    for (const [name, color] of Object.entries(theme.code)) {
      expect(contrastRatio(color, theme.background), name).toBeGreaterThanOrEqual(name === 'comment' ? 3 : 3.5)
    }
  })

  it('always gives a visible selection', () => {
    const theme = themeFromPalette(harshLight)
    expect(contrastRatio(theme.selection, theme.background)).toBeGreaterThanOrEqual(1.25)
  })
})
