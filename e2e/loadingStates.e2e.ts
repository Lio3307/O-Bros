import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const SHOTS = process.env.APPEARANCE_SHOTS

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

test('slow lists show what they are loading instead of an empty or wrong message, and every hint goes away', async () => {
  app = await launchApp({ separateHome: true })
  await expect(app.window.locator('.startup')).toHaveCount(0)

  await app.application.evaluate(({ ipcMain }) => {
    ipcMain.removeHandler('history:list')
    ipcMain.handle('history:list', () => new Promise((resolve) => setTimeout(() => resolve([]), 2500)))
  })
  await app.window.getByTitle('History', { exact: true }).click()
  await expect(app.window.getByText('Reading your conversations…')).toBeVisible()
  await expect(app.window.getByText('No sessions found yet.', { exact: false })).toHaveCount(0)
  if (SHOTS !== undefined) {
    await app.window.waitForTimeout(500)
    await app.window.screenshot({ path: `${SHOTS}/loading-history.png` })
  }
  await expect(app.window.getByText('No sessions found yet.', { exact: false })).toBeVisible({ timeout: 10_000 })
  await expect(app.window.getByText('Reading your conversations…')).toHaveCount(0)

  await app.window.getByTitle('Projects', { exact: true }).click()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await expect(app.window.getByText('Starting the terminal…')).toHaveCount(0, { timeout: 15_000 })

  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('notes')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  await expect(app.window.locator('.cm-content')).toContainText('first line')
  await expect(app.window.getByText('Opening notes.txt…')).toHaveCount(0)
})
