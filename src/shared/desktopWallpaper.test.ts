import { describe, expect, it } from 'vitest'
import { colorFromRegistry, parseRegistryValues, placementOf, wallpaperFitOf } from './desktopWallpaper'

const DESKTOP_KEY_OUTPUT = [
  '',
  'HKEY_CURRENT_USER\\Control Panel\\Desktop',
  '    TileWallpaper    REG_SZ    0',
  '    WallpaperOriginX    REG_DWORD    0x0',
  '    WallpaperStyle    REG_SZ    10',
  '    WallPaper    REG_SZ    C:\\Users\\me\\My  Pictures\\sunset photo.jpg',
  '    Pattern Upgrade    REG_SZ    ',
  '',
  'HKEY_CURRENT_USER\\Control Panel\\Desktop\\Colors',
  ''
].join('\r\n')

describe('parseRegistryValues', () => {
  it('reads every value by its lowercase name, keeping spaces inside the value', () => {
    const values = parseRegistryValues(DESKTOP_KEY_OUTPUT)
    expect(values.wallpaper).toBe('C:\\Users\\me\\My  Pictures\\sunset photo.jpg')
    expect(values.wallpaperstyle).toBe('10')
    expect(values.tilewallpaper).toBe('0')
    expect(values.wallpaperoriginx).toBe('0x0')
    expect(values['pattern upgrade']).toBe('')
  })

  it('returns nothing for an error or an empty answer', () => {
    expect(parseRegistryValues('ERROR: The system was unable to find the specified registry key or value.\r\n')).toEqual({})
    expect(parseRegistryValues('')).toEqual({})
  })
})

describe('wallpaperFitOf', () => {
  it('maps the Windows wallpaper styles', () => {
    expect(wallpaperFitOf('10', '0')).toBe('fill')
    expect(wallpaperFitOf('6', '0')).toBe('fit')
    expect(wallpaperFitOf('2', '0')).toBe('stretch')
    expect(wallpaperFitOf('0', '0')).toBe('center')
    expect(wallpaperFitOf('0', '1')).toBe('tile')
    expect(wallpaperFitOf('22', '0')).toBe('span')
  })

  it('falls back to fill for anything unknown', () => {
    expect(wallpaperFitOf(undefined, undefined)).toBe('fill')
    expect(wallpaperFitOf('99', '0')).toBe('fill')
  })
})

describe('colorFromRegistry', () => {
  it('turns "R G B" into a hex color', () => {
    expect(colorFromRegistry('0 99 177')).toBe('#0063b1')
    expect(colorFromRegistry('255 255 255')).toBe('#ffffff')
  })

  it('falls back to black for anything else', () => {
    expect(colorFromRegistry(undefined)).toBe('#000000')
    expect(colorFromRegistry('1 2')).toBe('#000000')
    expect(colorFromRegistry('300 0 0')).toBe('#000000')
    expect(colorFromRegistry('a b c')).toBe('#000000')
  })
})

describe('placementOf', () => {
  it('places the screen relative to the window content', () => {
    expect(placementOf({ x: 0, y: 0, width: 1920, height: 1080 }, { x: 300, y: 120, width: 1000, height: 700 })).toEqual({
      left: -300,
      top: -120,
      width: 1920,
      height: 1080
    })
  })

  it('works on a second screen to the left', () => {
    expect(placementOf({ x: -2560, y: 0, width: 2560, height: 1440 }, { x: -2000, y: 40, width: 800, height: 600 })).toEqual({
      left: -560,
      top: -40,
      width: 2560,
      height: 1440
    })
  })
})
