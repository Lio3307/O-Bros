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

const BACKGROUND_OPTIONS: { value: BackgroundKind; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'wallpaper', label: 'Wallpaper' },
  { value: 'desktop', label: 'Desktop (Windows 11)' }
]

interface SliderProps {
  label: string
  value: number
  range: Range
  step: number
  display: string
  disabled?: boolean
  onChange: (value: number) => void
}

function Slider({ label, value, range, step, display, disabled = false, onChange }: SliderProps) {
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
        disabled={disabled}
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
  const isSolid = appearance.background === 'solid'
  const isWallpaper = appearance.background === 'wallpaper'

  return (
    <SettingsPageLayout title="Appearance" description="Show a wallpaper or your desktop behind O-BROS. Text, menus and dialogs stay solid and readable.">
      <SettingsSection
        title="Background"
        description="Solid is the classic look. Wallpaper shows an image of your choice. Desktop shows what is behind the window, softly blurred (Windows 11)."
      >
        <SegmentedControl options={BACKGROUND_OPTIONS} value={appearance.background} onChange={(background) => update({ background })} />
      </SettingsSection>

      <SettingsSection title="Wallpaper" description="The image is copied into O-BROS's own folder, so it stays even if you move the original. Up to 20 MB.">
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
        {isWallpaper && wallpaperUrl === null && <p className="muted">Choose an image to see it behind O-BROS.</p>}
      </SettingsSection>

      <SettingsSection
        title="See-through"
        description="How solid the panels, terminals and editor are over the background. Lower shows more of it; text always stays fully visible."
      >
        <div className="appearance-sliders">
          <Slider
            label="Panels"
            value={appearance.surfaceOpacity}
            range={SURFACE_OPACITY_RANGE}
            step={0.01}
            display={percent(appearance.surfaceOpacity)}
            disabled={isSolid}
            onChange={(surfaceOpacity) => update({ surfaceOpacity })}
          />
          <Slider
            label="Dim wallpaper"
            value={appearance.wallpaperDim}
            range={WALLPAPER_DIM_RANGE}
            step={0.01}
            display={percent(appearance.wallpaperDim)}
            disabled={!isWallpaper}
            onChange={(wallpaperDim) => update({ wallpaperDim })}
          />
          <Slider
            label="Blur wallpaper"
            value={appearance.wallpaperBlur}
            range={WALLPAPER_BLUR_RANGE}
            step={1}
            display={`${appearance.wallpaperBlur} px`}
            disabled={!isWallpaper}
            onChange={(wallpaperBlur) => update({ wallpaperBlur })}
          />
        </div>
        {isSolid && <p className="muted">Pick Wallpaper or Desktop above to use these.</p>}
      </SettingsSection>
    </SettingsPageLayout>
  )
}
