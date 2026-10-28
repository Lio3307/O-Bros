import { create } from 'zustand'
import { readAppearance, showsDesktop, surfaceAlphaOf, type Appearance, type WhatIsBehind } from '../../shared/appearance'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import { readStoredJson, writeStoredJson } from './browserStorage'
import { toast } from './toastStore'

const APPEARANCE_KEY = 'o-bros.appearance'

interface AppearanceState {
  appearance: Appearance
  wallpaperUrl: string | null
  canSeeThrough: boolean | null
  update: (changes: Partial<Appearance>) => void
  loadWallpaper: () => Promise<void>
  loadSeeThroughSupport: () => Promise<void>
  chooseWallpaper: () => Promise<void>
  removeWallpaper: () => Promise<void>
}

export const useAppearanceStore = create<AppearanceState>()((set, get) => ({
  appearance: readAppearance(readStoredJson(APPEARANCE_KEY)),
  wallpaperUrl: null,
  canSeeThrough: null,

  update: (changes) => {
    const appearance = readAppearance({ ...get().appearance, ...changes })
    writeStoredJson(APPEARANCE_KEY, appearance)
    set({ appearance })
  },

  loadWallpaper: async () => {
    set({ wallpaperUrl: await window.api.appearance.loadWallpaper().catch(() => null) })
  },

  loadSeeThroughSupport: async () => {
    set({ canSeeThrough: await window.api.appearance.canSeeThrough().catch(() => false) })
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

export function whatIsBehindOf(state: Pick<AppearanceState, 'wallpaperUrl' | 'canSeeThrough'>): WhatIsBehind {
  return { hasWallpaper: state.wallpaperUrl !== null, canSeeThrough: state.canSeeThrough === true }
}

export function currentSurfaceAlpha(): number {
  const state = useAppearanceStore.getState()
  return surfaceAlphaOf(state.appearance, whatIsBehindOf(state))
}

export function useSurfaceAlpha(): number {
  return useAppearanceStore((state) => surfaceAlphaOf(state.appearance, whatIsBehindOf(state)))
}

export function useShowsDesktop(): boolean {
  return useAppearanceStore((state) => showsDesktop(state.appearance, whatIsBehindOf(state)))
}
