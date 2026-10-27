import { describe, expect, it } from 'vitest'
import { gnomeColorOf, gnomeFitOf, gsettingsText, kdeWallpaperOf, largestPackageImage } from './linuxWallpaper'

const KDE_CONFIG = [
  '[ActionPlugins][0]',
  'RightButton;NoModifier=org.kde.contextmenu',
  '',
  '[Containments][1]',
  'wallpaperplugin=org.kde.image',
  '',
  '[Containments][1][Wallpaper][org.kde.image][General]',
  'Color=30,40,50',
  'FillMode=1',
  'Image=file:///home/me/Pictures/lake=blue.jpg',
  '',
  '[Containments][2][Wallpaper][org.kde.image][General]',
  'Image=file:///home/me/Pictures/second.jpg'
].join('\n')

describe('GNOME settings', () => {
  it('reads the quoted value gsettings prints', () => {
    expect(gsettingsText("'file:///usr/share/backgrounds/warty.jpg'\n")).toBe('file:///usr/share/backgrounds/warty.jpg')
    expect(gsettingsText("''")).toBe('')
  })

  it('maps the picture options and the background color', () => {
    expect(gnomeFitOf('zoom')).toBe('fill')
    expect(gnomeFitOf('wallpaper')).toBe('tile')
    expect(gnomeFitOf('none')).toBeNull()
    expect(gnomeColorOf('#023c88')).toBe('#023c88')
    expect(gnomeColorOf('not a color')).toBe('#000000')
  })
})

describe('kdeWallpaperOf', () => {
  it('reads the image, fill mode and color of the first screen', () => {
    expect(kdeWallpaperOf(KDE_CONFIG)).toEqual({ image: 'file:///home/me/Pictures/lake=blue.jpg', fit: 'fit', color: '#1e2832' })
  })

  it('is null when Plasma never saved a picture wallpaper', () => {
    expect(kdeWallpaperOf('[Containments][1]\nwallpaperplugin=org.kde.color\n')).toBeNull()
  })

  it('picks the biggest picture of a wallpaper package', () => {
    expect(largestPackageImage(['1920x1080.png', '5120x2880.png', '1280x1024.png'])).toBe('5120x2880.png')
    expect(largestPackageImage(['screenshot.png'])).toBe('screenshot.png')
    expect(largestPackageImage([])).toBeNull()
  })
})
