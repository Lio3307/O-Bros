import { ImagePlus, Monitor } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { SCENE_IDS, type Appearance } from '../../../shared/appearance'
import { useAppearanceStore } from '../../state/appearanceStore'
import { useActiveColorTheme } from '../../state/colorThemeStore'
import { SCENE_LABELS, sceneImage } from '../../theme/backgroundScenes'
import { cn } from '../../ui/cn'

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
      </span>
      <span className="background-tile-label">{label}</span>
    </button>
  )
}

function imagePreview(url: string | null | undefined, color: string): CSSProperties {
  return url === null || url === undefined ? { backgroundColor: color } : { backgroundColor: color, backgroundImage: `url("${url}")` }
}

export function BackgroundPicker() {
  const appearance = useAppearanceStore((state) => state.appearance)
  const update = useAppearanceStore((state) => state.update)
  const wallpaperUrl = useAppearanceStore((state) => state.wallpaperUrl)
  const desktopWallpaper = useAppearanceStore((state) => state.desktopWallpaper)
  const canFollowDesktop = useAppearanceStore((state) => state.canFollowDesktop)
  const theme = useActiveColorTheme()
  const isChosen = (background: Appearance['background']) => appearance.background === background
  const desktopImage = isChosen('desktop') ? desktopWallpaper?.imageUrl : null

  return (
    <div className="background-groups">
      <div className="background-group">
        <h3 className="background-group-title">Look</h3>
        <div className="background-picker">
          <BackgroundTile
            label="Solid"
            hint="The theme color, nothing behind it"
            isSelected={isChosen('solid')}
            preview={{ backgroundColor: theme.background }}
            onSelect={() => update({ background: 'solid' })}
          />
          {(canFollowDesktop !== false || isChosen('desktop')) && (
            <BackgroundTile
              label="Transparent"
              hint="See your desktop wallpaper through O-BROS"
              isSelected={isChosen('desktop')}
              preview={imagePreview(desktopImage, desktopWallpaper?.color ?? theme.background)}
              placeholder={(desktopImage === null || desktopImage === undefined) && <Monitor size={18} className="background-tile-icon" />}
              onSelect={() => update({ background: 'desktop' })}
            />
          )}
          <BackgroundTile
            label="Your image"
            hint="A picture you choose, behind O-BROS"
            isSelected={isChosen('wallpaper')}
            preview={imagePreview(wallpaperUrl, theme.background)}
            placeholder={wallpaperUrl === null && <ImagePlus size={18} className="background-tile-icon" />}
            onSelect={() => update({ background: 'wallpaper' })}
          />
        </div>
      </div>
      <div className="background-group">
        <h3 className="background-group-title">Painted with your theme colors</h3>
        <div className="background-picker">
          {SCENE_IDS.map((scene) => (
            <BackgroundTile
              key={scene}
              label={SCENE_LABELS[scene]}
              hint="Changes with your theme"
              isSelected={isChosen('scene') && appearance.scene === scene}
              preview={{ backgroundColor: theme.background, backgroundImage: sceneImage(scene, theme) }}
              onSelect={() => update({ background: 'scene', scene })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
