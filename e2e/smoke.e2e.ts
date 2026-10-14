import { expect, test } from '@playwright/test'
import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
})

test.afterEach(async () => {
  await app.close()
})

async function selectSampleProject(): Promise<void> {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

test('shows the project from settings', async () => {
  await expect(app.window.getByTitle(app.projectFolder, { exact: true })).toBeVisible()
})

test('runs a command in a plain terminal', async () => {
  await selectSampleProject()
  await app.window.getByTitle('Plain terminal in the selected folder').click()

  const terminalInput = app.window.locator('.xterm-helper-textarea').first()
  await terminalInput.waitFor({ state: 'attached' })
  await terminalInput.focus()
  await app.window.keyboard.type('echo done > terminal-proof.txt')
  await app.window.keyboard.press('Enter')

  await expect.poll(() => fileExists(join(app.projectFolder, 'terminal-proof.txt')), { timeout: 20_000 }).toBe(true)
})

test('edits and saves a file opened with quick open', async () => {
  await selectSampleProject()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('notes')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')

  const editor = app.window.locator('.cm-content')
  await editor.waitFor({ state: 'visible' })
  await editor.click()
  await app.window.keyboard.type('added by the smoke test')
  await app.window.keyboard.press('ControlOrMeta+S')

  await expect
    .poll(() => readFile(join(app.projectFolder, 'notes.txt'), 'utf8'), { timeout: 10_000 })
    .toContain('added by the smoke test')
})

test('opens the storage and update settings pages', async () => {
  await app.window.getByTitle('Settings', { exact: true }).click()

  await app.window.getByText('Storage and memory', { exact: true }).first().click()
  await expect(app.window.getByText('App cache', { exact: true })).toBeVisible()

  await app.window.getByText('About and updates', { exact: true }).first().click()
  await expect(app.window.getByText('Updates are only available in the installed app')).toBeVisible()
})
