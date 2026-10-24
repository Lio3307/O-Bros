import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
  await writeFile(join(app.projectFolder, '.env'), 'API_URL=http://old\nPORT=3000\n', 'utf8')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('.env')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  await expect(app.window.locator('.cm-content')).toContainText('API_URL=http://old')
})

test.afterEach(async () => {
  await app.close()
})

test('shows a change an agent made to an open file right away', async () => {
  await writeFile(join(app.projectFolder, '.env'), 'API_URL=https://new.example\nPORT=3000\n', 'utf8')

  await expect(app.window.locator('.cm-content')).toContainText('API_URL=https://new.example', { timeout: 5000 })
  await expect(app.window.getByText('This file changed on disk.')).toHaveCount(0)
})

test('asks before replacing unsaved edits, and reloads when asked', async () => {
  await app.window.locator('.cm-content').click()
  await app.window.keyboard.press('ControlOrMeta+End')
  await app.window.keyboard.type('DEBUG=true')
  await writeFile(join(app.projectFolder, '.env'), 'API_URL=https://new.example\nPORT=3000\n', 'utf8')

  const notice = app.window.locator('.notice', { hasText: 'This file changed on disk.' })
  await expect(notice).toBeVisible({ timeout: 5000 })
  await expect(app.window.locator('.cm-content')).toContainText('DEBUG=true')

  await notice.getByRole('button', { name: 'Reload' }).click()
  await expect(app.window.locator('.cm-content')).toContainText('API_URL=https://new.example')
  await expect(app.window.locator('.cm-content')).not.toContainText('DEBUG=true')
  await expect(notice).toHaveCount(0)
  expect(await readFile(join(app.projectFolder, '.env'), 'utf8')).toBe('API_URL=https://new.example\nPORT=3000\n')
})
