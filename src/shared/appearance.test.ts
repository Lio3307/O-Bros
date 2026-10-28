import { describe, expect, it } from 'vitest'
import { DEFAULT_APPEARANCE, readAppearance, surfaceAlphaOf, withAlpha } from './appearance'

describe('readAppearance', () => {
  it('keeps saved values inside the readable limits', () => {
    expect(readAppearance({ background: 'wallpaper', color: 'pine', surfaceOpacity: 0.05, wallpaperDim: 2, wallpaperBlur: -3 })).toEqual({
      background: 'wallpaper',
      color: 'pine',
      surfaceOpacity: 0.3,
      wallpaperDim: 0.85,
      wallpaperBlur: 0
    })
  })

  it('keeps a color chosen as a background before, and ignores the old default color', () => {
    expect(readAppearance({ background: 'tint', tint: 'yellow' })).toMatchObject({ background: 'solid', color: 'mocha' })
    expect(readAppearance({ background: 'desktop', tint: 'blue' })).toMatchObject({ background: 'desktop', color: null })
    expect(readAppearance({ background: 'desktop', color: 'cyan' })).toMatchObject({ background: 'desktop', color: 'slate' })
    expect(readAppearance({ background: 'desktop', color: 'aubergine' })).toMatchObject({ background: 'desktop', color: 'aubergine' })
  })

  it('falls back to the defaults for anything broken', () => {
    expect(readAppearance(null)).toEqual(DEFAULT_APPEARANCE)
    expect(readAppearance({ background: 'neon', color: 'lava', surfaceOpacity: 'half' })).toEqual(DEFAULT_APPEARANCE)
  })
})

describe('surfaceAlphaOf', () => {
  it('only makes surfaces see-through when something is behind them', () => {
    const wallpaper = { ...DEFAULT_APPEARANCE, background: 'wallpaper' as const, surfaceOpacity: 0.6 }
    const everything = { hasWallpaper: true, canSeeThrough: true }
    const nothing = { hasWallpaper: false, canSeeThrough: false }
    expect(surfaceAlphaOf(wallpaper, everything)).toBe(0.6)
    expect(surfaceAlphaOf(wallpaper, nothing)).toBe(1)
    expect(surfaceAlphaOf({ ...wallpaper, background: 'desktop' }, { hasWallpaper: false, canSeeThrough: true })).toBe(0.6)
    expect(surfaceAlphaOf({ ...wallpaper, background: 'desktop', color: 'pine' }, { hasWallpaper: false, canSeeThrough: true })).toBe(0.6)
    expect(surfaceAlphaOf({ ...wallpaper, background: 'desktop' }, { hasWallpaper: true, canSeeThrough: false })).toBe(1)
    expect(surfaceAlphaOf({ ...wallpaper, background: 'solid' }, everything)).toBe(1)
  })
})

describe('withAlpha', () => {
  it('turns a hex colour into a see-through one and leaves solid colours alone', () => {
    expect(withAlpha('#0a141e', 0.5)).toBe('rgba(10, 20, 30, 0.5)')
    expect(withAlpha('#0a141e', 1)).toBe('#0a141e')
    expect(withAlpha('black', 0.5)).toBe('black')
  })
})
