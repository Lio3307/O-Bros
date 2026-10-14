import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
})

test.afterEach(async () => {
  await app.close()
})

test('opens with the shortcut, filters the commands and runs one', async () => {
  await app.window.keyboard.press('ControlOrMeta+Shift+P')
  const search = app.window.getByPlaceholder('Type a command, for example: split, push, agents')
  await expect(search).toBeVisible()

  await search.fill('open agents')
  await expect(app.window.locator('.quick-open-row')).toHaveCount(1)
  await app.window.keyboard.press('Enter')

  await expect(app.window.locator('.settings-title', { hasText: 'Agents' })).toBeVisible()
  await expect(search).toHaveCount(0)
})

test('shows the current shortcut next to a command and says when nothing matches', async () => {
  await app.window.keyboard.press('ControlOrMeta+Shift+P')
  const search = app.window.getByPlaceholder('Type a command, for example: split, push, agents')

  await search.fill('split right')
  await expect(app.window.locator('.quick-open-row').first()).toContainText('Ctrl+Shift+D')

  await search.fill('zzzz-not-a-command')
  await expect(app.window.getByText('No command matches.')).toBeVisible()
})

test('runs a terminal command from the palette', async () => {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.keyboard.press('ControlOrMeta+Shift+P')
  await app.window.getByPlaceholder('Type a command, for example: split, push, agents').fill('new terminal')
  await app.window.keyboard.press('Enter')

  await expect(app.window.locator('.xterm-helper-textarea').first()).toBeAttached({ timeout: 15_000 })
})
