import { expect, test } from '@playwright/test'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { drawTerminalsAsText, launchApp, type RunningApp } from './launchApp'

const ONE_PIXEL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
const PNG_SIGNATURE = '89504e47'

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
  await drawTerminalsAsText(app)
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.terminal-host').last().waitFor()
  await app.window.waitForTimeout(2500)
  await app.application.evaluate(({ clipboard }) => clipboard.writeText('echo from-the-clipboard'))
})

test.afterEach(async () => {
  await app.close()
})

async function rightClickTerminal(): Promise<void> {
  const box = await app.window.locator('.terminal-host').last().boundingBox()
  if (box === null) {
    throw new Error('The terminal is not visible.')
  }
  await app.window.mouse.click(box.x + 200, box.y + 100, { button: 'right' })
}

async function terminalText(): Promise<string> {
  return (await app.window.locator('.xterm-rows').last().innerText()).split('\n').join('')
}

async function copyScreenshot(): Promise<void> {
  await app.application.evaluate(async ({ clipboard, ClipboardItem }, png) => {
    const image = new Blob([Buffer.from(png, 'base64')], { type: 'image/png' })
    await clipboard.write([new ClipboardItem({ 'image/png': image })])
  }, ONE_PIXEL_PNG)
}

async function pastedImages(): Promise<string[]> {
  const folder = join(dirname(app.projectFolder), 'user-data', 'pasted-images')
  const names = await readdir(folder).catch(() => [])
  return names.map((name) => join(folder, name))
}

async function pastedPathIsShown(): Promise<boolean> {
  const [image] = await pastedImages()
  const shown = await terminalText()
  return image !== undefined && shown.includes(image.slice(image.lastIndexOf('image-')))
}

test('right-click opens a menu instead of pasting', async () => {
  await rightClickTerminal()

  const menu = app.window.locator('.popup-menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('button', { name: 'Copy' })).toBeDisabled()
  await expect(menu.getByRole('button', { name: 'Split right' })).toBeVisible()
  await app.window.waitForTimeout(500)
  expect(await terminalText()).not.toContain('from-the-clipboard')

  await menu.getByRole('button', { name: 'Paste' }).click()
  await expect.poll(terminalText, { timeout: 5000 }).toContain('echo from-the-clipboard')
  await expect(menu).toHaveCount(0)
})

test('splits the terminal from its menu', async () => {
  await rightClickTerminal()
  await app.window.locator('.popup-menu').getByRole('button', { name: 'Split right' }).click()

  await expect(app.window.locator('.pane-frame')).toHaveCount(2)
})

test('Ctrl+Shift+V pastes a copied screenshot as the path of a saved image', async () => {
  await copyScreenshot()
  await app.window.locator('.terminal-host').last().click()
  await app.window.keyboard.press('Control+Shift+V')

  await expect.poll(pastedPathIsShown, { timeout: 5000 }).toBe(true)
  const [image] = await pastedImages()
  expect((await readFile(image)).subarray(0, 4).toString('hex')).toBe(PNG_SIGNATURE)
})

test('Paste in the menu pastes a copied screenshot too', async () => {
  await copyScreenshot()
  await rightClickTerminal()
  await app.window.locator('.popup-menu').getByRole('button', { name: 'Paste' }).click()

  await expect.poll(pastedPathIsShown, { timeout: 5000 }).toBe(true)
})
