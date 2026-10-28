import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { release } from 'node:os'
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


function canSeeThrough(): boolean {
  return process.platform === 'darwin' || (process.platform === 'win32' && Number(release().split('.')[2]) >= 22621)
}

function recordWindowCalls() {
  return app.application.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]
    const calls: Record<string, unknown> = {}
    Object.assign(globalThis, { windowCalls: calls })
    const record = <T extends unknown[]>(name: string, original: (...args: T) => void) => (...args: T) => {
      calls[name] = args[0]
      original(...args)
    }
    window.setBackgroundMaterial = record('material', window.setBackgroundMaterial.bind(window))
    window.setVibrancy = record('vibrancy', window.setVibrancy.bind(window))
    window.setBackgroundColor = record('color', window.setBackgroundColor.bind(window))
    window.setTitleBarOverlay = record('overlay', window.setTitleBarOverlay.bind(window))
  })
}

function lastWindowCall(name: string) {
  return app.application.evaluate((_electron, key) => ((globalThis as Record<string, unknown>).windowCalls as Record<string, unknown>)[key] ?? null, name)
}

function seeThroughEffect() {
  return process.platform === 'darwin' ? lastWindowCall('vibrancy') : lastWindowCall('material')
}

test('Transparent lets the system show what is behind the window, and Solid turns it off', async () => {
  test.skip(!canSeeThrough(), 'this system has no see-through windows')
  app = await launchApp({ separateHome: true })
  await recordWindowCalls()

  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Appearance' }).click()
  await app.window.getByRole('button', { name: 'Transparent', exact: true }).click()

  await expect(app.window.locator('.app-wallpaper-clear')).toBeAttached()
  await expect.poll(seeThroughEffect).toBe(process.platform === 'darwin' ? 'under-window' : 'acrylic')
  await expect.poll(() => lastWindowCall('color')).toBe('#00000000')
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBeLessThan(1)
  await expect(app.window.getByText('Dim', { exact: true })).toBeVisible()
  await expect(app.window.getByText('Blur', { exact: true })).toHaveCount(0)

  await app.window.getByRole('button', { name: 'Solid', exact: true }).click()
  await expect(app.window.locator('.app-wallpaper-clear')).toHaveCount(0)
  await expect.poll(seeThroughEffect).toBe(process.platform === 'darwin' ? null : 'none')
  await expect.poll(() => lastWindowCall('color')).not.toBe('#00000000')
  await expect.poll(() => app.window.evaluate(() => document.documentElement.hasAttribute('data-see-through'))).toBe(false)
})

test('a tone colors the whole app and works with every look, including Transparent', async () => {
  app = await launchApp({ separateHome: true })
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Appearance' }).click()
  const panelColor = () => app.window.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-panel-solid').trim())
  const plainPanel = await panelColor()
  const pressed = (name: string) => app.window.getByRole('button', { name, exact: true })

  await pressed('Midnight').click()
  await expect(pressed('Midnight')).toHaveAttribute('aria-pressed', 'true')
  await expect(pressed('Solid')).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(panelColor).not.toBe(plainPanel)
  const greenPanel = await panelColor()
  expect(await backgroundAlphaOf('.side-panel')).toBe(1)

  await pressed('Transparent').click()
  await expect(app.window.locator('.app-wallpaper-clear')).toBeAttached()
  await expect(pressed('Midnight')).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => backgroundAlphaOf('.side-panel')).toBeLessThan(1)
  expect(await panelColor()).toBe(greenPanel)
  if (SHOTS !== undefined) {
    await app.window.waitForTimeout(600)
    await app.window.screenshot({ path: `${SHOTS}/appearance-tint.png` })
    await app.window.getByTitle('Projects', { exact: true }).click()
    await app.window.waitForTimeout(600)
    await app.window.screenshot({ path: `${SHOTS}/appearance-tint-terminal.png` })
    await app.window.getByTitle('Settings', { exact: true }).click()
  }

  await pressed('None').click()
  await expect.poll(panelColor).toBe(plainPanel)
  await expect(pressed('Transparent')).toHaveAttribute('aria-pressed', 'true')
  await pressed('Solid').click()
})

test('a saved Transparent choice survives a restart', async () => {
  app = await launchApp({ separateHome: true })
  await app.window.evaluate(() => localStorage.setItem('o-bros.appearance', JSON.stringify({ background: 'desktop' })))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await expect(app.window.locator('.app-wallpaper-clear')).toBeAttached()
  expect(await app.window.evaluate(() => JSON.parse(localStorage.getItem('o-bros.appearance') ?? '{}').background)).toBe('desktop')
})
