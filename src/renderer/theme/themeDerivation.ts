import type { ThemePalette } from '../../shared/themePalette'
import { contrastRatio, isDarkColor, mixColors, readableOn } from './colorMath'
import type { AppColors, CodeColors, ColorTheme } from './colorThemes'

const MINIMUM_CODE_CONTRAST = 3.5
const MINIMUM_COMMENT_CONTRAST = 3
const MINIMUM_TEXT_CONTRAST = 4.5
const MINIMUM_FAINT_CONTRAST = 3
const MINIMUM_SELECTION_CONTRAST = 1.25
const SELECTION_STRENGTH = 0.55
const FALLBACK_SELECTION_STRENGTH = 0.22
const PUNCTUATION_STRENGTH = 0.7
const STRONG_STRENGTH = 0.6

const APP_TINTS = { chrome: 0.045, panel: 0.07, hover: 0.1, selected: 0.15, border: 0.18, muted: 0.62, faint: 0.42 }

const DARK_STATUS = { success: '#3fb950', danger: '#f85149', info: '#58a6ff', warning: '#d29922' }
const LIGHT_STATUS = { success: '#1a7f37', danger: '#cf222e', info: '#0969da', warning: '#9a6700' }

export function isDarkTheme(theme: Pick<ColorTheme, 'background'>): boolean {
  return isDarkColor(theme.background)
}

export function codeColorsFromPalette(palette: ThemePalette): CodeColors {
  const [, red, green, yellow, blue, magenta, cyan, , brightBlack] = palette.ansi
  const readable = (color: string, minimumRatio = MINIMUM_CODE_CONTRAST) => readableOn(color, palette.background, minimumRatio)
  return {
    keyword: readable(magenta),
    string: readable(green),
    number: readable(yellow),
    comment: readable(brightBlack, MINIMUM_COMMENT_CONTRAST),
    functionName: readable(blue),
    typeName: readable(cyan),
    property: readable(red),
    htmlTag: readable(red),
    attribute: readable(yellow),
    punctuation: readable(mixColors(palette.background, palette.foreground, PUNCTUATION_STRENGTH)),
    link: readable(blue),
    variable: readable(palette.foreground)
  }
}

function softSelectionOf(palette: ThemePalette): string {
  const selection = mixColors(palette.background, palette.selection, SELECTION_STRENGTH)
  return contrastRatio(selection, palette.background) >= MINIMUM_SELECTION_CONTRAST
    ? selection
    : mixColors(palette.background, palette.foreground, FALLBACK_SELECTION_STRENGTH)
}

export function themeFromPalette(palette: ThemePalette): ColorTheme {
  return {
    id: palette.id,
    label: palette.label,
    background: palette.background,
    foreground: palette.foreground,
    cursor: palette.cursor,
    selection: softSelectionOf(palette),
    code: codeColorsFromPalette(palette),
    ansi: palette.ansi
  }
}

export function appColorsOf(theme: ColorTheme): AppColors {
  if (theme.app !== undefined) {
    return theme.app
  }
  const isDark = isDarkTheme(theme)
  const tint = (amount: number) => mixColors(theme.background, theme.foreground, amount)
  const panel = tint(APP_TINTS.panel)
  return {
    terminal: theme.background,
    chrome: tint(APP_TINTS.chrome),
    panel,
    hover: tint(APP_TINTS.hover),
    selected: tint(APP_TINTS.selected),
    border: tint(APP_TINTS.border),
    text: readableOn(theme.foreground, panel, MINIMUM_TEXT_CONTRAST),
    muted: readableOn(tint(APP_TINTS.muted), panel, MINIMUM_TEXT_CONTRAST),
    faint: readableOn(tint(APP_TINTS.faint), panel, MINIMUM_FAINT_CONTRAST),
    strong: mixColors(theme.foreground, isDark ? '#ffffff' : '#000000', STRONG_STRENGTH),
    ...(isDark ? DARK_STATUS : LIGHT_STATUS)
  }
}
