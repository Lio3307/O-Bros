import { useEffect } from 'react'
import { useAppearanceStore, useSurfaceAlpha } from '../state/appearanceStore'
import './appBackground.css'

export function AppBackground() {
  const appearance = useAppearanceStore((state) => state.appearance)
  const wallpaperUrl = useAppearanceStore((state) => state.wallpaperUrl)
  const loadWallpaper = useAppearanceStore((state) => state.loadWallpaper)
  const surfaceAlpha = useSurfaceAlpha()

  useEffect(() => {
    void loadWallpaper()
  }, [loadWallpaper])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--surface-alpha', String(surfaceAlpha))
    root.toggleAttribute('data-see-through', surfaceAlpha < 1)
  }, [surfaceAlpha])

  useEffect(() => {
    void window.api.appearance.showDesktop(appearance.background === 'desktop').catch(() => undefined)
  }, [appearance.background])

  if (appearance.background !== 'wallpaper' || wallpaperUrl === null) {
    return null
  }
  return (
    <div className="app-wallpaper" aria-hidden="true">
      <div
        className="app-wallpaper-image"
        style={{
          backgroundImage: `url("${wallpaperUrl}")`,
          filter: appearance.wallpaperBlur > 0 ? `blur(${appearance.wallpaperBlur}px)` : undefined,
          transform: appearance.wallpaperBlur > 0 ? 'scale(1.06)' : undefined
        }}
      />
      <div className="app-wallpaper-dim" style={{ opacity: appearance.wallpaperDim }} />
    </div>
  )
}
