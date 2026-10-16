import { create } from 'zustand'
import { DEFAULT_COLOR_THEME_ID, isColorThemeId, type ColorThemeId } from '../theme/colorThemes'

const STORAGE_KEY = 'o-bros.colorTheme'

interface ColorThemeState {
  themeId: ColorThemeId
  setTheme: (themeId: ColorThemeId) => void
}

function loadSavedThemeId(): ColorThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isColorThemeId(saved) ? saved : DEFAULT_COLOR_THEME_ID
  } catch {
    return DEFAULT_COLOR_THEME_ID
  }
}

function saveThemeId(themeId: ColorThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, themeId)
  } catch {
    return
  }
}

export const useColorThemeStore = create<ColorThemeState>()((set) => ({
  themeId: loadSavedThemeId(),

  setTheme: (themeId) => {
    saveThemeId(themeId)
    set({ themeId })
  }
}))
