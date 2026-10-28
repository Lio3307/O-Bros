import { useEffect, useLayoutEffect, useMemo } from 'react'
import { isHexColor } from '../../shared/hexColor'
import { useShowsDesktop, useSurfaceAlpha } from '../state/appearanceStore'
import { useActiveColorTheme } from '../state/colorThemeStore'
import type { AppColors } from '../theme/colorThemes'
import { appColorsOf, isDarkTheme } from '../theme/themeDerivation'

const STYLE_ID = 'o-bros-theme'
const CLEAR_COLOR = '#00000000'

const VARIABLE_BY_COLOR: Record<keyof AppColors, string> = {
  terminal: '--color-terminal-solid',
  chrome: '--color-chrome-solid',
  panel: '--color-panel-solid',
  hover: '--color-hover',
  selected: '--color-selected',
  border: '--color-border',
  text: '--color-text',
  muted: '--color-muted',
  faint: '--color-faint',
  strong: '--color-strong',
  success: '--color-success',
  danger: '--color-danger',
  info: '--color-info',
  warning: '--color-warning'
}

function themeRuleOf(colors: AppColors, isDark: boolean): string {
  const declarations = (Object.keys(VARIABLE_BY_COLOR) as (keyof AppColors)[])
    .filter((name) => isHexColor(colors[name]))
    .map((name) => `${VARIABLE_BY_COLOR[name]}: ${colors[name]};`)
  return `:root { ${declarations.join(' ')} color-scheme: ${isDark ? 'dark' : 'light'}; }`
}

function themeStyleElement(): HTMLStyleElement {
  const existing = document.getElementById(STYLE_ID)
  if (existing instanceof HTMLStyleElement) {
    return existing
  }
  const created = document.createElement('style')
  created.id = STYLE_ID
  document.head.appendChild(created)
  return created
}

export function AppTheme() {
  const theme = useActiveColorTheme()
  const isSeeThrough = useSurfaceAlpha() < 1
  const isDesktopShown = useShowsDesktop()
  const colors = useMemo(() => appColorsOf(theme), [theme])
  const isDark = isDarkTheme(theme)

  useLayoutEffect(() => {
    themeStyleElement().textContent = themeRuleOf(colors, isDark)
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [colors, isDark])

  useEffect(() => {
    void window.api.appearance
      .setWindowColors({
        window: isDesktopShown ? CLEAR_COLOR : colors.terminal,
        titleBar: isSeeThrough ? CLEAR_COLOR : colors.chrome,
        symbols: colors.text,
        showsDesktop: isDesktopShown
      })
      .catch(() => undefined)
  }, [colors, isSeeThrough, isDesktopShown])

  return null
}
