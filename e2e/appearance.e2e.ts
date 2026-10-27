import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const SHOTS = process.env.APPEARANCE_SHOTS
const WALLPAPER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1d4ed8"/>
      <stop offset="0.5" stop-color="#9333ea"/>
      <stop offset="1" stop-color="#f97316"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  <circle cx="1200" cy="260" r="180" fill="#fde68a" opacity="0.85"/>
  <path d="M0 700 L380 420 L700 680 L1050 380 L1600 720 L1600 900 L0 900 Z" fill="#0f172a" opacity="0.85"/>
</svg>`

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

function backgroundAlphaOf(selector: string) {
  return app.window.evaluate((target) => {
    const element = document.querySelector(target)
    if (element === null) {
      return null
    }
    const color = getComputedStyle(element).backgroundColor
    const inside = color.slice(color.indexOf('(') + 1, color.lastIndexOf(')'))
    if (inside.includes('/')) {
      return Number(inside.slice(inside.indexOf('/') + 1).trim())
    }
    const parts = inside.split(',')
    return parts.length === 4 ? Number(parts[3]) : 1
  }, selector)
}

test('shows a wallpaper behind see-through panels, keeps menus solid, and goes back to solid', async () => {
  app = await launchApp({ separateHome: true })
  const wallpaperPath = join(dirname(app.projectFolder), 'sunset.svg')
  await writeFile(wallpaperPath, WALLPAPER_SVG, 'utf8')
  await app.application.evaluate(({ dialog }, chosen) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [chosen] })
  }, wallpaperPath)

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Appearance' }).click()
  await expect(app.window.getByRole('button', { name: 'Choose image…' })).toHaveCount(0)
  await app.window.getByRole('button', { name: 'Your image', exact: true }).click()
  await expect(app.window.getByText('Panels', { exact: true })).toHaveCount(0)
  await app.window.getByRole('button', { name: 'Choose image…' }).click()

  await expect(app.window.locator('.app-wallpaper-image')).toBeVisible()
  await expect(app.window.locator('.appearance-wallpaper-preview')).toHaveAttribute('src', /^data:image\/svg\+xml;base64,/)
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBeLessThan(1)
  await expect.poll(() => backgroundAlphaOf('.status-bar')).toBeLessThan(1)
  await expect(app.window.getByText('Blur', { exact: true })).toBeVisible()

  if (SHOTS !== undefined) {
    await app.window.waitForTimeout(600)
    await app.window.screenshot({ path: `${SHOTS}/appearance-settings.png` })
  }

  await app.window.getByTitle('Projects', { exact: true }).click()
  await app.window.waitForTimeout(800)
  if (SHOTS !== undefined) {
    await app.window.screenshot({ path: `${SHOTS}/appearance-terminal.png` })
  }
  await app.window.locator('.tab').first().click({ button: 'right' })
  await expect(app.window.locator('.popup-menu')).toBeVisible()
  expect(await backgroundAlphaOf('.popup-menu')).toBe(1)
  if (SHOTS !== undefined) {
    await app.window.screenshot({ path: `${SHOTS}/appearance-menu.png` })
  }
  await app.window.keyboard.press('Escape')

  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.getByRole('button', { name: 'Remove' }).click()
  await expect(app.window.locator('.app-wallpaper-image')).toHaveCount(0)
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBe(1)
  await expect(app.window.getByRole('button', { name: 'Choose image…' })).toHaveCount(0)
})


function windowsWallpaperIsSet(): boolean {
  const output = execFileSync('reg', ['query', 'HKCU\\Control Panel\\Desktop', '/v', 'WallPaper'], { encoding: 'utf8', windowsHide: true })
  const line = output.split('\n').find((candidate) => candidate.includes('REG_SZ'))
  return line !== undefined && line.slice(line.indexOf('REG_SZ') + 'REG_SZ'.length).trim() !== ''
}

async function paintWallpaper(type: 'jpeg' | 'png'): Promise<Buffer> {
  const opened = app.application.waitForEvent('window')
  await app.application.evaluate(async ({ BrowserWindow }, svg) => {
    const painter = new BrowserWindow({ width: 800, height: 450, show: false, title: 'wallpaper painter' })
    await painter.loadURL('data:text/html,' + encodeURIComponent(`<body style="margin:0;overflow:hidden">${svg}</body>`))
  }, WALLPAPER_SVG.replace('width="1600" height="900"', 'width="800" height="450"'))
  const painterPage = await opened
  const image = await painterPage.screenshot({ type })
  await painterPage.close()
  return image
}

function screenPlacement() {
  return app.application.evaluate(({ BrowserWindow, screen }) => {
    const window = BrowserWindow.getAllWindows().find((candidate) => candidate.getTitle().startsWith('O-BROS'))!
    const content = window.getContentBounds()
    const display = screen.getDisplayMatching(content).bounds
    return { width: `${display.width}px`, transform: `translate(${display.x - content.x}px, ${display.y - content.y}px)` }
  })
}

function shownPlacement() {
  return app.window.evaluate(() => {
    const layer = document.querySelector<HTMLElement>('.app-desktop-screen')
    return layer === null ? null : { width: layer.style.width, transform: layer.style.transform }
  })
}

function mainWindowListeners(eventName: string) {
  return app.application.evaluate(({ BrowserWindow }, name) => {
    const window = BrowserWindow.getAllWindows().find((candidate) => candidate.getTitle().startsWith('O-BROS'))!
    return window.listenerCount(name as 'move')
  }, eventName)
}

test('Desktop wallpaper shows the Windows wallpaper lined up with the screen, follows window moves and wallpaper changes, and Solid turns it off', async () => {
  test.skip(process.platform !== 'win32', 'the desktop wallpaper is read from Windows')
  app = await launchApp({ separateHome: true })
  const hasWindowsWallpaper = windowsWallpaperIsSet()
  const themesFolder = join(dirname(app.projectFolder), 'app-data', 'Microsoft', 'Windows', 'Themes')
  await mkdir(themesFolder, { recursive: true })
  await writeFile(join(themesFolder, 'TranscodedWallpaper'), await paintWallpaper('jpeg'))
  await app.application.evaluate(({ app: electronApp, BrowserWindow }, appDataFolder) => {
    const originalGetPath = electronApp.getPath.bind(electronApp)
    electronApp.getPath = (name) => (name === 'appData' ? appDataFolder : originalGetPath(name))
    const window = BrowserWindow.getAllWindows()[0]
    const overlayColors: string[] = []
    Object.assign(globalThis, { overlayColors })
    const setOverlay = window.setTitleBarOverlay.bind(window)
    window.setTitleBarOverlay = (options) => {
      overlayColors.push(options.color ?? '')
      setOverlay(options)
    }
  }, join(dirname(app.projectFolder), 'app-data'))
  const lastOverlayColor = () => app.application.evaluate(() => ((globalThis as Record<string, unknown>).overlayColors as string[]).at(-1) ?? null)
  const moveListenersBefore = await mainWindowListeners('move')

  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Appearance' }).click()
  await app.window.getByRole('button', { name: 'Transparent', exact: true }).click()

  await expect(app.window.locator('.app-desktop-screen')).toBeAttached()
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBeLessThan(1)
  await expect.poll(lastOverlayColor).toBe('#00000000')
  await expect(app.window.getByRole('button', { name: 'Choose image…' })).toHaveCount(0)
  await expect(app.window.getByText('Blur', { exact: true })).toBeVisible()
  await expect.poll(shownPlacement).toEqual(await screenPlacement())
  expect(await mainWindowListeners('move')).toBe(moveListenersBefore + 1)

  if (hasWindowsWallpaper) {
    await expect(app.window.locator('.appearance-wallpaper-preview')).toHaveAttribute('src', /^data:image\/jpeg;base64,/)
    await expect(app.window.locator('.app-desktop-image')).toHaveAttribute('style', /data:image\/jpeg;base64,/)
  } else {
    await expect(app.window.locator('.appearance-wallpaper-preview')).toHaveText('Solid color')
  }

  await app.application.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows().find((candidate) => candidate.getTitle().startsWith('O-BROS'))!
    window.unmaximize()
    const bounds = window.getBounds()
    window.setBounds({ x: bounds.x + 40, y: bounds.y + 30, width: bounds.width - 80, height: bounds.height - 60 })
  })
  await expect.poll(shownPlacement).toEqual(await screenPlacement())

  if (hasWindowsWallpaper) {
    await writeFile(join(themesFolder, 'TranscodedWallpaper'), await paintWallpaper('png'))
    await app.application.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows().find((candidate) => candidate.getTitle().startsWith('O-BROS'))!.emit('focus')
    })
    await expect(app.window.locator('.appearance-wallpaper-preview')).toHaveAttribute('src', /^data:image\/png;base64,/)
  }

  if (SHOTS !== undefined) {
    await app.window.getByTitle('Projects', { exact: true }).click()
    await app.window.waitForTimeout(600)
    await app.window.screenshot({ path: `${SHOTS}/appearance-desktop.png` })
    await app.window.getByTitle('Settings', { exact: true }).click()
  }

  await app.window.getByRole('button', { name: 'Solid', exact: true }).click()
  await expect(app.window.locator('.app-desktop-screen')).toHaveCount(0)
  await expect.poll(lastOverlayColor).toBe('#0b0b0b')
  await expect.poll(() => app.window.evaluate(() => document.documentElement.hasAttribute('data-see-through'))).toBe(false)
  await expect.poll(() => mainWindowListeners('move')).toBe(moveListenersBefore)
})

test('a painted background uses the theme colors behind see-through panels', async () => {
  app = await launchApp({ separateHome: true })
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Appearance' }).click()
  await expect(app.window.getByRole('button', { name: 'Solid', exact: true })).toHaveAttribute('aria-pressed', 'true')

  await app.window.getByRole('button', { name: 'Aurora', exact: true }).click()
  await expect(app.window.getByRole('button', { name: 'Aurora', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(app.window.locator('.app-wallpaper-image')).toHaveAttribute('style', /radial-gradient/)
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBeLessThan(1)
  await expect(app.window.getByText('Panels', { exact: true })).toBeVisible()
  await expect(app.window.getByText('Dim', { exact: true })).toHaveCount(0)
  if (SHOTS !== undefined) {
    await app.window.waitForTimeout(600)
    await app.window.screenshot({ path: `${SHOTS}/appearance-scene.png` })
  }

  await app.window.getByRole('button', { name: 'Solid', exact: true }).click()
  await expect(app.window.locator('.app-wallpaper-image')).toHaveCount(0)
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBe(1)
})

test('a saved Transparent choice survives a restart', async () => {
  app = await launchApp({ separateHome: true })
  await app.window.evaluate(() => localStorage.setItem('o-bros.appearance', JSON.stringify({ background: 'desktop' })))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await expect(app.window.locator('.app-desktop-screen')).toBeAttached()
  await app.window.waitForTimeout(1500)
  expect(await app.window.evaluate(() => JSON.parse(localStorage.getItem('o-bros.appearance') ?? '{}').background)).toBe('desktop')
})
