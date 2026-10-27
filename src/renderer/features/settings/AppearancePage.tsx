import { ImagePlus, Trash2 } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { SURFACE_OPACITY_RANGE, WALLPAPER_BLUR_RANGE, WALLPAPER_DIM_RANGE, type Range } from '../../../shared/appearance'
import { useAppearanceStore } from '../../state/appearanceStore'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import { BackgroundPicker } from './BackgroundPicker'
import { ThemeSettings } from './theme/ThemeSettings'
import './settings.css'
import './settingsControls.css'

const IS_WINDOWS = navigator.platform.toLowerCase().startsWith('win')
const DESKTOP_SETTINGS_PLACE = IS_WINDOWS
  ? 'Windows Settings → Personalization → Background, with its Fill, Fit, Stretch, Tile or Center setting'
  : 'your desktop settings (GNOME or KDE Plasma), with how the picture is fitted'

function DesktopWallpaperPreview() {
  const desktopWallpaper = useAppearanceStore((state) => state.desktopWallpaper)
  if (desktopWallpaper === null) {
    return <div className="appearance-wallpaper-preview appearance-wallpaper-empty">Reading…</div>
  }
  if (desktopWallpaper.imageUrl === null) {
    return (
      <div className="appearance-wallpaper-preview appearance-wallpaper-empty" style={{ backgroundColor: desktopWallpaper.color }}>
        Solid color
      </div>
    )
  }
  return (
    <img
      className="appearance-wallpaper-preview"
      src={desktopWallpaper.imageUrl}
      style={{ backgroundColor: desktopWallpaper.color }}
      alt="Your desktop wallpaper"
    />
  )
}

interface SliderProps {
  label: string
  value: number
  range: Range
  step: number
  display: string
  onChange: (value: number) => void
}

function Slider({ label, value, range, step, display, onChange }: SliderProps) {
  const fill = ((value - range.min) / (range.max - range.min)) * 100
  return (
    <label className="appearance-slider">
      <span className="appearance-slider-label">{label}</span>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={step}
        value={value}
        style={{ '--range-fill': `${fill}%` } as Record<string, string>}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
      />
      <span className="appearance-slider-value">{display}</span>
    </label>
  )
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function AppearancePage() {
  const appearance = useAppearanceStore((state) => state.appearance)
  const wallpaperUrl = useAppearanceStore((state) => state.wallpaperUrl)
  const update = useAppearanceStore((state) => state.update)
  const chooseWallpaper = useAppearanceStore((state) => state.chooseWallpaper)
  const removeWallpaper = useAppearanceStore((state) => state.removeWallpaper)
  const isWallpaper = appearance.background === 'wallpaper'
  const isDesktop = appearance.background === 'desktop'
  const showsPicture = isDesktop || (isWallpaper && wallpaperUrl !== null)

  return (
    <SettingsPageLayout title="Appearance" description="The colors of O-BROS, and a picture behind it. Text, menus and dialogs always stay readable.">
      <ThemeSettings />

      <SettingsSection
        title="Background"
        description="Look is what shows behind the app. Color tints the whole app in the shades of your theme, and works with every look, so Transparent and Green give green glass over your desktop."
      >
        <BackgroundPicker />
      </SettingsSection>

      {isWallpaper && (
        <SettingsSection title="Your image" description="The image is copied into O-BROS's own folder, so it stays even if you move the original. Up to 20 MB.">
          <div className="appearance-wallpaper">
            {wallpaperUrl === null ? (
              <div className="appearance-wallpaper-preview appearance-wallpaper-empty">No image yet</div>
            ) : (
              <img className="appearance-wallpaper-preview" src={wallpaperUrl} alt="Your wallpaper" />
            )}
            <div className="appearance-wallpaper-actions">
              <Button variant="outline" onClick={() => chooseWallpaper()}>
                <ImagePlus size={14} /> {wallpaperUrl === null ? 'Choose image…' : 'Change image…'}
              </Button>
              {wallpaperUrl !== null && (
                <Button variant="outline" className="hover-danger" onClick={() => removeWallpaper()}>
                  <Trash2 size={14} /> Remove
                </Button>
              )}
            </div>
          </div>
          {wallpaperUrl === null && <p className="muted">Choose an image to see it behind O-BROS.</p>}
        </SettingsSection>
      )}

      {isDesktop && (
        <SettingsSection
          title="Transparent"
          description={`O-BROS shows your desktop wallpaper behind itself, lined up with your screen, so the window looks see-through. It uses the wallpaper set in ${DESKTOP_SETTINGS_PLACE}, follows it when you change it there, and never copies or uploads it.`}
        >
          <DesktopWallpaperPreview />
        </SettingsSection>
      )}

      {showsPicture && (
        <SettingsSection
          title="See-through"
          description="How solid the panels, terminals and editor are over the picture, and how much to darken and soften it. Text always stays fully visible; on a bright picture, raise Dim."
        >
          <div className="appearance-sliders">
            <Slider
              label="Panels"
              value={appearance.surfaceOpacity}
              range={SURFACE_OPACITY_RANGE}
              step={0.01}
              display={percent(appearance.surfaceOpacity)}
              onChange={(surfaceOpacity) => update({ surfaceOpacity })}
            />
            <Slider
              label="Dim"
              value={appearance.wallpaperDim}
              range={WALLPAPER_DIM_RANGE}
              step={0.01}
              display={percent(appearance.wallpaperDim)}
              onChange={(wallpaperDim) => update({ wallpaperDim })}
            />
            <Slider
              label="Blur"
              value={appearance.wallpaperBlur}
              range={WALLPAPER_BLUR_RANGE}
              step={1}
              display={`${appearance.wallpaperBlur} px`}
              onChange={(wallpaperBlur) => update({ wallpaperBlur })}
            />
          </div>
        </SettingsSection>
      )}
    </SettingsPageLayout>
  )
}
