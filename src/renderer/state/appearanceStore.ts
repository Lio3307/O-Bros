import { create } from 'zustand'
import { readAppearance, surfaceAlphaOf, type Appearance } from '../../shared/appearance'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import { readStoredJson, writeStoredJson } from './browserStorage'
import { toast } from './toastStore'

const APPEARANCE_KEY = 'o-bros.appearance'

interface AppearanceState {
  appearance: Appearance
  wallpaperUrl: string | null
  update: (changes: Partial<Appearance>) => void
  loadWallpaper: () => Promise<void>
  chooseWallpaper: () => Promise<void>
  removeWallpaper: () => Promise<void>
}

export const useAppearanceStore = create<AppearanceState>()((set, get) => ({
  appearance: readAppearance(readStoredJson(APPEARANCE_KEY)),
  wallpaperUrl: null,

  update: (changes) => {
    const appearance = readAppearance({ ...get().appearance, ...changes })
    writeStoredJson(APPEARANCE_KEY, appearance)
    set({ appearance })
  },

  loadWallpaper: async () => {
    set({ wallpaperUrl: await window.api.appearance.loadWallpaper().catch(() => null) })
  },

  chooseWallpaper: async () => {
    try {
      const wallpaperUrl = await window.api.appearance.chooseWallpaper()
      if (wallpaperUrl !== null) {
        set({ wallpaperUrl })
        get().update({ background: 'wallpaper' })
      }
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not use that image as a wallpaper.'))
    }
  },

  removeWallpaper: async () => {
    await window.api.appearance.removeWallpaper()
    set({ wallpaperUrl: null })
    if (get().appearance.background === 'wallpaper') {
      get().update({ background: 'solid' })
    }
  }
}))

export function currentSurfaceAlpha(): number {
  const state = useAppearanceStore.getState()
  return surfaceAlphaOf(state.appearance, state.wallpaperUrl !== null)
}

export function useSurfaceAlpha(): number {
  return useAppearanceStore((state) => surfaceAlphaOf(state.appearance, state.wallpaperUrl !== null))
}
