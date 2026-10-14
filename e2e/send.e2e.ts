import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
})

test.afterEach(async () => {
  await app.close()
})

const isWindows = process.platform === 'win32'

async function readTrimmed(fileName: string): Promise<string> {
  const content = await readFile(join(app.projectFolder, fileName), 'utf8').catch(() => '')
  return content.trim()
}

test('sends the selection of a file in the editor to the focused terminal', async () => {
  const command = isWindows
    ? "'sent-from-editor' | Out-File -Encoding ascii send-proof.txt"
    : 'echo sent-from-editor > send-proof.txt'
  await writeFile(join(app.projectFolder, 'notes.txt'), `${command}\n`, 'utf8')

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.xterm-helper-textarea').first().waitFor({ state: 'attached' })

  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('notes')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  await app.window.locator('.cm-content').click()

  await app.window.keyboard.press('ControlOrMeta+A')
  await app.window.keyboard.press('ControlOrMeta+Shift+Enter')
  await expect(app.window.getByText('Send the selection to the terminal')).toBeVisible()
  await app.window.getByRole('button', { name: 'Send', exact: true }).click()

  await expect.poll(() => readTrimmed('send-proof.txt'), { timeout: 20_000 }).toBe('sent-from-editor')
})

test('offers to send a file from the editor right-click menu', async () => {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('notes')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  await app.window.locator('.cm-content').click({ button: 'right' })

  await expect(app.window.getByText('Send file to terminal…')).toBeVisible()
})
