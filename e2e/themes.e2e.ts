import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const SHOTS = process.env.THEME_SHOTS

const WARP_THEME = (name: string, background: string) => `name: ${name}
accent: '#88c0d0'
background: '${background}'
foreground: '#d8dee9'
details: darker
terminal_colors:
  normal:
    black: '#3b4252'
    red: '#bf616a'
    green: '#a3be8c'
    yellow: '#ebcb8b'
    blue: '#81a1c1'
    magenta: '#b48ead'
    cyan: '#88c0d0'
    white: '#e5e9f0'
  bright:
    black: '#4c566a'
    red: '#bf616a'
    green: '#a3be8c'
    yellow: '#ebcb8b'
    blue: '#81a1c1'
    magenta: '#b48ead'
    cyan: '#8fbcbb'
    white: '#eceff4'
`

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

function rootColor(name: string) {
  return app.window.evaluate((variable) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim().toLowerCase(), name)
}

async function recordWindowColors() {
  await app.application.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]
    const overlays: { color?: string; symbolColor?: string }[] = []
    Object.assign(globalThis, { overlays })
    const setOverlay = window.setTitleBarOverlay.bind(window)
    window.setTitleBarOverlay = (options) => {
      overlays.push(options)
      setOverlay(options)
    }
  })
}

function lastOverlay() {
  return app.application.evaluate(() => ((globalThis as Record<string, unknown>).overlays as { color?: string; symbolColor?: string }[]).at(-1) ?? null)
}

async function openAppearance() {
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Appearance' }).click()
}

test('a theme colors the whole app, the terminal and the window buttons, in dark and light mode', async () => {
  app = await launchApp({ separateHome: true })
  await recordWindowColors()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  expect(await rootColor('--color-terminal-solid')).toBe('#000000')

  await openAppearance()
  await expect(app.window.getByText('Selected: O-BROS', { exact: true })).toBeVisible()
  await expect(app.window.getByText('Light theme', { exact: true })).toHaveCount(0)
  if (SHOTS !== undefined) {
    await app.window.screenshot({ path: `${SHOTS}/theme-settings-dark.png` })
  }

  await app.window.getByPlaceholder('Search dark themes').fill('dracula')
  await expect(app.window.getByText('Showing 1 of', { exact: false })).toBeVisible()
  await app.window.getByRole('button', { name: /^Dracula/ }).click()
  await expect.poll(() => rootColor('--color-terminal-solid')).toBe('#282a36')
  await expect(app.window.getByText('Selected: Dracula', { exact: true })).toBeVisible()
  await expect.poll(async () => (await lastOverlay())?.color?.toLowerCase()).toBe(await rootColor('--color-chrome-solid'))

  await app.window.getByRole('button', { name: 'Light', exact: true }).click()
  await expect.poll(() => rootColor('--color-terminal-solid')).toBe('#ffffff')
  await expect.poll(() => app.window.evaluate(() => document.documentElement.dataset.theme)).toBe('light')
  await expect(app.window.getByText('Dark theme', { exact: true })).toHaveCount(0)
  await expect(app.window.getByText('Selected: O-BROS Light', { exact: true })).toBeVisible()
  await expect.poll(async () => (await lastOverlay())?.symbolColor?.toLowerCase()).toBe(await rootColor('--color-text'))
  if (SHOTS !== undefined) {
    await app.window.screenshot({ path: `${SHOTS}/theme-settings-light.png` })
  }

  await app.window.getByPlaceholder('Search light themes').fill('catppuccin')
  await app.window.getByRole('button', { name: /^Catppuccin Latte/ }).click()
  await expect.poll(() => rootColor('--color-terminal-solid')).toBe('#eff1f5')

  await app.window.getByTitle('Projects', { exact: true }).click()
  await expect
    .poll(() => app.window.locator('.terminal-host').first().evaluate((host) => getComputedStyle(host).backgroundColor))
    .toBe('rgb(239, 241, 245)')
  if (SHOTS !== undefined) {
    await app.window.waitForTimeout(500)
    await app.window.screenshot({ path: `${SHOTS}/theme-workspace-light.png` })
  }

  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect.poll(() => rootColor('--color-terminal-solid')).toBe('#282a36')
  await app.window.getByTitle('Projects', { exact: true }).click()
  if (SHOTS !== undefined) {
    await app.window.waitForTimeout(500)
    await app.window.screenshot({ path: `${SHOTS}/theme-workspace-dracula.png` })
  }
})

test('imports a theme file and Warp themes, picks a single import, and removes it again', async () => {
  app = await launchApp({
    separateHome: true,
    homeFiles: {
      '.warp/themes/standard/arctic_night.yaml': WARP_THEME('Arctic Night', '#1b1f27'),
      '.warp/themes/base16/broken.yaml': 'name: Broken\nbackground: nope\n'
    }
  })
  const themeFile = join(dirname(app.projectFolder), 'my_theme.yaml')
  await writeFile(themeFile, WARP_THEME('My Theme', '#101418'), 'utf8')
  await app.application.evaluate((_electron, emptyFolder) => {
    process.env.LOCALAPPDATA = emptyFolder
    process.env.XDG_DATA_HOME = emptyFolder
  }, join(dirname(app.projectFolder), 'no-local-app-data'))
  await openAppearance()

  await app.window.locator('input[type="file"][aria-label="Theme files to import"]').setInputFiles(themeFile)
  await expect(app.window.getByText('Imported My Theme from the file and picked it.')).toBeVisible()
  await expect.poll(() => rootColor('--color-terminal-solid')).toBe('#101418')
  await expect(app.window.getByRole('group', { name: 'Imported dark themes' }).getByText('My Theme', { exact: true })).toBeVisible()

  await app.window.locator('input[type="file"][aria-label="Theme files to import"]').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello": "world"}')
  })
  await expect(app.window.getByText('That file is not a theme O-BROS can read.', { exact: false })).toBeVisible()

  await app.window.getByRole('button', { name: 'Import from Warp' }).click()
  await expect(app.window.getByText('Imported Arctic Night from Warp and picked it.')).toBeVisible()
  await expect.poll(() => rootColor('--color-terminal-solid')).toBe('#1b1f27')

  await app.window.getByTitle('Remove Arctic Night').click()
  await expect.poll(() => rootColor('--color-terminal-solid')).toBe('#000000')
  await expect(app.window.getByText('Selected: O-BROS', { exact: true })).toBeVisible()
  await expect.poll(() => app.window.evaluate(() => JSON.parse(localStorage.getItem('o-bros.importedThemes') ?? '[]').length)).toBe(1)
})
