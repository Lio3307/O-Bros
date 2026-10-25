import { ImagePlus, Trash2 } from 'lucide-react'
import type { ChangeEvent } from 'react'
import {
  SURFACE_OPACITY_RANGE,
  WALLPAPER_BLUR_RANGE,
  WALLPAPER_DIM_RANGE,
  type BackgroundKind,
  type Range
} from '../../../shared/appearance'
import { useAppearanceStore } from '../../state/appearanceStore'
import { Button } from '../../ui/Button'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import './settings.css'
import './settingsControls.css'

const IS_WINDOWS = navigator.platform.toLowerCase().startsWith('win')

const BACKGROUND_OPTIONS: { value: BackgroundKind; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'wallpaper', label: 'Image' },
  { value: 'desktop', label: 'Desktop wallpaper' }
]

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
      alt="Your Windows wallpaper"
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
  const backgroundOptions = BACKGROUND_OPTIONS.filter((option) => option.value !== 'desktop' || IS_WINDOWS || isDesktop)

  return (
    <SettingsPageLayout title="Appearance" description="Show a picture behind O-BROS. Text, menus and dialogs stay solid and readable.">
      <SettingsSection
        title="Background"
        description={
          IS_WINDOWS
            ? 'Solid is the classic look. Image shows a picture you choose. Desktop wallpaper shows your Windows wallpaper, lined up with your screen so the desktop seems to show through.'
            : 'Solid is the classic look. Image shows a picture you choose behind the panels.'
        }
      >
        <SegmentedControl options={backgroundOptions} value={appearance.background} onChange={(background) => update({ background })} />
      </SettingsSection>

      {isWallpaper && (
        <SettingsSection title="Image" description="The image is copied into O-BROS's own folder, so it stays even if you move the original. Up to 20 MB.">
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
          title="Desktop wallpaper"
          description="The wallpaper set in Windows Settings → Personalization → Background, with its Fill, Fit, Stretch, Tile or Center setting. O-BROS follows it when you change it there, and never copies or uploads it."
        >
          <DesktopWallpaperPreview />
        </SettingsSection>
      )}

      {(isDesktop || (isWallpaper && wallpaperUrl !== null)) && (
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
