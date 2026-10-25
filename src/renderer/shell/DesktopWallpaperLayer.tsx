import { useEffect, useRef, type CSSProperties } from 'react'
import type { DesktopPlacement, WallpaperFit } from '../../shared/desktopWallpaper'
import { useAppearanceStore } from '../state/appearanceStore'

const COVER: CSSProperties = { backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }

const FIT_STYLES: Record<WallpaperFit, CSSProperties> = {
  fill: COVER,
  span: COVER,
  fit: { backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' },
  stretch: { backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' },
  center: { backgroundSize: 'auto', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' },
  tile: { backgroundSize: 'auto', backgroundPosition: 'left top', backgroundRepeat: 'repeat' }
}

function placeScreen(layer: HTMLDivElement | null, placement: DesktopPlacement) {
  if (layer === null) {
    return
  }
  layer.style.width = `${placement.width}px`
  layer.style.height = `${placement.height}px`
  layer.style.transform = `translate(${placement.left}px, ${placement.top}px)`
}

export function DesktopWallpaperLayer({ blur }: { blur: number }) {
  const wallpaper = useAppearanceStore((state) => state.desktopWallpaper)
  const showDesktopWallpaper = useAppearanceStore((state) => state.showDesktopWallpaper)
  const screenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isShown = true
    const stopPlacement = window.api.appearance.onDesktopPlacementChanged((placement) => placeScreen(screenRef.current, placement))
    const stopWallpaper = window.api.appearance.onDesktopWallpaperChanged(showDesktopWallpaper)
    void window.api.appearance
      .followDesktop(true)
      .then((view) => {
        if (isShown && view !== null) {
          showDesktopWallpaper(view.wallpaper)
          placeScreen(screenRef.current, view.placement)
        }
      })
      .catch(() => undefined)
    return () => {
      isShown = false
      stopPlacement()
      stopWallpaper()
      void window.api.appearance.followDesktop(false).catch(() => undefined)
    }
  }, [showDesktopWallpaper])

  return (
    <div ref={screenRef} className="app-desktop-screen" style={{ backgroundColor: wallpaper?.color }}>
      {wallpaper !== null && wallpaper.imageUrl !== null && (
        <div
          className="app-desktop-image"
          style={{
            ...FIT_STYLES[wallpaper.fit],
            backgroundImage: `url("${wallpaper.imageUrl}")`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            transform: blur > 0 ? 'scale(1.06)' : undefined
          }}
        />
      )}
    </div>
  )
}
