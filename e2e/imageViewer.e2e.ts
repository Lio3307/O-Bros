import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const ONE_PIXEL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

let app: RunningApp

function svgOfSize(width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#58a6ff"/></svg>`
}

async function openFile(name: string): Promise<void> {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill(name)
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
}

test.beforeEach(async () => {
  app = await launchApp()
})

test.afterEach(async () => {
  await app.close()
})

test('shows an image file as a picture instead of its bytes', async () => {
  await writeFile(join(app.projectFolder, 'pixel.png'), Buffer.from(ONE_PIXEL_PNG, 'base64'))
  await openFile('pixel.png')

  await expect(app.window.locator('.image-preview')).toBeVisible()
  await expect(app.window.locator('.image-info')).toContainText('1 × 1')
  await expect(app.window.locator('.cm-content')).toHaveCount(0)
})

test('follows an image that changes on disk', async () => {
  await writeFile(join(app.projectFolder, 'logo.svg'), svgOfSize(40, 20), 'utf8')
  await openFile('logo.svg')
  await expect(app.window.locator('.image-info')).toContainText('40 × 20')

  await writeFile(join(app.projectFolder, 'logo.svg'), svgOfSize(60, 30), 'utf8')
  await expect(app.window.locator('.image-info')).toContainText('60 × 30', { timeout: 5000 })

  await app.window.getByRole('button', { name: 'Actual size' }).click()
  await expect(app.window.getByRole('button', { name: 'Fit to window' })).toBeVisible()
})
