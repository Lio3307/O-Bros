import { Ban, Check, ImagePlus, Monitor } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { TINT_IDS, type Appearance } from '../../../shared/appearance'
import { useAppearanceStore } from '../../state/appearanceStore'
import { useThemeWithoutTint } from '../../state/colorThemeStore'
import { TINTS, tintedTheme } from '../../theme/backgroundTints'
import { appColorsOf } from '../../theme/themeDerivation'
import { cn } from '../../ui/cn'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

interface BackgroundTileProps {
  label: string
  hint: string
  isSelected: boolean
  preview: CSSProperties
  placeholder?: ReactNode
  onSelect: () => void
}

function BackgroundTile({ label, hint, isSelected, preview, placeholder, onSelect }: BackgroundTileProps) {
  return (
    <button
      type="button"
      className={cn('background-tile', isSelected && 'background-tile-selected')}
      title={hint}
      aria-pressed={isSelected}
      onClick={onSelect}
    >
      <span className="background-tile-preview" style={preview} aria-hidden="true">
        {placeholder}
        <span className="background-tile-panel" />
        {isSelected && (
          <span className="background-tile-check">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="background-tile-label">{label}</span>
    </button>
  )
}

function imagePreview(url: string | null | undefined, color: string, panel: string): CSSProperties {
  const base = { backgroundColor: color, '--tile-panel': panel } as CSSProperties
  return url === null || url === undefined ? base : { ...base, backgroundImage: `url("${url}")` }
}

function withCrossfade(change: () => void): void {
  if (!('startViewTransition' in document) || window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    change()
    return
  }
  document.startViewTransition(() => flushSync(change))
}

export function BackgroundPicker() {
  const appearance = useAppearanceStore((state) => state.appearance)
  const update = useAppearanceStore((state) => state.update)
  const wallpaperUrl = useAppearanceStore((state) => state.wallpaperUrl)
  const canSeeThrough = useAppearanceStore((state) => state.canSeeThrough)
  const theme = useThemeWithoutTint()
  const look = appearance.background === 'desktop' && canSeeThrough === false ? 'solid' : appearance.background
  const isChosen = (background: Appearance['background']) => look === background
  const basePanel = appColorsOf(theme).panel
  const choose = (changes: Partial<Appearance>) => withCrossfade(() => update(changes))

  return (
    <div className="background-groups">
      <div className="background-group">
        <h3 className="background-group-title">Look</h3>
        <div className="background-picker">
          <BackgroundTile
            label="Solid"
            hint="The theme color, nothing behind it"
            isSelected={isChosen('solid')}
            preview={imagePreview(null, theme.background, basePanel)}
            onSelect={() => choose({ background: 'solid' })}
          />
          {canSeeThrough === true && (
            <BackgroundTile
              label="Transparent"
              hint="See the windows and desktop behind O-BROS, softly blurred"
              isSelected={isChosen('desktop')}
              preview={imagePreview(null, theme.background, basePanel)}
              placeholder={<Monitor size={18} className="background-tile-icon" />}
              onSelect={() => choose({ background: 'desktop' })}
            />
          )}
          <BackgroundTile
            label="Your image"
            hint="A picture you choose, behind O-BROS"
            isSelected={isChosen('wallpaper')}
            preview={imagePreview(wallpaperUrl, theme.background, basePanel)}
            placeholder={wallpaperUrl === null && <ImagePlus size={18} className="background-tile-icon" />}
            onSelect={() => choose({ background: 'wallpaper' })}
          />
        </div>
      </div>
      <div className="background-group">
        <h3 className="background-group-title">Tone</h3>
        <div className="background-picker">
          <BackgroundTile
            label="None"
            hint="The theme's own surfaces"
            isSelected={appearance.color === null}
            preview={imagePreview(null, theme.background, basePanel)}
            placeholder={<Ban size={18} className="background-tile-icon" />}
            onSelect={() => choose({ color: null })}
          />
          {TINT_IDS.map((tint) => {
            const tinted = tintedTheme(theme, tint)
            return (
              <BackgroundTile
                key={tint}
                label={TINTS[tint].label}
                hint={`${TINTS[tint].hint}, for the whole app and any look above`}
                isSelected={appearance.color === tint}
                preview={{ backgroundColor: tinted.background, '--tile-panel': appColorsOf(tinted).panel } as CSSProperties}
                onSelect={() => choose({ color: tint })}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
