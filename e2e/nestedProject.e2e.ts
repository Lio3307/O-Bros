import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

test('opens a folder inside an opened project as its own project, and lists its terminals once', async () => {
  app = await launchApp({ separateHome: true })
  const inner = join(app.projectFolder, 'PersonalRepo')
  await mkdir(inner)
  await app.application.evaluate(({ dialog }, chosen) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [chosen] })
  }, inner)

  await app.window.getByTitle('Open a folder').click()

  await expect(app.window.locator('.toast', { hasText: 'Added "PersonalRepo" to your sidebar.' })).toBeVisible()
  await expect(app.window.locator('.root-header').getByTitle(inner, { exact: true })).toBeVisible()
  await expect(app.window.locator('.toast', { hasText: 'already inside' })).toHaveCount(0)

  await app.window.locator('.root-header').getByTitle(inner, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await expect(app.window.locator('.row-session', { hasText: 'PersonalRepo' })).toHaveCount(1)
})
