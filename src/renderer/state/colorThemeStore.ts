import { create } from 'zustand'
import { DEFAULT_COLOR_THEME_ID, isColorThemeId, type ColorThemeId } from '../theme/colorThemes'
import { readStored, writeStored } from './browserStorage'

const STORAGE_KEY = 'o-bros.colorTheme'

interface ColorThemeState {
  themeId: ColorThemeId
  setTheme: (themeId: ColorThemeId) => void
}

function loadSavedThemeId(): ColorThemeId {
  const saved = readStored(STORAGE_KEY)
  return isColorThemeId(saved) ? saved : DEFAULT_COLOR_THEME_ID
}

function saveThemeId(themeId: ColorThemeId): void {
  writeStored(STORAGE_KEY, themeId)
}

export const useColorThemeStore = create<ColorThemeState>()((set) => ({
  themeId: loadSavedThemeId(),

  setTheme: (themeId) => {
    saveThemeId(themeId)
    set({ themeId })
  }
}))
