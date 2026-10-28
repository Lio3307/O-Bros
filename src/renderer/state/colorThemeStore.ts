import { useMemo } from 'react'
import { create } from 'zustand'
import type { TintId } from '../../shared/appearance'
import { isHexColor } from '../../shared/hexColor'
import { isRecord } from '../../shared/isRecord'
import { ANSI_COLOR_COUNT, type ThemePalette } from '../../shared/themePalette'
import { defaultThemeFor, findColorTheme, type ColorTheme, type ColorThemeId } from '../theme/colorThemes'
import { tintedTheme } from '../theme/backgroundTints'
import { isDarkTheme, themeFromPalette } from '../theme/themeDerivation'
import { useAppearanceStore } from './appearanceStore'
import { readStored, readStoredJson, writeStored, writeStoredJson } from './browserStorage'

export type ThemeMode = 'dark' | 'light' | 'system'

const DARK_THEME_KEY = 'o-bros.colorTheme'
const LIGHT_THEME_KEY = 'o-bros.lightColorTheme'
const MODE_KEY = 'o-bros.themeMode'
const IMPORTED_KEY = 'o-bros.importedThemes'
const THEME_MODES: ThemeMode[] = ['dark', 'light', 'system']
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'
export const IMPORTED_THEME_PREFIX = 'imported-'
const MAX_LABEL_LENGTH = 60
const MAX_IMPORTED_THEMES = 200

interface ColorThemeState {
  mode: ThemeMode
  darkThemeId: ColorThemeId
  lightThemeId: ColorThemeId
  importedPalettes: ThemePalette[]
  importedThemes: ColorTheme[]
  systemIsDark: boolean
  setMode: (mode: ThemeMode) => void
  setDarkTheme: (themeId: ColorThemeId) => void
  setLightTheme: (themeId: ColorThemeId) => void
  importPalettes: (palettes: ThemePalette[]) => void
  removeImportedTheme: (themeId: ColorThemeId) => void
}

function isPalette(value: unknown): value is ThemePalette {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.startsWith(IMPORTED_THEME_PREFIX) &&
    typeof value.label === 'string' &&
    value.label.length <= MAX_LABEL_LENGTH &&
    [value.background, value.foreground, value.cursor, value.selection].every(isHexColor) &&
    Array.isArray(value.ansi) &&
    value.ansi.length === ANSI_COLOR_COUNT &&
    value.ansi.every(isHexColor)
  )
}

function loadImportedPalettes(): ThemePalette[] {
  const saved = readStoredJson(IMPORTED_KEY)
  return Array.isArray(saved) ? saved.filter(isPalette).slice(0, MAX_IMPORTED_THEMES) : []
}

function loadMode(): ThemeMode {
  const saved = readStored(MODE_KEY)
  return THEME_MODES.includes(saved as ThemeMode) ? (saved as ThemeMode) : 'dark'
}

function systemIsDark(): boolean {
  return window.matchMedia(DARK_SCHEME_QUERY).matches
}

function themeById(state: Pick<ColorThemeState, 'importedThemes'>, themeId: ColorThemeId): ColorTheme | undefined {
  return findColorTheme(themeId) ?? state.importedThemes.find((theme) => theme.id === themeId)
}

export function isDarkModeActive(state: Pick<ColorThemeState, 'mode' | 'systemIsDark'>): boolean {
  return state.mode === 'system' ? state.systemIsDark : state.mode === 'dark'
}

export function chosenThemeFor(state: ColorThemeState, isDark: boolean): ColorTheme {
  const chosen = themeById(state, isDark ? state.darkThemeId : state.lightThemeId)
  return chosen !== undefined && isDarkTheme(chosen) === isDark ? chosen : defaultThemeFor(isDark)
}

export function activeThemeOf(state: ColorThemeState): ColorTheme {
  return chosenThemeFor(state, isDarkModeActive(state))
}

const initialPalettes = loadImportedPalettes()

export const useColorThemeStore = create<ColorThemeState>()((set, get) => ({
  mode: loadMode(),
  darkThemeId: readStored(DARK_THEME_KEY) ?? defaultThemeFor(true).id,
  lightThemeId: readStored(LIGHT_THEME_KEY) ?? defaultThemeFor(false).id,
  importedPalettes: initialPalettes,
  importedThemes: initialPalettes.map(themeFromPalette),
  systemIsDark: systemIsDark(),

  setMode: (mode) => {
    writeStored(MODE_KEY, mode)
    set({ mode })
  },

  setDarkTheme: (themeId) => {
    writeStored(DARK_THEME_KEY, themeId)
    set({ darkThemeId: themeId })
  },

  setLightTheme: (themeId) => {
    writeStored(LIGHT_THEME_KEY, themeId)
    set({ lightThemeId: themeId })
  },

  importPalettes: (palettes) => {
    const incomingIds = new Set(palettes.map((palette) => palette.id))
    const kept = get().importedPalettes.filter((palette) => !incomingIds.has(palette.id))
    const importedPalettes = [...kept, ...palettes].filter(isPalette).slice(-MAX_IMPORTED_THEMES)
    writeStoredJson(IMPORTED_KEY, importedPalettes)
    set({ importedPalettes, importedThemes: importedPalettes.map(themeFromPalette) })
  },

  removeImportedTheme: (themeId) => {
    const importedPalettes = get().importedPalettes.filter((palette) => palette.id !== themeId)
    writeStoredJson(IMPORTED_KEY, importedPalettes)
    set({ importedPalettes, importedThemes: importedPalettes.map(themeFromPalette) })
  }
}))

window.matchMedia(DARK_SCHEME_QUERY).addEventListener('change', (event) => useColorThemeStore.setState({ systemIsDark: event.matches }))

function chosenTint(): TintId | null {
  const { appearance } = useAppearanceStore.getState()
  return appearance.color
}

export function useThemeWithoutTint(): ColorTheme {
  return useColorThemeStore(activeThemeOf)
}

export function useActiveColorTheme(): ColorTheme {
  const theme = useThemeWithoutTint()
  const tint = useAppearanceStore((state) => state.appearance.color)
  return useMemo(() => (tint === null ? theme : tintedTheme(theme, tint)), [theme, tint])
}

export function activeColorTheme(): ColorTheme {
  const theme = activeThemeOf(useColorThemeStore.getState())
  const tint = chosenTint()
  return tint === null ? theme : tintedTheme(theme, tint)
}
