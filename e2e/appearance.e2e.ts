import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
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

async function captureScreen(path: string) {
  const bounds = await app.application.evaluate(({ BrowserWindow, screen }) => {
    const scale = screen.getPrimaryDisplay().scaleFactor
    const box = BrowserWindow.getAllWindows()[0].getBounds()
    return { x: Math.round(box.x * scale), y: Math.round(box.y * scale), width: Math.round(box.width * scale), height: Math.round(box.height * scale) }
  })
  const script = `Add-Type -AssemblyName System.Drawing; $image = New-Object System.Drawing.Bitmap ${bounds.width}, ${bounds.height}; [System.Drawing.Graphics]::FromImage($image).CopyFromScreen(${bounds.x}, ${bounds.y}, 0, 0, $image.Size); $image.Save('${path}')`
  execFileSync('powershell', ['-NoProfile', '-Command', script])
}

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
  await app.window.getByRole('button', { name: 'Wallpaper' }).click()
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

test('Desktop shows what is behind the window in dark acrylic with clear window buttons, and Solid turns that off', async () => {
  test.skip(process.platform !== 'win32', 'the desktop background is a Windows 11 feature')
  app = await launchApp({ separateHome: true })
  await app.application.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]
    const materials: string[] = []
    const overlayColors: string[] = []
    Object.assign(globalThis, { materials, overlayColors })
    const setMaterial = window.setBackgroundMaterial.bind(window)
    const setOverlay = window.setTitleBarOverlay.bind(window)
    window.setBackgroundMaterial = (material) => {
      materials.push(material)
      setMaterial(material)
    }
    window.setTitleBarOverlay = (options) => {
      overlayColors.push(options.color ?? '')
      setOverlay(options)
    }
  })
  const lastOf = (name: 'materials' | 'overlayColors') =>
    app.application.evaluate((_electron, key) => ((globalThis as Record<string, unknown>)[key] as string[]).at(-1) ?? null, name)
  expect(await app.application.evaluate(({ nativeTheme }) => nativeTheme.shouldUseDarkColors)).toBe(true)
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Appearance' }).click()

  await app.window.getByRole('button', { name: 'Desktop (Windows 11)' }).click()
  await expect.poll(() => lastOf('materials')).toBe('acrylic')
  await expect.poll(() => lastOf('overlayColors')).toBe('#00000000')
  await expect.poll(() => app.window.evaluate(() => document.documentElement.hasAttribute('data-see-through'))).toBe(true)
  await expect(app.window.locator('.app-wallpaper-desktop .app-wallpaper-dim')).toBeAttached()
  await expect(app.window.getByText('Dim', { exact: true })).toBeVisible()
  await expect(app.window.getByText('Blur', { exact: true })).toHaveCount(0)
  await expect(app.window.getByRole('button', { name: 'Choose image…' })).toHaveCount(0)
  await app.application.evaluate(({ BrowserWindow }, name) => BrowserWindow.getAllWindows()[0].emit(name), 'focus')
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBeLessThan(1)
  await app.application.evaluate(({ BrowserWindow }, name) => BrowserWindow.getAllWindows()[0].emit(name), 'blur')
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBe(1)
  await app.application.evaluate(({ BrowserWindow }, name) => BrowserWindow.getAllWindows()[0].emit(name), 'focus')
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBeLessThan(1)
  if (SHOTS !== undefined) {
    await app.window.waitForTimeout(600)
    await captureScreen(`${SHOTS}/appearance-desktop.png`)
  }

  await app.window.getByRole('button', { name: 'Solid' }).click()
  await expect.poll(() => lastOf('materials')).toBe('none')
  await expect.poll(() => lastOf('overlayColors')).toBe('#0B0B0B')
  await expect.poll(() => app.window.evaluate(() => document.documentElement.hasAttribute('data-see-through'))).toBe(false)
})
