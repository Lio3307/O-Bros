import { describe, expect, it } from 'vitest'
import { DEFAULT_APPEARANCE, readAppearance, surfaceAlphaOf, withAlpha } from './appearance'

describe('readAppearance', () => {
  it('keeps saved values inside the readable limits', () => {
    expect(readAppearance({ background: 'wallpaper', surfaceOpacity: 0.05, wallpaperDim: 2, wallpaperBlur: -3 })).toEqual({
      background: 'wallpaper',
      surfaceOpacity: 0.3,
      wallpaperDim: 0.85,
      wallpaperBlur: 0
    })
  })

  it('falls back to the defaults for anything broken', () => {
    expect(readAppearance(null)).toEqual(DEFAULT_APPEARANCE)
    expect(readAppearance({ background: 'neon', surfaceOpacity: 'half' })).toEqual(DEFAULT_APPEARANCE)
  })
})

describe('surfaceAlphaOf', () => {
  it('only makes surfaces see-through when something is behind them', () => {
    const wallpaper = { ...DEFAULT_APPEARANCE, background: 'wallpaper' as const, surfaceOpacity: 0.6 }
    expect(surfaceAlphaOf(wallpaper, true)).toBe(0.6)
    expect(surfaceAlphaOf(wallpaper, false)).toBe(1)
    expect(surfaceAlphaOf({ ...wallpaper, background: 'desktop' }, false)).toBe(0.6)
    expect(surfaceAlphaOf({ ...wallpaper, background: 'solid' }, true)).toBe(1)
  })
})

describe('withAlpha', () => {
  it('turns a hex colour into a see-through one and leaves solid colours alone', () => {
    expect(withAlpha('#0a141e', 0.5)).toBe('rgba(10, 20, 30, 0.5)')
    expect(withAlpha('#0a141e', 1)).toBe('#0a141e')
    expect(withAlpha('black', 0.5)).toBe('black')
  })
})
