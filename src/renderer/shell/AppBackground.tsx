import { useEffect } from 'react'
import { useAppearanceStore, useShowsDesktop, useSurfaceAlpha } from '../state/appearanceStore'
import './appBackground.css'

export function AppBackground() {
  const appearance = useAppearanceStore((state) => state.appearance)
  const wallpaperUrl = useAppearanceStore((state) => state.wallpaperUrl)
  const loadWallpaper = useAppearanceStore((state) => state.loadWallpaper)
  const loadSeeThroughSupport = useAppearanceStore((state) => state.loadSeeThroughSupport)
  const surfaceAlpha = useSurfaceAlpha()
  const isDesktopShown = useShowsDesktop()
  const isSeeThrough = surfaceAlpha < 1

  useEffect(() => {
    void loadWallpaper()
    void loadSeeThroughSupport()
  }, [loadWallpaper, loadSeeThroughSupport])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--surface-alpha', String(surfaceAlpha))
    root.toggleAttribute('data-see-through', isSeeThrough)
  }, [surfaceAlpha, isSeeThrough])

  if (isDesktopShown) {
    return (
      <div className="app-wallpaper app-wallpaper-clear" aria-hidden="true">
        <div className="app-wallpaper-dim" style={{ opacity: appearance.wallpaperDim }} />
      </div>
    )
  }
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
