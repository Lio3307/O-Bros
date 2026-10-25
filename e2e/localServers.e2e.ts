import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const PORT = 47_321
const BUTTON_COOLDOWN_MS = 500

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

async function isAnswering(): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}`)
    return response.ok
  } catch {
    return false
  }
}

test('lists a server started in a terminal and stops it after confirming', async () => {
  test.setTimeout(90_000)
  app = await launchApp({ separateHome: true })
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  const input = app.window.locator('.workspace .xterm-helper-textarea').first()
  await input.waitFor({ state: 'attached' })
  await app.window.waitForTimeout(2500)
  await input.focus()
  await app.window.keyboard.type(`node -e "require('http').createServer((q, s) => s.end('ok')).listen(${PORT})"`)
  await app.window.keyboard.press('Enter')
  await expect.poll(isAnswering, { timeout: 15_000 }).toBe(true)

  await app.window.getByTitle('Activity', { exact: true }).click()
  const row = app.window.locator('.server-row', { hasText: `:${PORT}` })
  await expect(row).toBeVisible({ timeout: 15_000 })
  await expect(row).toContainText(`http://localhost:${PORT}`)

  await row.getByRole('button', { name: 'Stop' }).click()
  const dialog = app.window.locator('.modal')
  await expect(dialog).toContainText(`Stop the server on port ${PORT}?`)
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await app.window.waitForTimeout(BUTTON_COOLDOWN_MS)
  expect(await isAnswering()).toBe(true)

  await row.getByRole('button', { name: 'Stop' }).click()
  await app.window.locator('.modal').getByRole('button', { name: 'Stop server' }).click()
  await expect.poll(isAnswering, { timeout: 10_000 }).toBe(false)
  await expect(row).toHaveCount(0, { timeout: 15_000 })
})
